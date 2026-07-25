import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Файлы-вложения шагов сценариев. Лежат вне static/ — статика собирается на
// билде, а эти файлы загружаются в рантайме; публичная раздача им не нужна,
// бот загружает их в Telegram напрямую (multipart).
const BOT_FILES_DIR = path.resolve('uploads/bot-files');

// Лимит Telegram на загрузку файла ботом — 50 МБ.
// На проде надо поднять и лимит тела запроса SvelteKit: BODY_SIZE_LIMIT=52428800.
export const MAX_STEP_FILE_BYTES = 50 * 1024 * 1024;

export function absoluteStepFilePath(storedName: string): string {
	return path.join(BOT_FILES_DIR, storedName);
}

/**
 * Сохраняет загруженный файл под уникальным именем.
 * Возвращает поля для bot_scenario_steps.
 */
export async function saveStepFile(file: File): Promise<{ fileName: string; filePath: string }> {
	// Оригинальное имя остаётся только в БД (его увидит получатель в Telegram),
	// на диске — uuid + расширение, чтобы не думать про юникод/спецсимволы в ФС
	const ext = path.extname(file.name).slice(0, 16);
	const storedName = `${randomUUID()}${ext}`;

	await fs.mkdir(BOT_FILES_DIR, { recursive: true });
	await fs.writeFile(absoluteStepFilePath(storedName), Buffer.from(await file.arrayBuffer()));

	return { fileName: file.name, filePath: storedName };
}

/** Удаляет файл шага с диска. Отсутствие файла — не ошибка. */
export async function deleteStepFileFromDisk(storedName: string | null | undefined) {
	if (!storedName) return;
	try {
		await fs.unlink(absoluteStepFilePath(storedName));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
			console.error('[bot-step-files] Не удалось удалить файл:', err);
		}
	}
}
