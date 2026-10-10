import type { QuizSphereRecs, QuizSubscaleResult } from '../../db/schema';

/**
 * Сборка текстов сообщений с разбором результатов опросника для бота.
 * Модуль чистый (без БД и Telegram) — покрывается юнит-тестами.
 * Разметка — мини-markdown tgFormat: **жирный**, [текст](url).
 */

export type QuizResultForMessages = {
	averageScore: number | null;
	severity: string;
	color: string;
	subscales: QuizSubscaleResult[];
};

export type QuizMessageSettings = {
	resultsHeaderText: string;
	sphereRecs: QuizSphereRecs;
};

/** Дефолтные тексты — используются, пока админ не сохранил свои (см. /admin/bot/quiz). */
export const DEFAULT_QUIZ_BOT_TEXTS = {
	subscribeText:
		'Ваш общий результат готов, а подробный разбор по четырём сферам выгорания и рекомендации я пришлю здесь.\n\nЯ делюсь такими материалами в своём канале — там я пишу о выгорании, отдыхе без чувства вины, прокрастинации и восстановлении. Подпишитесь и нажмите кнопку ниже 👇',
	subscribeButtonText: 'Подписаться на канал',
	checkButtonText: 'Я подписался(-ась) ✅',
	notSubscribedAlert:
		'Пока не вижу вашей подписки на канал. Подпишитесь и нажмите кнопку ещё раз 🙌',
	resultsHeaderText: 'Ваши результаты по методике BAT-23 — по четырём сферам выгорания:'
} as const;

export const DEFAULT_SPHERE_RECS: QuizSphereRecs = {
	exhaustion: {
		orange:
			'**Истощение уже заметно.**\nПохоже, запас сил начинает снижаться. Важно не ждать, пока усталость станет постоянным фоном. Попробуйте в ближайшие дни уменьшить необязательную нагрузку, заранее поставить короткие периоды восстановления и отследить, после каких задач вы быстрее всего проседаете.',
		red: '**Истощение выражено сильнее всего.**\nВаши ответы показывают, что главный источник трудностей сейчас — истощение. В таком состоянии отдых может переставать восстанавливать, а простые задачи требуют всё больше усилий. Здесь важно не пытаться «дожать», а снижать нагрузку там, где это возможно, возвращать регулярное восстановление и разбираться, почему силы снова не успевают восстановиться.'
	},
	distancing: {
		red: '**Работа всё чаще ощущается чужой.**\nВысокий показатель внутреннего дистанцирования может означать, что работа всё чаще вызывает отстранённость, раздражение или ощущение бессмысленности. Не стоит сразу делать резкий вывод, что профессию нужно бросать. Сначала важно понять, что именно изменилось: выросла нагрузка, стало меньше контроля, работа разошлась с вашими ценностями, пропало восстановление или накопилось разочарование.'
	},
	cognitive: {
		red: '**Когнитивная перегрузка выражена сильно.**\nВаши ответы показывают, что выгорание может уже сказываться на внимании, памяти и принятии решений. В таком состоянии попытка работать быстрее часто только увеличивает количество ошибок и усталость. На время лучше упростить рабочую систему: меньше параллельных задач, больше внешних опор, короткие рабочие блоки, ясные приоритеты и меньше решений там, где их можно заранее снять с себя.'
	},
	emotional: {
		red: '**Эмоциями стало сложнее управлять.**\nВысокий показатель эмоциональных затруднений может означать, что напряжение стало труднее выдерживать, а после сильных реакций сложнее возвращаться в спокойное состояние. Здесь важно снижать общий уровень перегрузки, возвращать регулярные паузы, не добавлять лишнего общения сверх ресурса и разбирать ситуации, в которых эмоции снова выходят из-под контроля.'
	}
};

const ZONE_EMOJI: Record<string, string> = {
	green: '🟢',
	yellow: '🟡',
	orange: '🟠',
	red: '🔴',
	darkred: '🔴'
};

/** Горячая зона (red/darkred) — такие сферы показываются первыми */
function isHot(color: string): boolean {
	return color === 'red' || color === 'darkred';
}

/** Зона для выбора текста рекомендации: red/darkred → red, orange/yellow → orange, green → green */
function recZone(color: string): 'green' | 'orange' | 'red' | null {
	if (isHot(color)) return 'red';
	if (color === 'orange' || color === 'yellow') return 'orange';
	if (color === 'green') return 'green';
	return null;
}

/** Порядок зон в разборе: сначала то, с чем важнее разбираться */
const ZONE_ORDER = { red: 0, orange: 1, green: 2 } as const;

function formatScore(value: number): string {
	return `${value.toFixed(2).replace('.', ',')} из 5`;
}

/**
 * Собирает блоки разбора. Первый — вступление и общий показатель. Дальше каждая
 * сфера отдельным блоком: строка с её баллом и зоной, под ней рекомендация по
 * зоне (если текст есть). Порядок: красные → оранжевые → зелёные, внутри зоны —
 * по убыванию балла. Завершения с CTA здесь нет: призыв записаться ставится шагом
 * цепочки quiz_results_delivered — там ему можно дать паузу.
 */
export function buildQuizResultBlocks(
	result: QuizResultForMessages,
	settings: QuizMessageSettings
): string[] {
	const blocks: string[] = [];

	const summaryLines: string[] = [];
	if (settings.resultsHeaderText.trim()) {
		summaryLines.push(settings.resultsHeaderText.trim());
	}
	if (result.averageScore !== null) {
		summaryLines.push(
			`${ZONE_EMOJI[result.color] ?? ''} **Общий показатель: ${formatScore(result.averageScore)} — ${result.severity}**`
		);
	}
	if (summaryLines.length > 0) blocks.push(summaryLines.join('\n\n'));

	// Сфера с незнакомой зоной не теряется — идёт последней, просто без рекомендации
	const zoneRank = (zone: 'green' | 'orange' | 'red' | null) =>
		zone === null ? Object.keys(ZONE_ORDER).length : ZONE_ORDER[zone];
	const ordered = result.subscales
		.map((sub) => ({ sub, zone: recZone(sub.color) }))
		.sort((a, b) => zoneRank(a.zone) - zoneRank(b.zone) || b.sub.averageScore - a.sub.averageScore);

	for (const { sub, zone } of ordered) {
		const emoji = ZONE_EMOJI[sub.color];
		const line = `${emoji ? `${emoji} ` : ''}**${sub.name}: ${formatScore(sub.averageScore)} — ${sub.severity.toLowerCase()}**`;
		const recs = settings.sphereRecs[sub.id];
		// Оранжевой зоне без своего текста — красный (как на сайте); зелёной — только свой
		const text =
			zone === 'orange' ? (recs?.orange ?? recs?.red) : zone === null ? undefined : recs?.[zone];
		blocks.push(text?.trim() ? `${line}\n\n${text.trim()}` : line);
	}

	return blocks;
}

/**
 * Склеивает блоки в сообщения жадно: пока влезает в лимит — добавляем в текущее.
 * measure — длина текста в том виде, в котором он уйдёт в Telegram (после tgFormat).
 * Блок длиннее лимита отправляется отдельным сообщением (Telegram его обрежет,
 * но такие тексты — ошибка конфигурации, валидируется в админке).
 */
export function packMessages(
	blocks: string[],
	limit: number,
	measure: (text: string) => number
): string[] {
	const messages: string[] = [];
	let current = '';

	for (const block of blocks) {
		if (!current) {
			current = block;
			continue;
		}
		const joined = `${current}\n\n${block}`;
		if (measure(joined) <= limit) {
			current = joined;
		} else {
			messages.push(current);
			current = block;
		}
	}
	if (current) messages.push(current);

	return messages;
}
