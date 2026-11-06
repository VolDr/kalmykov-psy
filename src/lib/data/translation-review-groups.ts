import type { TranslationItem } from './translation';

/** Описание шкалы, которое показывается участникам согласования перед её пунктами. */
export interface ReviewScale {
	id: string;
	title: string;
	/** Ключи пунктов шкалы в порядке показа */
	itemKeys: string[];
	definition: string;
	/** Цитаты авторов на английском с годом публикации */
	quotes: { text: string; year: string }[];
	highScore: string;
}

export interface ReviewConstruct {
	title: string;
	text: string;
}

export interface ReviewGroup {
	scale: ReviewScale | null;
	/** Пункты вместе с их номером в исходном списке документа */
	items: { item: TranslationItem; index: number }[];
}

const range = (start: number) => [0, 6, 12, 18, 24].map((step) => String(start + step));

/** MEAQ-30 (Gámez et al., 2011, 2014): конструкт и шесть шкал. */
export const meaqConstruct: ReviewConstruct = {
	title: 'Избегание переживаний',
	text: 'Склонность избегать негативных внутренних переживаний («the tendency to avoid negative internal experiences»). Операционально авторы определяют его как склонность избегать (уходить, контролировать, подавлять, изменять или не принимать) негативных аффективных, но явно не опасных состояний (Gámez et al., 2011). Опросник измеряет устойчивую склонность, поэтому в инструкции нет временной рамки.'
};

export const meaqScales: ReviewScale[] = [
	{
		id: 'behavioral-avoidance',
		title: 'Поведенческое избегание',
		itemKeys: range(1),
		definition: 'Явное, ситуативное избегание физического дискомфорта и дистресса.',
		quotes: [
			{ text: 'overt, situational avoidance of physical discomfort and distress', year: '2011' }
		],
		highScore:
			'Человек избегает ситуаций и занятий или уходит из них, если ожидает неприятных ощущений или переживаний.'
	},
	{
		id: 'distress-aversion',
		title: 'Неприятие дистресса',
		itemKeys: range(2),
		definition: 'Негативные оценки дистресса и установки по отношению к нему; неприятие дистресса.',
		quotes: [
			{
				text: 'negative evaluations or attitudes toward distress, nonacceptance of distress',
				year: '2011'
			}
		],
		highScore: 'Человек считает неприятные переживания недопустимыми и стремится от них избавиться.'
	},
	{
		id: 'procrastination',
		title: 'Прокрастинация',
		itemKeys: range(3),
		definition:
			'Откладывание ожидаемого дистресса, то есть откладывание дел, которые могут вызвать неприятные переживания.',
		quotes: [
			{ text: 'delaying anticipated distress', year: '2011' },
			{ text: 'delaying activities that may cause distress', year: '2014' }
		],
		highScore:
			'Человек оттягивает неприятные дела, чтобы не столкнуться с дистрессом. Пункт 27 кодируется обратно.'
	},
	{
		id: 'distraction-suppression',
		title: 'Отвлечение и подавление',
		itemKeys: range(4),
		definition: 'Попытки игнорировать или подавлять дистресс.',
		quotes: [{ text: 'attempts to ignore or suppress distress', year: '2011, 2014' }],
		highScore:
			'Человек старается не думать о неприятных мыслях, воспоминаниях и чувствах, переключается на другое или «не пускает» их в сознание.'
	},
	{
		id: 'repression-denial',
		title: 'Вытеснение и отрицание',
		itemKeys: range(5),
		definition:
			'Дистанцирование от дистресса и диссоциация от него; недостаточное осознание дистресса.',
		quotes: [
			{
				text: 'distancing and dissociating from distress, lack of distress awareness',
				year: '2011'
			}
		],
		highScore:
			'Человек плохо осознаёт свои неприятные переживания, отстранён от собственных эмоций, и окружающие замечают это со стороны. По замыслу это стратегии, которые работают без явного осознания (психодинамический смысл).'
	},
	{
		id: 'distress-endurance',
		title: 'Выносливость к дистрессу',
		itemKeys: range(6),
		definition:
			'Готовность эффективно действовать перед лицом дистресса; готовность поступать в соответствии со своими ценностями, даже испытывая дистресс.',
		quotes: [
			{ text: 'willingness to behave effectively in the face of distress', year: '2011' },
			{
				text: 'willingness to engage in behavior that is consistent with one’s values even when in distress',
				year: '2014'
			}
		],
		highScore:
			'Означает выносливость, а не избегание: шкала направлена противоположно остальным пяти, но её пункты не перекодируются. Авторы подчёркивают, что это отдельное измерение, а не просто противоположный полюс неприятия или избегания (2011).'
	}
];

/**
 * Делит пункты документа на группы по шкалам. Пункты вне шкал (инструкция,
 * варианты ответа) идут первой группой без определения. Если в документе нет
 * всех пунктов шкал, разбивка не подходит к опроснику и возвращается одна
 * общая группа в исходном порядке.
 */
export function groupReviewItems(
	items: TranslationItem[],
	scales: ReviewScale[] = meaqScales,
	/** Часть пунктов опросника (повторная оценка): пустые шкалы пропускаются. */
	partial = false
): ReviewGroup[] {
	const indexed = items.map((item, index) => ({ item, index }));
	const byKey = new Map(indexed.map((entry) => [entry.item.key, entry]));
	const grouped = new Set(scales.flatMap((scale) => scale.itemKeys));
	const fits = partial
		? indexed.some((entry) => grouped.has(entry.item.key)) &&
			indexed.every((entry) => grouped.has(entry.item.key) || !/^\d+$/.test(entry.item.key))
		: scales.every((scale) => scale.itemKeys.every((key) => byKey.has(key)));
	if (!fits) return [{ scale: null, items: indexed }];
	const rest = indexed.filter((entry) => !grouped.has(entry.item.key));
	return [
		...(rest.length ? [{ scale: null, items: rest }] : []),
		...scales
			.map((scale) => ({
				scale,
				items: scale.itemKeys.flatMap((key) => byKey.get(key) ?? [])
			}))
			.filter((group) => group.items.length)
	];
}

/** Конструкт показывается только когда разбивка по шкалам подошла к документу. */
export const reviewConstructFor = (groups: ReviewGroup[]) =>
	groups.some((group) => group.scale) ? meaqConstruct : null;
