import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import ExpertWorkspace from './ExpertWorkspace.svelte';
import type { TranslationItem } from '#lib/data/translation.js';
import { buildExpertItems, expertBriefing } from '#lib/data/translation-expert.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), replaceState: vi.fn() }));
vi.mock('$app/state', () => ({
	page: { url: new URL('https://example.test/translate/expert-link'), state: {} }
}));

const item = (key: string, group: string): TranslationItem => ({
	key,
	label: `Пункт ${key}`,
	short: key,
	group,
	source: `Source ${key}`
});
const source = [
	item('instruction', 'Инструкция'),
	...Array.from({ length: 30 }, (_, i) => item(String(i + 1), 'Утверждения')),
	...Array.from({ length: 6 }, (_, i) => item(`option${i + 1}`, 'Ответы'))
];
const items = buildExpertItems(source, (key) => `Итог ${key}`);

describe('expert review page', () => {
	const { body } = render(ExpertWorkspace, {
		props: {
			data: {
				title: 'Экспертная оценка',
				items,
				guide: expertBriefing,
				entries: {
					'7': { translation: 'clear', comment: '', translationVersion: 1, commentVersion: 0 },
					'7/relevance': { translation: '4', comment: '', translationVersion: 1, commentVersion: 0 }
				}
			},
			token: 'expert-link'
		}
	});

	it('shows the briefing, the response format and items grouped under scale definitions', () => {
		expect(body).toContain('Брифинг');
		expect(body).toContain('1 — Итог option1');
		const scale = body.indexOf('Поведенческое избегание');
		expect(scale).toBeGreaterThan(body.indexOf('Формат ответов'));
		expect(body.indexOf('Итог 7')).toBeGreaterThan(scale);
		expect(body).not.toContain('Source');
	});

	it('asks for relevance only for statements and counts completed items', () => {
		expect(body.match(/Релевантность компоненту/g)).toHaveLength(30);
		expect(body.match(/Ясность формулировки/g)).toHaveLength(32);
		expect(body).toContain('Оценено 1 из 32');
	});
	it('uses discussion threads, a list of scales and the requested concise saving text', () => {
		expect(body).toContain('aria-label="Шкалы опросника"');
		expect(body).toContain('Ответы сохраняются автоматически.');
		expect(body).not.toContain('к пунктам можно возвращаться');
		expect(body).not.toContain('Все пункты оценены');
		expect(body).not.toContain('страницу можно закрыть');
		expect(body).not.toContain('Как переписать');
		expect(body.match(/Написать комментарий/g)).toHaveLength(32);
	});
	it('shows both participants but enables deletion only for your own comments and disables admin rating inputs', () => {
		const discussion = { id: 12, slot: 1, profiles: { 1: { name: 'Андрей', avatar: '/admin-avatar.png' }, 2: { name: 'Елена', avatar: '' } }, comments: [
			{ id: 'a', slot: 1, itemKey: '1', body: 'Мой ответ' }, { id: 'b', slot: 2, itemKey: '1', body: 'Комментарий эксперта' }
		] };
		const { body: adminBody } = render(ExpertWorkspace, { props: { data: { title: 'Обсуждение', items: [items.find((item) => item.key === '1')!], guide: '', entries: {}, discussion }, token: 'admin-link' } });
		expect(adminBody).toContain('Андрей (вы)');
		expect(adminBody).toContain('Елена');
		expect(adminBody).toContain('/admin-avatar.png');
		expect(adminBody.match(/aria-label="Удалить комментарий"/g)).toHaveLength(1);
		expect(adminBody.match(/disabled/g)?.length).toBeGreaterThanOrEqual(6);
	});
});
