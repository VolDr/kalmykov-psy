/** Вид комнаты для одного игрока: то, что сервер шлёт по SSE. Верный ответ раскрывается только на reveal. */

export type RoomPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished';

export interface PlayerView {
	id: string;
	name: string;
	score: number;
	isHost: boolean;
	connected: boolean;
	/** Ответил ли на текущий вопрос (сам выбор другим не показывается) */
	answered: boolean;
	/** Очки за последний вопрос — только на reveal */
	gain: number | null;
	/** Что игрок напечатал в вопросе с вводом — только на reveal */
	answerText: string | null;
}

export interface RoomView {
	code: string;
	quizTitle: string;
	phase: RoomPhase;
	/** Номер текущего вопроса с нуля; -1 в лобби */
	index: number;
	total: number;
	timeLimitMs: number;
	/** kind 'text' — вопрос с прямым вводом, options пуст */
	question: {
		text: string;
		kind: 'choice' | 'multi' | 'text';
		options: string[];
		/** Картинка к вопросу; на паузе и до открытия вопроса не отдаётся */
		image: string | null;
	} | null;
	/** Ведущий поставил паузу: содержимое вопроса скрыто, таймеры стоят */
	paused: boolean;
	/** Когда откроется вопрос после отсчёта «3… 2… 1…» (мс по часам сервера) — только в countdown */
	startsAt: number | null;
	/** Длительность отсчёта перед вопросом */
	countdownMs: number;
	/** Дедлайн ответа по часам сервера (мс) */
	endsAt: number | null;
	/** Когда сам начнётся следующий вопрос (мс по часам сервера) — только на reveal */
	nextAt: number | null;
	/** Длительность показа ответа */
	revealMs: number;
	serverNow: number;
	/** Верный вариант и сколько человек выбрало каждый — только на reveal */
	correct: number | null;
	counts: number[] | null;
	/** Номера верных вариантов вопроса с несколькими ответами — только на reveal */
	correctOptions: number[] | null;
	/** Пояснение к вопросу — только на reveal, до этого не отдаётся */
	explanation: string | null;
	/** Засчитываемые ответы вопроса с вводом — только на reveal */
	correctAnswers: string[] | null;
	players: PlayerView[];
	you: {
		id: string;
		isHost: boolean;
		/** Выбранный вариант (вопрос с выбором) */
		answer: number | null;
		/** Отмеченные варианты (вопрос с несколькими ответами) */
		answers: number[] | null;
		/** Введённый ответ (вопрос с вводом) */
		answerText: string | null;
		/** Верно ли ответил полностью — только на reveal */
		correct: boolean | null;
		/** Доля баллов от 0 до 1 (у вопроса с несколькими ответами бывает дробной) — только на reveal */
		fraction: number | null;
	};
}

export type RoomAction =
	| { type: 'join'; name: string }
	| { type: 'start' }
	| { type: 'answer'; option?: number; options?: number[]; text?: string }
	| { type: 'pause' }
	| { type: 'resume' }
	| { type: 'restart' };
