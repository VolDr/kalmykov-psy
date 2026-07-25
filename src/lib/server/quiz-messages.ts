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
	resultsFooterText: string;
	sphereRecs: QuizSphereRecs;
	allGreenText: string;
};

/** Дефолтные тексты — используются, пока админ не сохранил свои (см. /admin/bot/quiz). */
export const DEFAULT_QUIZ_BOT_TEXTS = {
	subscribeText:
		'Ваш общий результат готов, а подробный разбор по четырём сферам выгорания и рекомендации я пришлю здесь.\n\nЯ делюсь такими материалами в своём канале — там я пишу о выгорании, отдыхе без чувства вины, прокрастинации и восстановлении. Подпишитесь и нажмите кнопку ниже 👇',
	subscribeButtonText: 'Подписаться на канал',
	checkButtonText: 'Я подписался(-ась) ✅',
	notSubscribedAlert: 'Пока не вижу вашей подписки на канал. Подпишитесь и нажмите кнопку ещё раз 🙌',
	resultsHeaderText: 'Ваши результаты по методике BAT-23 — по четырём сферам выгорания:',
	resultsFooterText:
		'Если результат похож на то, как вы себя чувствуете, начать можно со встречи-знакомства: короткая встреча на 20–25 минут, бесплатно и ни к чему не обязывает.\n\n[Записаться на встречу-знакомство](https://kalmykov-psy.ru/booking?acquaintance)',
	allGreenText:
		'**Сильных просадок по сферам не видно.**\nПо ответам не видно выраженных признаков выгорания. Чтобы сохранить это состояние, полезно заранее замечать ранние сигналы перегрузки: хуже восстанавливаетесь после выходных, чаще откладываете задачи, сложнее выключиться вечером или отдых начинает вызывать чувство вины.'
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

/** Зона для выбора текста рекомендации: red/darkred → red, orange/yellow → orange */
function recZone(color: string): 'orange' | 'red' | null {
	if (isHot(color)) return 'red';
	if (color === 'orange' || color === 'yellow') return 'orange';
	return null;
}

function formatScore(value: number): string {
	return `${value.toFixed(2).replace('.', ',')} из 5`;
}

/**
 * Собирает блоки разбора: сводка по сферам, рекомендации по проблемным сферам
 * (горячие первыми, как на сайте), футер с CTA. Пустые тексты пропускаются.
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
	summaryLines.push(
		result.subscales
			.map(
				(s) =>
					`${ZONE_EMOJI[s.color] ?? ''} ${s.name}: ${formatScore(s.averageScore)} — ${s.severity.toLowerCase()}`
			)
			.join('\n')
	);
	blocks.push(summaryLines.join('\n\n'));

	const problematic = result.subscales
		.filter((s) => recZone(s.color) !== null)
		.sort((a, b) => {
			const hotDiff = Number(isHot(b.color)) - Number(isHot(a.color));
			if (hotDiff !== 0) return hotDiff;
			return b.averageScore - a.averageScore;
		});

	if (problematic.length === 0) {
		if (settings.allGreenText.trim()) blocks.push(settings.allGreenText.trim());
	} else {
		for (const sub of problematic) {
			const zone = recZone(sub.color);
			if (!zone) continue;
			const recs = settings.sphereRecs[sub.id];
			// Для оранжевой зоны без своего текста используем красный (как на сайте)
			const text = recs?.[zone] ?? recs?.red;
			if (text?.trim()) blocks.push(text.trim());
		}
	}

	if (settings.resultsFooterText.trim()) blocks.push(settings.resultsFooterText.trim());

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
