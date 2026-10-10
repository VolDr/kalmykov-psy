import { randomBytes, randomInt } from 'node:crypto';
import type { GameQuestion } from '../../db/schema';
import type { PlayerView, RoomPhase, RoomView } from '$lib/data/game-room-types';
import { MAX_TEXT_ANSWER, isAnswerCorrect } from '$lib/data/game-answer-match';
import { multiFraction } from '$lib/data/game-multi-score';

/**
 * Комнаты викторины живут в памяти процесса (сайт работает одним процессом, см.
 * rate-limit.server.ts). После перезапуска сервера комнаты пропадают — игра на
 * вечер, хранить её в БД незачем.
 */

export const MAX_PLAYERS = 12;
const MAX_ROOMS = 200;
const ROOM_TTL_MS = 3 * 60 * 60 * 1000;
// Запас на сетевую задержку: ответ, отправленный до нуля на таймере клиента, засчитывается
const ANSWER_GRACE_MS = 1500;
// Игрок, потерявший связь меньше этого времени назад, считается «на месте»: перезагрузка
// страницы или кратковременный обрыв не должны закрывать за него вопрос
const PRESENCE_GRACE_MS = 8000;
// Ведущий, которого нет дольше этого времени, передаёт роль тому, кто в сети
const HOST_GRACE_MS = 30_000;
// Обратный отсчёт «3… 2… 1…» перед каждым вопросом; сам вопрос в это время скрыт
const COUNTDOWN_MS = 3000;
// Сколько показываем верный ответ, прежде чем сам начнётся следующий вопрос
const REVEAL_MS = 3000;
// Если у вопроса есть пояснение, показ ответа длится дольше, чтобы его успели прочитать:
// по 60 мс на символ, но не меньше 2 и не больше 12 секунд сверху
const EXPLANATION_MS_PER_CHAR = 60;
const EXPLANATION_MIN_EXTRA_MS = 2000;
const EXPLANATION_MAX_EXTRA_MS = 12_000;

export function revealDurationMs(explanation: string | undefined): number {
	if (!explanation) return REVEAL_MS;
	const extra = Math.min(
		EXPLANATION_MAX_EXTRA_MS,
		Math.max(EXPLANATION_MIN_EXTRA_MS, explanation.length * EXPLANATION_MS_PER_CHAR)
	);
	return REVEAL_MS + extra;
}
const BASE_POINTS = 500;
const SPEED_POINTS = 500;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
const NAME_MAX = 20;

interface Player {
	id: string;
	token: string;
	name: string;
	score: number;
	/** Сколько открытых SSE-потоков (вкладок) у игрока */
	streams: number;
	/** Когда у игрока последний раз закрылся поток (или он создан) */
	lastSeenAt: number;
	answer: {
		option: number | null;
		/** Отмеченные варианты (вопрос с несколькими ответами) */
		options: number[] | null;
		text: string | null;
		/** Ответ полностью верный */
		correct: boolean;
		/** Доля баллов: 1 — всё верно, 0 — неверно, между — часть верных у вопроса с несколькими ответами */
		fraction: number;
		at: number;
	} | null;
	gain: number | null;
}

interface Subscriber {
	playerId: string;
	send: (view: RoomView) => void;
}

interface Room {
	code: string;
	quizTitle: string;
	questions: GameQuestion[];
	timeLimitMs: number;
	hostId: string;
	players: Map<string, Player>;
	phase: RoomPhase;
	index: number;
	endsAt: number | null;
	/** Когда после показа ответа сам начнётся следующий вопрос */
	nextAt: number | null;
	/** Сколько длится показ ответа у текущего вопроса (дольше, если есть пояснение) */
	revealMs: number;
	/** Когда закончится обратный отсчёт и откроется вопрос */
	startsAt: number | null;
	/** Пауза ведущего: таймер заморожен, содержимое вопроса скрыто от всех */
	paused: boolean;
	pausedAt: number;
	/** Сколько оставалось до конца вопроса или показа ответа в момент паузы */
	pausedRemainingMs: number;
	timer: ReturnType<typeof setTimeout> | null;
	subscribers: Set<Subscriber>;
	touchedAt: number;
}

export type RoomResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// globalThis — чтобы горячая перезагрузка модулей в dev не теряла комнаты
const rooms: Map<string, Room> = ((
	globalThis as { __gameRooms?: Map<string, Room> }
).__gameRooms ??= new Map());

function fail(error: string): { ok: false; error: string } {
	return { ok: false, error };
}

function makeCode(): string {
	for (let attempt = 0; attempt < 20; attempt++) {
		let code = '';
		for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
		if (!rooms.has(code)) return code;
	}
	throw new Error('Не удалось подобрать код комнаты');
}

export function normalizeCode(raw: string): string {
	return raw.trim().toUpperCase();
}

function cleanName(raw: unknown): string {
	return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '';
}

function newPlayer(name: string): Player {
	return {
		id: randomBytes(6).toString('hex'),
		token: randomBytes(24).toString('hex'),
		name,
		score: 0,
		streams: 0,
		lastSeenAt: Date.now(),
		answer: null,
		gain: null
	};
}

function playerByToken(room: Room, token: string | undefined): Player | null {
	if (!token) return null;
	for (const player of room.players.values()) {
		if (player.token === token) return player;
	}
	return null;
}

function clearTimer(room: Room) {
	if (room.timer) clearTimeout(room.timer);
	room.timer = null;
}

export function viewFor(room: Room, viewer: Player): RoomView {
	const inQuestion = room.phase === 'question';
	const revealed = room.phase === 'reveal';
	const question = room.questions[room.index];
	const showQuestion = (inQuestion || revealed) && question;
	// На паузе вопрос, варианты и верный ответ скрыты, чтобы нельзя было подглядеть
	const hide = room.paused;

	const isText = question?.type === 'text';

	let counts: number[] | null = null;
	if (revealed && !hide && question && question.type !== 'text') {
		const tally = question.options.map(() => 0);
		for (const player of room.players.values()) {
			if (player.answer?.option != null) tally[player.answer.option]++;
			for (const option of player.answer?.options ?? []) tally[option]++;
		}
		counts = tally;
	}

	const sorted = [...room.players.values()];
	if (room.phase === 'reveal' || room.phase === 'finished')
		sorted.sort((a, b) => b.score - a.score);

	const players: PlayerView[] = sorted.map((p) => ({
		id: p.id,
		name: p.name,
		score: p.score,
		isHost: p.id === room.hostId,
		connected: p.streams > 0,
		answered: p.answer !== null,
		gain: revealed && !hide ? p.gain : null,
		// Чужие ответы раскрываем только после закрытия вопроса
		answerText: revealed && !hide && isText ? (p.answer?.text ?? null) : null
	}));

	return {
		code: room.code,
		quizTitle: room.quizTitle,
		phase: room.phase,
		index: room.phase === 'lobby' ? -1 : room.index,
		total: room.questions.length,
		timeLimitMs: room.timeLimitMs,
		question: showQuestion
			? {
					text: hide ? '' : question.text,
					// kind остаётся, чтобы форма ответа не пересоздалась и не потеряла набранное
					kind: question.type === 'text' ? 'text' : question.type === 'multi' ? 'multi' : 'choice',
					options: hide || question.type === 'text' ? [] : question.options,
					image: hide ? null : (question.image ?? null)
				}
			: null,
		paused: room.paused,
		endsAt: inQuestion && !hide ? room.endsAt : null,
		nextAt: revealed && !hide ? room.nextAt : null,
		startsAt: room.phase === 'countdown' && !hide ? room.startsAt : null,
		countdownMs: COUNTDOWN_MS,
		revealMs: room.revealMs,
		serverNow: Date.now(),
		correct:
			revealed && !hide && question && question.type !== 'text' && question.type !== 'multi'
				? question.correct
				: null,
		correctOptions: revealed && !hide && question?.type === 'multi' ? question.correct : null,
		counts,
		explanation: revealed && !hide ? (question?.explanation ?? null) : null,
		correctAnswers: revealed && !hide && question?.type === 'text' ? question.answers : null,
		players,
		you: {
			id: viewer.id,
			isHost: viewer.id === room.hostId,
			answer: viewer.answer?.option ?? null,
			answers: viewer.answer?.options ?? null,
			answerText: viewer.answer?.text ?? null,
			correct: !revealed || hide ? null : (viewer.answer?.correct ?? false),
			fraction: !revealed || hide ? null : (viewer.answer?.fraction ?? 0)
		}
	};
}

function emit(room: Room) {
	room.touchedAt = Date.now();
	for (const sub of room.subscribers) {
		const viewer = room.players.get(sub.playerId);
		if (!viewer) continue;
		try {
			sub.send(viewFor(room, viewer));
		} catch {
			room.subscribers.delete(sub);
		}
	}
}

function reveal(room: Room) {
	if (room.phase !== 'question') return;
	clearTimer(room);
	for (const player of room.players.values()) {
		if (player.answer && player.answer.fraction > 0) {
			const left = Math.max(0, (room.endsAt ?? 0) - player.answer.at);
			const full = BASE_POINTS + Math.round(SPEED_POINTS * Math.min(1, left / room.timeLimitMs));
			const gain = Math.round(full * player.answer.fraction);
			player.gain = gain;
			player.score += gain;
		} else {
			player.gain = 0;
		}
	}
	room.phase = 'reveal';
	room.endsAt = null;
	room.revealMs = revealDurationMs(room.questions[room.index].explanation);
	room.nextAt = Date.now() + room.revealMs;
	room.timer = setTimeout(() => advance(room), room.revealMs);
	emit(room);
}

/** Конец показа ответа: следующий вопрос или итоги. Идёт сам, ведущий не нужен. */
function advance(room: Room) {
	if (room.phase !== 'reveal') return;
	clearTimer(room);
	room.nextAt = null;
	if (room.index + 1 >= room.questions.length) {
		room.phase = 'finished';
		emit(room);
	} else {
		startQuestion(room, room.index + 1);
	}
}

/** Начинает отсчёт перед вопросом index; сам вопрос откроется по таймеру. */
function startQuestion(room: Room, index: number) {
	clearTimer(room);
	room.index = index;
	room.phase = 'countdown';
	room.startsAt = Date.now() + COUNTDOWN_MS;
	for (const player of room.players.values()) {
		player.answer = null;
		player.gain = null;
	}
	room.timer = setTimeout(() => beginQuestion(room), COUNTDOWN_MS);
	emit(room);
}

/** Отсчёт закончился: показываем вопрос и запускаем время на ответ. */
function beginQuestion(room: Room) {
	if (room.phase !== 'countdown') return;
	clearTimer(room);
	room.startsAt = null;
	room.phase = 'question';
	room.endsAt = Date.now() + room.timeLimitMs;
	room.timer = setTimeout(() => reveal(room), room.timeLimitMs + ANSWER_GRACE_MS);
	emit(room);
}

function isPresent(player: Player): boolean {
	return player.streams > 0 || Date.now() - player.lastSeenAt < PRESENCE_GRACE_MS;
}

/** Все, кто на месте, уже ответили — незачем ждать таймер. */
function revealIfEveryoneAnswered(room: Room) {
	if (room.phase !== 'question' || room.paused) return;
	const present = [...room.players.values()].filter(isPresent);
	if (present.length > 0 && present.every((p) => p.answer)) reveal(room);
}

/**
 * Если ведущего давно нет в сети, роль переходит к тому, кто в сети, — иначе игра
 * зависнет на кнопках «начать» и «сыграть ещё раз». Вернувшийся ведущий становится обычным игроком.
 */
function promoteHostIfGone(room: Room, candidate?: Player) {
	const host = room.players.get(room.hostId);
	if (!host || host.streams > 0 || Date.now() - host.lastSeenAt < HOST_GRACE_MS) return;
	const next =
		candidate && candidate.streams > 0
			? candidate
			: [...room.players.values()].find((p) => p.streams > 0);
	if (!next || next.id === host.id) return;
	room.hostId = next.id;
	emit(room);
}

/** Отложенная проверка после обрыва: вернулся ли игрок, не пора ли закрыть вопрос / сменить ведущего. */
function scheduleAfterDisconnect(room: Room, player: Player) {
	const index = room.index;
	const recheck = setTimeout(() => {
		if (rooms.get(room.code) !== room) return;
		if (room.phase === 'question' && room.index === index) revealIfEveryoneAnswered(room);
		emit(room);
	}, PRESENCE_GRACE_MS + 100);
	recheck.unref();

	if (player.id === room.hostId) {
		const handover = setTimeout(() => {
			if (rooms.get(room.code) === room) promoteHostIfGone(room);
		}, HOST_GRACE_MS + 100);
		handover.unref();
	}
}

export function createRoom(
	quiz: { title: string; timeLimit: number; questions: GameQuestion[] },
	hostName: unknown
): RoomResult<{ code: string; token: string }> {
	const name = cleanName(hostName);
	if (!name) return fail('Введите имя');
	if (rooms.size >= MAX_ROOMS) return fail('Сейчас слишком много игр, попробуйте позже');

	const host = newPlayer(name);
	const code = makeCode();
	rooms.set(code, {
		code,
		quizTitle: quiz.title,
		questions: quiz.questions,
		timeLimitMs: quiz.timeLimit * 1000,
		hostId: host.id,
		players: new Map([[host.id, host]]),
		phase: 'lobby',
		index: -1,
		endsAt: null,
		nextAt: null,
		revealMs: REVEAL_MS,
		startsAt: null,
		paused: false,
		pausedAt: 0,
		pausedRemainingMs: 0,
		timer: null,
		subscribers: new Set(),
		touchedAt: Date.now()
	});
	return { ok: true, code, token: host.token };
}

export function roomExists(code: string): boolean {
	return rooms.has(code);
}

export function getRoomPreview(code: string, token: string | undefined) {
	const room = rooms.get(code);
	if (!room) return null;
	return {
		quizTitle: room.quizTitle,
		phase: room.phase,
		full: room.players.size >= MAX_PLAYERS,
		joined: playerByToken(room, token) !== null
	};
}

export function joinRoom(
	code: string,
	name: unknown,
	token: string | undefined
): RoomResult<{ token: string }> {
	const room = rooms.get(code);
	if (!room) return fail('Комната не найдена');

	const existing = playerByToken(room, token);
	if (existing) return { ok: true, token: existing.token };

	const clean = cleanName(name);
	if (!clean) return fail('Введите имя');

	// Потерял cookie (другой браузер, очистка, режим инкогнито) — можно вернуться под
	// своим именем, если этого игрока сейчас нет в сети. Старое устройство потеряет доступ.
	const sameName = [...room.players.values()].find(
		(p) => p.name.toLowerCase() === clean.toLowerCase()
	);
	if (sameName) {
		if (sameName.streams > 0) return fail('Это имя уже занято');
		sameName.token = randomBytes(24).toString('hex');
		emit(room);
		return { ok: true, token: sameName.token };
	}

	if (room.phase !== 'lobby') return fail('Игра уже началась. Дождитесь следующей партии');
	if (room.players.size >= MAX_PLAYERS) return fail('В комнате нет мест');

	const player = newPlayer(clean);
	room.players.set(player.id, player);
	emit(room);
	return { ok: true, token: player.token };
}

function hostOf(room: Room, token: string | undefined): Player | null {
	const player = playerByToken(room, token);
	return player && player.id === room.hostId ? player : null;
}

export function startGame(code: string, token: string | undefined): RoomResult {
	const room = rooms.get(code);
	if (!room) return fail('Комната не найдена');
	if (!hostOf(room, token)) return fail('Начать игру может только ведущий');
	if (room.phase !== 'lobby') return fail('Игра уже идёт');
	startQuestion(room, 0);
	return { ok: true };
}

export function submitAnswer(
	code: string,
	token: string | undefined,
	answer: { option?: unknown; options?: unknown; text?: unknown }
): RoomResult {
	const room = rooms.get(code);
	if (!room) return fail('Комната не найдена');
	const player = playerByToken(room, token);
	if (!player) return fail('Вы не участвуете в этой игре');
	if (room.paused) return fail('Игра на паузе');
	if (room.phase !== 'question' || !room.endsAt) return fail('Сейчас нельзя отвечать');
	if (Date.now() > room.endsAt + ANSWER_GRACE_MS) return fail('Время вышло');
	if (player.answer) return fail('Вы уже ответили');

	const question = room.questions[room.index];
	const at = Date.now();
	if (question.type === 'text') {
		const text = typeof answer.text === 'string' ? answer.text.replace(/\s+/g, ' ').trim() : '';
		if (!text) return fail('Введите ответ');
		const typed = text.slice(0, MAX_TEXT_ANSWER);
		const correct = isAnswerCorrect(typed, question.answers);
		player.answer = {
			option: null,
			options: null,
			text: typed,
			correct,
			fraction: correct ? 1 : 0,
			at
		};
	} else if (question.type === 'multi') {
		const picked = answer.options;
		if (!Array.isArray(picked) || picked.length === 0) return fail('Выберите хотя бы один вариант');
		const valid = picked.every(
			(o) => typeof o === 'number' && Number.isInteger(o) && o >= 0 && o < question.options.length
		);
		if (!valid || new Set(picked).size !== picked.length) return fail('Нет такого варианта');
		const options = [...(picked as number[])].sort((a, b) => a - b);
		const fraction = multiFraction(options, question.correct);
		player.answer = { option: null, options, text: null, correct: fraction === 1, fraction, at };
	} else {
		const option = answer.option;
		if (
			typeof option !== 'number' ||
			!Number.isInteger(option) ||
			option < 0 ||
			option >= question.options.length
		) {
			return fail('Нет такого варианта');
		}
		const correct = option === question.correct;
		player.answer = {
			option,
			options: null,
			text: null,
			correct,
			fraction: correct ? 1 : 0,
			at
		};
	}
	emit(room);
	revealIfEveryoneAnswered(room);
	return { ok: true };
}

export function pauseGame(code: string, token: string | undefined): RoomResult {
	const room = rooms.get(code);
	if (!room) return fail('Комната не найдена');
	if (!hostOf(room, token)) return fail('Поставить паузу может только ведущий');
	if (room.paused) return fail('Игра уже на паузе');
	if (room.phase !== 'countdown' && room.phase !== 'question' && room.phase !== 'reveal') {
		return fail('Паузу можно поставить только во время вопроса');
	}
	const now = Date.now();
	const deadline =
		room.phase === 'countdown'
			? room.startsAt
			: room.phase === 'question'
				? room.endsAt
				: room.nextAt;
	room.pausedRemainingMs = Math.max(0, (deadline ?? now) - now);
	room.pausedAt = now;
	room.paused = true;
	clearTimer(room);
	emit(room);
	return { ok: true };
}

export function resumeGame(code: string, token: string | undefined): RoomResult {
	const room = rooms.get(code);
	if (!room) return fail('Комната не найдена');
	if (!hostOf(room, token)) return fail('Снять паузу может только ведущий');
	if (!room.paused) return fail('Игра не на паузе');

	const now = Date.now();
	const remaining = room.pausedRemainingMs;
	room.paused = false;
	if (room.phase === 'question') {
		room.endsAt = now + remaining;
		// Время пауз не должно влиять на очки за скорость: уже данные ответы сдвигаем вместе с дедлайном
		for (const player of room.players.values()) {
			if (player.answer) player.answer.at += now - room.pausedAt;
		}
		room.timer = setTimeout(() => reveal(room), remaining + ANSWER_GRACE_MS);
	} else if (room.phase === 'countdown') {
		room.startsAt = now + remaining;
		room.timer = setTimeout(() => beginQuestion(room), remaining);
	} else {
		room.nextAt = now + remaining;
		room.timer = setTimeout(() => advance(room), remaining);
	}
	emit(room);
	// Пока шла пауза, кто-то мог уйти — тогда ждать больше некого
	revealIfEveryoneAnswered(room);
	return { ok: true };
}

export function restartGame(code: string, token: string | undefined): RoomResult {
	const room = rooms.get(code);
	if (!room) return fail('Комната не найдена');
	if (!hostOf(room, token)) return fail('Начать заново может только ведущий');
	if (room.phase !== 'finished') return fail('Игра ещё не закончилась');
	clearTimer(room);
	for (const player of room.players.values()) {
		player.score = 0;
		player.answer = null;
		player.gain = null;
	}
	room.phase = 'lobby';
	room.index = -1;
	room.endsAt = null;
	room.nextAt = null;
	room.startsAt = null;
	room.paused = false;
	emit(room);
	return { ok: true };
}

/**
 * Подключает SSE-поток игрока. Сразу отдаёт текущее состояние; возвращает функцию
 * отписки. null — токен не от этой комнаты (например, после перезапуска сервера).
 */
export function subscribe(
	code: string,
	token: string | undefined,
	send: (view: RoomView) => void
): (() => void) | null {
	const room = rooms.get(code);
	const player = room ? playerByToken(room, token) : null;
	if (!room || !player) return null;

	const sub: Subscriber = { playerId: player.id, send };
	room.subscribers.add(sub);
	player.streams++;
	promoteHostIfGone(room, player);
	emit(room);

	return () => {
		if (!room.subscribers.delete(sub)) return;
		player.streams = Math.max(0, player.streams - 1);
		player.lastSeenAt = Date.now();
		emit(room);
		if (player.streams === 0) scheduleAfterDisconnect(room, player);
	};
}

function dropRoom(room: Room) {
	clearTimer(room);
	rooms.delete(room.code);
}

const sweeper = setInterval(
	() => {
		const now = Date.now();
		for (const room of rooms.values()) {
			if (room.subscribers.size === 0 && now - room.touchedAt > ROOM_TTL_MS) dropRoom(room);
		}
		for (const [ip, times] of creations) {
			if (times.every((t) => now - t >= CREATE_WINDOW_MS)) creations.delete(ip);
		}
	},
	10 * 60 * 1000
);
sweeper.unref();

// Не больше нескольких новых комнат в час с одного адреса — иначе можно забить память
const creations = new Map<string, number[]>();
const CREATE_LIMIT = 10;
const CREATE_WINDOW_MS = 60 * 60 * 1000;

export function isCreateLimited(ip: string): boolean {
	const now = Date.now();
	const recent = (creations.get(ip) ?? []).filter((t) => now - t < CREATE_WINDOW_MS);
	if (recent.length >= CREATE_LIMIT) {
		creations.set(ip, recent);
		return true;
	}
	recent.push(now);
	creations.set(ip, recent);
	return false;
}

export function _resetForTest() {
	for (const room of rooms.values()) clearTimer(room);
	rooms.clear();
	creations.clear();
}
