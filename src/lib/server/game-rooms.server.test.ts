import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoomView } from '$lib/data/game-room-types';
import {
	_resetForTest,
	createRoom,
	joinRoom,
	pauseGame,
	resumeGame,
	restartGame,
	revealDurationMs,
	startGame,
	submitAnswer,
	subscribe
} from './game-rooms.server';

const quiz = {
	title: 'Тест',
	timeLimit: 10,
	questions: [
		{ text: 'Q1', options: ['a', 'b', 'c'], correct: 1 },
		{ text: 'Q2', options: ['x', 'y'], correct: 0 },
		{ type: 'text' as const, text: 'Q3', answers: ['Канберра', 'Canberra'] }
	]
};

/** Запускает игру и пропускает обратный отсчёт, чтобы сразу оказаться на первом вопросе. */
function begin(code: string, token: string) {
	startGame(code, token);
	vi.advanceTimersByTime(3000);
}

const multiQuiz = {
	title: 'Мульти',
	timeLimit: 10,
	questions: [
		{ type: 'multi' as const, text: 'M1', options: ['a', 'b', 'c', 'd'], correct: [0, 2] }
	]
};

function setupMulti() {
	const created = createRoom(multiQuiz, 'Анна');
	if (!created.ok) throw new Error(created.error);
	const joined = joinRoom(created.code, 'Борис', undefined);
	if (!joined.ok) throw new Error(joined.error);
	const views: Record<string, RoomView | null> = { host: null, guest: null };
	subscribe(created.code, created.token, (v) => (views.host = v));
	subscribe(created.code, joined.token, (v) => (views.guest = v));
	begin(created.code, created.token);
	return { code: created.code, host: created.token, guest: joined.token, views };
}

function setup() {
	const created = createRoom(quiz, 'Анна');
	if (!created.ok) throw new Error(created.error);
	const joined = joinRoom(created.code, 'Борис', undefined);
	if (!joined.ok) throw new Error(joined.error);
	const views: Record<string, RoomView | null> = { host: null, guest: null };
	subscribe(created.code, created.token, (v) => (views.host = v));
	subscribe(created.code, joined.token, (v) => (views.guest = v));
	return { code: created.code, host: created.token, guest: joined.token, views };
}

describe('game rooms', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		_resetForTest();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('не пускает дубликат имени и пустое имя', () => {
		const { code } = setup();
		expect(joinRoom(code, 'борис', undefined).ok).toBe(false);
		expect(joinRoom(code, '   ', undefined).ok).toBe(false);
	});

	it('возвращает тот же токен при повторном входе', () => {
		const { code, guest } = setup();
		const again = joinRoom(code, 'Другое', guest);
		expect(again).toEqual({ ok: true, token: guest });
	});

	it('начать игру может только ведущий', () => {
		const { code, host, guest } = setup();
		expect(startGame(code, guest).ok).toBe(false);
		expect(startGame(code, host).ok).toBe(true);
	});

	it('не выдаёт верный ответ во время вопроса и раскрывает после', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		expect(views.guest?.phase).toBe('question');
		expect(views.guest?.correct).toBeNull();
		expect(JSON.stringify(views.guest)).not.toContain('"correct":1');

		submitAnswer(code, host, { option: 1 });
		submitAnswer(code, guest, { option: 0 });
		expect(views.guest?.phase).toBe('reveal');
		expect(views.guest?.correct).toBe(1);
		expect(views.guest?.counts).toEqual([1, 1, 0]);
	});

	it('даёт больше очков за быстрый ответ и ничего за неверный', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		submitAnswer(code, host, { option: 1 });
		vi.advanceTimersByTime(5000);
		submitAnswer(code, guest, { option: 1 });
		const byName = Object.fromEntries(views.host!.players.map((p) => [p.name, p.score]));
		expect(byName['Анна']).toBe(1000);
		expect(byName['Борис']).toBe(750);

		vi.advanceTimersByTime(6000);
		submitAnswer(code, host, { option: 1 });
		submitAnswer(code, guest, { option: 0 });
		expect(views.host!.players.find((p) => p.name === 'Анна')?.gain).toBe(0);
	});

	it('сам проходит показ ответа, отсчёт и следующий вопрос; после последнего — итоги', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		submitAnswer(code, host, { option: 1 });
		submitAnswer(code, guest, { option: 1 });
		expect(views.host?.phase).toBe('reveal');
		expect(views.host?.revealMs).toBe(3000);
		expect(views.host?.nextAt).toBeGreaterThan(views.host!.serverNow);

		vi.advanceTimersByTime(2900);
		expect(views.host?.phase).toBe('reveal');
		vi.advanceTimersByTime(200);
		expect(views.host?.phase).toBe('countdown');
		expect(views.host?.index).toBe(1);
		expect(views.host?.nextAt).toBeNull();

		vi.advanceTimersByTime(2800);
		expect(views.host?.phase).toBe('countdown');
		vi.advanceTimersByTime(200);
		expect(views.host?.phase).toBe('question');
		expect(views.host?.index).toBe(1);

		// дальше без единого ответа: время вопроса, показ ответа, отсчёт, следующий вопрос
		vi.advanceTimersByTime(10_000 + 1500 + 3000 + 3000 + 100);
		expect(views.host?.phase).toBe('question');
		expect(views.host?.index).toBe(2);
		// после последнего вопроса отсчёта нет — сразу итоги
		vi.advanceTimersByTime(10_000 + 1500 + 3000 + 100);
		expect(views.host?.phase).toBe('finished');
	});

	it('перед каждым вопросом идёт отсчёт: вопрос скрыт, ответить нельзя, таймер не идёт', () => {
		const { code, host, guest, views } = setup();
		startGame(code, host);
		for (const view of [views.host, views.guest]) {
			expect(view?.phase).toBe('countdown');
			expect(view?.countdownMs).toBe(3000);
			expect(view?.startsAt).toBeGreaterThan(view!.serverNow);
			expect(view?.question).toBeNull();
			expect(view?.endsAt).toBeNull();
		}
		expect(JSON.stringify(views.guest)).not.toContain('Q1');
		expect(submitAnswer(code, guest, { option: 1 }).ok).toBe(false);

		vi.advanceTimersByTime(2900);
		expect(views.host?.phase).toBe('countdown');
		vi.advanceTimersByTime(200);
		expect(views.host?.phase).toBe('question');
		expect(views.host?.question?.text).toBe('Q1');
		expect(views.host?.startsAt).toBeNull();
		// время на ответ отсчитывается только с момента открытия вопроса
		expect(views.host!.endsAt! - Date.now()).toBe(10_000 - 100);
	});

	it('пауза во время отсчёта замораживает его', () => {
		const { code, host, views } = setup();
		startGame(code, host);
		vi.advanceTimersByTime(1000);
		expect(pauseGame(code, host).ok).toBe(true);
		expect(views.host?.startsAt).toBeNull();
		vi.advanceTimersByTime(60_000);
		expect(views.host?.phase).toBe('countdown');

		resumeGame(code, host);
		expect(views.host!.startsAt! - Date.now()).toBe(2000);
		vi.advanceTimersByTime(2100);
		expect(views.host?.phase).toBe('question');
	});

	it('закрывает вопрос по таймеру, даже если никто не ответил', () => {
		const { code, host, views } = setup();
		begin(code, host);
		vi.advanceTimersByTime(10_000 + 1500);
		expect(views.host?.phase).toBe('reveal');
	});

	it('не принимает повторный и запоздалый ответ', () => {
		const { code, host, views } = setup();
		begin(code, host);
		expect(submitAnswer(code, host, { option: 1 }).ok).toBe(true);
		expect(submitAnswer(code, host, { option: 0 }).ok).toBe(false);
		vi.advanceTimersByTime(12_000);
		expect(views.host?.phase).toBe('reveal');
		expect(submitAnswer(code, host, { option: 0 }).ok).toBe(false);
	});

	it('доигрывает до конца и начинает заново с нулевым счётом', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		submitAnswer(code, host, { option: 1 });
		submitAnswer(code, guest, { option: 1 });
		vi.advanceTimersByTime(6000);
		submitAnswer(code, host, { option: 0 });
		submitAnswer(code, guest, { option: 0 });
		vi.advanceTimersByTime(6000);
		submitAnswer(code, host, { text: 'канберра' });
		submitAnswer(code, guest, { text: 'Сидней' });
		vi.advanceTimersByTime(3000);
		expect(views.host?.phase).toBe('finished');

		expect(restartGame(code, guest).ok).toBe(false);
		expect(restartGame(code, host).ok).toBe(true);
		expect(views.host?.phase).toBe('lobby');
		expect(views.host?.players.every((p) => p.score === 0)).toBe(true);
	});

	it('проверяет ответ с вводом и раскрывает написанное только после вопроса', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		for (let i = 0; i < 2; i++) {
			submitAnswer(code, host, { option: 0 });
			submitAnswer(code, guest, { option: 0 });
			vi.advanceTimersByTime(6000);
		}
		expect(views.guest?.question).toMatchObject({ kind: 'text', options: [] });

		expect(submitAnswer(code, host, { text: '   ' }).ok).toBe(false);
		expect(submitAnswer(code, host, { text: 'Канбера!' }).ok).toBe(true);
		expect(views.guest?.players.every((p) => p.answerText === null)).toBe(true);
		expect(JSON.stringify(views.guest)).not.toContain('Canberra');

		submitAnswer(code, guest, { text: 'Мельбурн' });
		expect(views.guest?.phase).toBe('reveal');
		expect(views.guest?.correctAnswers).toEqual(['Канберра', 'Canberra']);
		expect(views.guest?.you.correct).toBe(false);
		expect(views.host?.you.correct).toBe(true);
		const byName = Object.fromEntries(views.host!.players.map((p) => [p.name, p]));
		expect(byName['Анна'].answerText).toBe('Канбера!');
		expect(byName['Анна'].gain).toBeGreaterThan(500);
		expect(byName['Борис'].gain).toBe(0);
	});

	it('не принимает номер варианта на вопрос с вводом', () => {
		const { code, host } = setup();
		begin(code, host);
		for (let i = 0; i < 2; i++) {
			submitAnswer(code, host, { option: 0 });
			vi.advanceTimersByTime(10_000 + 1500 + 3000 + 3000);
		}
		expect(submitAnswer(code, host, { option: 0 }).ok).toBe(false);
	});

	it('пауза замораживает таймер и прячет вопрос, варианты и ответ', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		vi.advanceTimersByTime(4000);

		expect(pauseGame(code, guest).ok).toBe(false);
		expect(pauseGame(code, host).ok).toBe(true);
		expect(pauseGame(code, host).ok).toBe(false);
		for (const view of [views.host, views.guest]) {
			expect(view?.paused).toBe(true);
			expect(view?.question).toEqual({ text: '', kind: 'choice', options: [], image: null });
			expect(view?.endsAt).toBeNull();
		}
		expect(JSON.stringify(views.guest)).not.toContain('Q1');

		// сколько ни стой на паузе, вопрос не закрывается
		vi.advanceTimersByTime(10 * 60_000);
		expect(views.host?.phase).toBe('question');
		expect(submitAnswer(code, guest, { option: 1 }).ok).toBe(false);

		expect(resumeGame(code, guest).ok).toBe(false);
		expect(resumeGame(code, host).ok).toBe(true);
		expect(views.guest?.paused).toBe(false);
		expect(views.guest?.question?.text).toBe('Q1');
		// осталось 6 из 10 секунд
		expect(views.guest!.endsAt! - Date.now()).toBe(6000);
		vi.advanceTimersByTime(6000 + 1500);
		expect(views.host?.phase).toBe('reveal');
	});

	it('пауза не меняет очки за скорость', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		vi.advanceTimersByTime(2000);
		submitAnswer(code, host, { option: 1 }); // осталось 8 из 10 секунд
		pauseGame(code, host);
		vi.advanceTimersByTime(5 * 60_000);
		resumeGame(code, host);
		submitAnswer(code, guest, { option: 1 }); // сразу после паузы: осталось те же 8 секунд
		const byName = Object.fromEntries(views.host!.players.map((p) => [p.name, p.score]));
		expect(byName['Анна']).toBe(900);
		expect(byName['Борис']).toBe(900);
	});

	it('пауза на показе ответа откладывает переход к следующему вопросу', () => {
		const { code, host, guest, views } = setup();
		begin(code, host);
		submitAnswer(code, host, { option: 1 });
		submitAnswer(code, guest, { option: 1 });
		expect(views.host?.phase).toBe('reveal');

		vi.advanceTimersByTime(1000);
		pauseGame(code, host);
		expect(views.guest?.correct).toBeNull();
		expect(views.guest?.counts).toBeNull();
		vi.advanceTimersByTime(60_000);
		expect(views.host?.phase).toBe('reveal');

		resumeGame(code, host);
		expect(views.guest?.correct).toBe(1);
		vi.advanceTimersByTime(1900);
		expect(views.host?.phase).toBe('reveal');
		vi.advanceTimersByTime(200);
		expect(views.host?.phase).toBe('countdown');
	});

	it('паузу нельзя поставить в лобби и после игры', () => {
		const { code, host } = setup();
		expect(pauseGame(code, host).ok).toBe(false);
		expect(resumeGame(code, host).ok).toBe(false);
	});

	it('вопрос с несколькими ответами: очки за долю верных', () => {
		const { code, host, guest, views } = setupMulti();
		expect(views.guest?.question).toMatchObject({ kind: 'multi', options: ['a', 'b', 'c', 'd'] });
		expect(JSON.stringify(views.guest)).not.toContain('"correctOptions":[');

		expect(submitAnswer(code, host, { options: [] }).ok).toBe(false);
		expect(submitAnswer(code, host, { options: [0, 9] }).ok).toBe(false);
		expect(submitAnswer(code, host, { options: [0, 0] }).ok).toBe(false);
		expect(submitAnswer(code, host, { option: 0 }).ok).toBe(false);
		expect(submitAnswer(code, host, { options: [2, 0] }).ok).toBe(true); // 2 из 2
		expect(submitAnswer(code, guest, { options: [0] }).ok).toBe(true); // 1 из 2

		expect(views.host?.phase).toBe('reveal');
		expect(views.host?.correctOptions).toEqual([0, 2]);
		expect(views.host?.counts).toEqual([2, 0, 1, 0]);
		expect(views.host?.you).toMatchObject({ answers: [0, 2], correct: true, fraction: 1 });
		expect(views.guest?.you).toMatchObject({ answers: [0], correct: false, fraction: 0.5 });

		const byName = Object.fromEntries(views.host!.players.map((p) => [p.name, p.gain]));
		expect(byName['Борис']).toBe(Math.round(byName['Анна']! * 0.5));
		expect(byName['Анна']).toBeGreaterThan(500);
	});

	it('вопрос с несколькими ответами: неверный вариант снимает один верный', () => {
		const created = createRoom(
			{
				title: 'М',
				timeLimit: 10,
				questions: [
					{
						type: 'multi' as const,
						text: 'M',
						options: ['a', 'b', 'c', 'd', 'e', 'f'],
						correct: [0, 1, 2, 3]
					}
				]
			},
			'Анна'
		);
		if (!created.ok) throw new Error();
		const friend = joinRoom(created.code, 'Борис', undefined);
		if (!friend.ok) throw new Error();
		let view: RoomView | null = null;
		subscribe(created.code, created.token, (v) => (view = v));
		subscribe(created.code, friend.token, () => {});
		begin(created.code, created.token);

		submitAnswer(created.code, created.token, { options: [0, 1, 4] }); // 2 из 4 + 1 неверный
		submitAnswer(created.code, friend.token, { options: [0, 1, 2, 3] }); // 4 из 4
		const gains = Object.fromEntries(
			(view as unknown as RoomView).players.map((p) => [p.name, p.gain!])
		);
		expect(gains['Анна']).toBe(Math.round(gains['Борис'] * 0.25));
		expect((view as unknown as RoomView).you.fraction).toBe(0.25);
	});

	it('вопрос с несколькими ответами: верный плюс неверный — ноль очков', () => {
		const { code, host, guest, views } = setupMulti();
		submitAnswer(code, host, { options: [0, 1] }); // 1 из 2 верных + 1 неверный
		submitAnswer(code, guest, { options: [0, 1, 3] }); // 1 из 2 верных + 2 неверных
		const byName = Object.fromEntries(views.host!.players.map((p) => [p.name, p]));
		expect(byName['Анна'].gain).toBe(0);
		expect(byName['Борис'].gain).toBe(0);
		expect(views.host?.you.fraction).toBe(0);
	});

	it('пауза скрывает верные варианты вопроса с несколькими ответами', () => {
		const { code, host, guest, views } = setupMulti();
		submitAnswer(code, host, { options: [0, 2] });
		submitAnswer(code, guest, { options: [0, 2] });
		pauseGame(code, host);
		expect(views.guest?.correctOptions).toBeNull();
		expect(views.guest?.counts).toBeNull();
		expect(views.guest?.you.fraction).toBeNull();
	});

	it('картинка вопроса отдаётся только пока вопрос открыт и не на паузе', () => {
		const created = createRoom(
			{
				title: 'Картинки',
				timeLimit: 10,
				questions: [
					{
						text: 'Что на фото?',
						options: ['a', 'b'],
						correct: 0,
						image: 'https://example.com/secret-landmark.jpg'
					},
					{ text: 'Без картинки', options: ['a', 'b'], correct: 0 }
				]
			},
			'Анна'
		);
		if (!created.ok) throw new Error();
		let view: RoomView | null = null;
		subscribe(created.code, created.token, (v) => (view = v));

		startGame(created.code, created.token);
		// отсчёт: ни вопрос, ни ссылка на картинку ещё не уходят клиентам
		expect(JSON.stringify(view)).not.toContain('secret-landmark');
		vi.advanceTimersByTime(3000);
		expect((view as unknown as RoomView).question?.image).toBe(
			'https://example.com/secret-landmark.jpg'
		);

		pauseGame(created.code, created.token);
		expect(JSON.stringify(view)).not.toContain('secret-landmark');
		resumeGame(created.code, created.token);
		expect((view as unknown as RoomView).question?.image).toContain('secret-landmark');

		submitAnswer(created.code, created.token, { option: 0 });
		expect((view as unknown as RoomView).phase).toBe('reveal');
		expect((view as unknown as RoomView).question?.image).toContain('secret-landmark');

		vi.advanceTimersByTime(6000);
		expect((view as unknown as RoomView).question?.image).toBeNull();
	});

	it('пояснение уходит только после закрытия вопроса, показ ответа тогда дольше', () => {
		const explanation = 'Секретное пояснение: ' + 'x'.repeat(179); // 200 символов → +12 с (потолок)
		const created = createRoom(
			{
				title: 'Пояснения',
				timeLimit: 10,
				questions: [
					{ text: 'С пояснением', options: ['a', 'b'], correct: 0, explanation },
					{ text: 'Без пояснения', options: ['a', 'b'], correct: 0 }
				]
			},
			'Анна'
		);
		if (!created.ok) throw new Error();
		let view: RoomView | null = null;
		subscribe(created.code, created.token, (v) => (view = v));
		const current = () => view as unknown as RoomView;

		startGame(created.code, created.token);
		expect(JSON.stringify(view)).not.toContain('Секретное');
		vi.advanceTimersByTime(3000);
		expect(current().phase).toBe('question');
		expect(JSON.stringify(view)).not.toContain('Секретное');
		expect(current().explanation).toBeNull();

		submitAnswer(created.code, created.token, { option: 0 });
		expect(current().phase).toBe('reveal');
		expect(current().explanation).toBe(explanation);
		expect(current().revealMs).toBe(3000 + 12_000);

		pauseGame(created.code, created.token);
		expect(JSON.stringify(view)).not.toContain('Секретное');
		resumeGame(created.code, created.token);

		vi.advanceTimersByTime(14_900);
		expect(current().phase).toBe('reveal');
		vi.advanceTimersByTime(200);
		expect(current().phase).toBe('countdown');

		// у следующего вопроса пояснения нет — показ ответа обычной длины
		vi.advanceTimersByTime(3000);
		submitAnswer(created.code, created.token, { option: 0 });
		expect(current().explanation).toBeNull();
		expect(current().revealMs).toBe(3000);
	});

	it('длительность показа ответа растёт с длиной пояснения в пределах 2–12 секунд', () => {
		expect(revealDurationMs(undefined)).toBe(3000);
		expect(revealDurationMs('коротко')).toBe(3000 + 2000);
		expect(revealDurationMs('x'.repeat(100))).toBe(3000 + 6000);
		expect(revealDurationMs('x'.repeat(600))).toBe(3000 + 12_000);
	});

	it('после начала новых игроков не пускает', () => {
		const { code, host } = setup();
		begin(code, host);
		expect(joinRoom(code, 'Вера', undefined).ok).toBe(false);
	});

	it('не ждёт ответа от вышедшего игрока', () => {
		const created = createRoom(quiz, 'Анна');
		if (!created.ok) throw new Error();
		const joined = joinRoom(created.code, 'Борис', undefined);
		if (!joined.ok) throw new Error();
		let view: RoomView | null = null;
		subscribe(created.code, created.token, (v) => (view = v));
		const leave = subscribe(created.code, joined.token, () => {});
		begin(created.code, created.token);
		submitAnswer(created.code, created.token, { option: 1 });
		expect((view as RoomView | null)?.phase).toBe('question');
		leave?.();
		// сразу не закрываем: человек мог просто перезагрузить страницу
		expect((view as RoomView | null)?.phase).toBe('question');
		vi.advanceTimersByTime(8200);
		expect((view as RoomView | null)?.phase).toBe('reveal');
	});

	it('перезагрузка страницы не закрывает вопрос и возвращает состояние', () => {
		const created = createRoom(quiz, 'Анна');
		if (!created.ok) throw new Error();
		const joined = joinRoom(created.code, 'Борис', undefined);
		if (!joined.ok) throw new Error();
		subscribe(created.code, created.token, () => {});
		const closeGuest = subscribe(created.code, joined.token, () => {});
		begin(created.code, created.token);
		submitAnswer(created.code, created.token, { option: 1 });

		// Борис перезагружает страницу: старый поток закрылся, новый открывается позже
		closeGuest?.();
		vi.advanceTimersByTime(2000);
		let view: RoomView | null = null;
		subscribe(created.code, joined.token, (v) => (view = v));

		expect((view as RoomView | null)?.phase).toBe('question');
		expect((view as RoomView | null)?.you.answer).toBeNull();
		submitAnswer(created.code, joined.token, { option: 1 });
		expect((view as RoomView | null)?.phase).toBe('reveal');
	});

	it('передаёт роль ведущего, если он пропал надолго', () => {
		const created = createRoom(quiz, 'Вера');
		if (!created.ok) throw new Error();
		const friend = joinRoom(created.code, 'Глеб', undefined);
		if (!friend.ok) throw new Error();
		let view: RoomView | null = null;
		const leaveHost = subscribe(created.code, created.token, () => {});
		subscribe(created.code, friend.token, (v) => (view = v));

		leaveHost?.();
		vi.advanceTimersByTime(10_000);
		expect((view as RoomView | null)?.you.isHost).toBe(false);
		vi.advanceTimersByTime(21_000);
		expect((view as RoomView | null)?.you.isHost).toBe(true);

		// старый ведущий уже не управляет игрой, новый — управляет
		expect(startGame(created.code, created.token).ok).toBe(false);
		expect(startGame(created.code, friend.token).ok).toBe(true);
	});

	it('не передаёт роль, если ведущий успел вернуться', () => {
		const created = createRoom(quiz, 'Вера');
		if (!created.ok) throw new Error();
		const friend = joinRoom(created.code, 'Глеб', undefined);
		if (!friend.ok) throw new Error();
		const leaveHost = subscribe(created.code, created.token, () => {});
		subscribe(created.code, friend.token, () => {});

		leaveHost?.();
		vi.advanceTimersByTime(5000);
		subscribe(created.code, created.token, () => {});
		vi.advanceTimersByTime(60_000);
		expect(startGame(created.code, created.token).ok).toBe(true);
	});

	it('даёт вернуться по имени тому, кого нет в сети, но не отбирает имя у онлайн-игрока', () => {
		const created = createRoom(quiz, 'Анна');
		if (!created.ok) throw new Error();
		const boris = joinRoom(created.code, 'Борис', undefined);
		if (!boris.ok) throw new Error();
		const online = joinRoom(created.code, 'Вера', undefined);
		if (!online.ok) throw new Error();
		subscribe(created.code, online.token, () => {});
		begin(created.code, created.token);

		// Вера онлайн — её имя занято; Борис не в сети (потерял cookie) — может вернуться
		expect(joinRoom(created.code, 'вера', undefined).ok).toBe(false);
		const back = joinRoom(created.code, 'борис', undefined);
		expect(back.ok).toBe(true);
		const newToken = back.ok ? back.token : '';
		expect(newToken).not.toBe(boris.token);

		// старый токен недействителен, новый работает
		expect(submitAnswer(created.code, boris.token, { option: 1 }).ok).toBe(false);
		expect(submitAnswer(created.code, newToken, { option: 1 }).ok).toBe(true);
	});
});
