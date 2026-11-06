import type { TranslationEntry } from './translation';
import {
	commentsOf,
	escapeMarkdownCell as cell,
	reconciliationText,
	type AdminReconciliation
} from './translation-reconciliation';
import { reviewChoiceLabel } from './translation-review-order';

/** Итог с устойчивыми ключами можно загрузить обратно как второй перевод.
 * Комментарии читаются в отдельном разделе и не смешиваются с формулировками. */
export function exportReconciledMarkdown(
	review: AdminReconciliation,
	final: Record<string, TranslationEntry>
) {
	const [first, second] = review.participants;
	const rows = review.items.map((item) => ({
		item,
		...reconciliationText(
			item.key,
			review.variantA,
			review.variantB,
			first?.entries ?? {},
			second?.entries ?? {},
			final
		)
	}));
	if (rows.some((row) => !row.text.trim())) throw new Error('Сначала согласуйте все пункты');
	let text =
		`# ${cell(review.title)}\n\n| Ключ | Перевод |\n|---|---|\n` +
		rows.map((row) => `| ${cell(row.item.key)} | ${cell(row.text)} |`).join('\n') +
		'\n';
	// Несколько комментариев участника идут в одной ячейке, каждый с новой строки
	const said = (slot: number | undefined, key: string) =>
		slot ? commentsOf(review.comments, slot, key).join('\n') : '';
	const comments = rows.filter(
		({ item }) =>
			said(first?.slot, item.key) || said(second?.slot, item.key) || final[item.key]?.comment
	);
	if (comments.length) {
		text += `\n## Комментарии согласования\n\n| Ключ | ${cell(first?.profile.name ?? 'Участник 1')} | ${cell(second?.profile.name ?? 'Участник 2')} | Комментарий к итогу |\n|---|---|---|---|\n`;
		for (const { item } of comments) {
			const one = first?.entries[item.key],
				two = second?.entries[item.key];
			text += `| ${cell(item.key)} | ${cell(`${reviewChoiceLabel(review.id, item.key, one?.translation ?? '')}: ${said(first?.slot, item.key)}`)} | ${cell(`${reviewChoiceLabel(review.id, item.key, two?.translation ?? '')}: ${said(second?.slot, item.key)}`)} | ${cell(final[item.key]?.comment ?? '')} |\n`;
		}
	}
	return text;
}
