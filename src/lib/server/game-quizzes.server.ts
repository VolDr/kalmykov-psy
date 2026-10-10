import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../..';
import * as schema from '../../db/schema';
import type { GameQuestion } from '../../db/schema';
import { parseQuestions } from '$lib/data/game-quiz-json';

const quizSchema = z.object({
	title: z.string().trim().min(1, 'Укажите название').max(120),
	description: z.string().trim().max(300).optional(),
	timeLimit: z.number().int().min(5, 'Минимум 5 секунд').max(120, 'Максимум 120 секунд'),
	published: z.boolean(),
	questions: z.array(z.unknown())
});

export type GameQuizInput = Omit<z.infer<typeof quizSchema>, 'questions'> & {
	questions: GameQuestion[];
};

/** Разбирает JSON из формы админки; при ошибке возвращает первое понятное сообщение. */
export function parseQuizInput(
	raw: unknown
): { ok: true; data: GameQuizInput } | { ok: false; error: string } {
	const result = quizSchema.safeParse(raw);
	if (!result.success) return { ok: false, error: result.error.issues[0].message };

	const questions = parseQuestions(result.data.questions);
	if (!questions.ok) return questions;
	if (result.data.published && questions.questions.length === 0) {
		return { ok: false, error: 'Нельзя опубликовать викторину без вопросов' };
	}
	return { ok: true, data: { ...result.data, questions: questions.questions } };
}

export async function listQuizzes() {
	return db.select().from(schema.gameQuizzes).orderBy(desc(schema.gameQuizzes.updatedAt));
}

export async function listPublishedQuizzes() {
	const rows = await db
		.select({
			id: schema.gameQuizzes.id,
			title: schema.gameQuizzes.title,
			description: schema.gameQuizzes.description,
			timeLimit: schema.gameQuizzes.timeLimit,
			questions: schema.gameQuizzes.questions
		})
		.from(schema.gameQuizzes)
		.where(eq(schema.gameQuizzes.published, true))
		.orderBy(desc(schema.gameQuizzes.updatedAt));
	return rows.map(({ questions, ...rest }) => ({ ...rest, questionCount: questions.length }));
}

export async function getPublishedQuiz(id: number) {
	const [quiz] = await db
		.select()
		.from(schema.gameQuizzes)
		.where(eq(schema.gameQuizzes.id, id))
		.limit(1);
	return quiz && quiz.published && quiz.questions.length > 0 ? quiz : null;
}

export async function saveQuiz(id: number | null, input: GameQuizInput) {
	const values = {
		title: input.title,
		description: input.description || null,
		timeLimit: input.timeLimit,
		published: input.published,
		questions: input.questions
	};
	if (id) {
		await db
			.update(schema.gameQuizzes)
			.set({ ...values, updatedAt: new Date().toISOString() })
			.where(eq(schema.gameQuizzes.id, id));
		return id;
	}
	const [created] = await db
		.insert(schema.gameQuizzes)
		.values(values)
		.returning({ id: schema.gameQuizzes.id });
	return created.id;
}

export async function deleteQuiz(id: number) {
	await db.delete(schema.gameQuizzes).where(eq(schema.gameQuizzes.id, id));
}
