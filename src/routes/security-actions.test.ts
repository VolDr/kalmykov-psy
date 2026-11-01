import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	limit: vi.fn(),
	verify: vi.fn(),
	session: vi.fn(),
	article: vi.fn(),
	contact: vi.fn(),
	feedback: { get: vi.fn(), update: vi.fn(), submit: vi.fn() },
	state: { get: vi.fn(), update: vi.fn(), submit: vi.fn() },
	insert: vi.fn(),
	values: vi.fn(),
	subscriber: vi.fn()
}));
vi.mock('#lib/server/auth.server.js', () => ({
	verifyUser: mocks.verify,
	createSession: mocks.session
}));
vi.mock('#lib/server/request-limits.server.js', async (load) => ({
	...(await load<typeof import('../lib/server/request-limits.server')>()),
	consumeLimit: mocks.limit
}));
vi.mock('../index', () => ({ db: { insert: mocks.insert } }));
vi.mock('#lib/server/article.server.js', () => ({
	articleService: { create: mocks.article, delete: mocks.article },
	serializeArticle: (a: unknown) => a
}));
vi.mock('#lib/server/contact.server.js', () => ({
	contactService: { create: mocks.contact, update: mocks.contact, delete: mocks.contact }
}));
vi.mock('#lib/server/feedback.server.js', () => ({
	feedbackService: mocks.feedback,
	serializeFeedback: (a: unknown) => a
}));
vi.mock('#lib/server/current-state.server.js', () => ({
	currentStateService: mocks.state,
	serializeCurrentState: (a: unknown) => a
}));
vi.mock('#lib/server/subscriber.server.js', () => ({
	subscriberService: { upsertPending: mocks.subscriber }
}));
vi.mock('$app/env/private', () => ({ MAILOPOST_API_TOKEN: 'TEST_MAIL_TOKEN' }));

import { actions as login } from './login/+page.server';
import { actions as articles } from './admin/articles/+page.server';
import { actions as profiles } from './admin/edit-profile/+page.server';
import { actions as forms } from './[code]/+page.server';
import { actions as mailResults } from './useful/burnout-questionnaire/+page.server';
import { POST as subscribe } from './api/subscribe/+server';
import { POST as analytics } from './api/analytics/+server';
import { bat23Config } from '../configs/bat23ConfigSoft';

function event(fields: Record<string, string>, user: unknown = null) {
	const url = new URL('https://kalmykov-psy.ru/TARGET');
	return {
		url,
		request: new Request(url, { method: 'POST', body: new URLSearchParams(fields) }),
		locals: { user },
		params: { code: 'TARGET' },
		setHeaders: vi.fn(),
		getClientAddress: () => '192.0.2.1'
	} as any;
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	mocks.limit.mockResolvedValue({ allowed: true, retryAfter: 60 });
	mocks.verify.mockResolvedValue(false);
	mocks.feedback.submit.mockResolvedValue({ smallId: 'TARGET' });
	mocks.state.submit.mockResolvedValue({ smallId: 'TARGET' });
	mocks.insert.mockReturnValue({ values: mocks.values });
	mocks.values.mockResolvedValue(undefined);
	mocks.subscriber.mockResolvedValue({ token: 'PRIVATE_CONFIRMATION_TOKEN' });
});

describe('administrative actions also enforce their own guard', () => {
	it.each([
		['article save', () => articles.save!(event({ title: 'fake', uri: 'fake', content: 'fake' }))],
		['article delete', () => articles.delete!(event({ id: 'fake' }))],
		[
			'contact create',
			() =>
				profiles.addContact!(
					event({ clientId: 'fake', type: 'email', value: 'fake@example.invalid' })
				)
		],
		['contact delete', () => profiles.deleteContact!(event({ contactId: 'fake' }))]
	] as const)('rejects guest %s', async (_, action) => {
		await expect(action()).rejects.toMatchObject({ status: 404 });
		expect(mocks.article).not.toHaveBeenCalled();
		expect(mocks.contact).not.toHaveBeenCalled();
	});
});

describe.each([
	[
		'feedback',
		forms.send_feedback,
		mocks.feedback,
		{ sendingType: 'feedback', attitude: '2', goals: '2', method: '2', generally: '2' }
	],
	[
		'current state',
		forms.send_current_state,
		mocks.state,
		{ sendingType: 'currentState', individual: '2', family: '2', social: '2', generally: '2' }
	]
] as const)('%s form action', (_, action, service, values) => {
	it('rejects a body ID different from the URL', async () => {
		expect(await action(event({ ...values, smallId: 'OTHER1' }))).toMatchObject({ status: 404 });
		expect(service.submit).not.toHaveBeenCalled();
	});
	it('rejects guest attempts to use administrative controls', async () => {
		expect(
			await action(event({ ...values, smallId: 'TARGET', actionType: 'enable' }))
		).toMatchObject({ status: 403 });
		expect(service.update).not.toHaveBeenCalled();
	});
	it('uses the atomic public submission and reports an already closed form', async () => {
		service.submit.mockResolvedValueOnce(undefined);
		expect(await action(event({ ...values, smallId: 'TARGET' }))).toMatchObject({ status: 409 });
		expect(service.update).not.toHaveBeenCalled();
	});
	it('accepts valid values for an open form', async () => {
		expect(await action(event({ ...values, smallId: 'TARGET' }))).toMatchObject({ success: true });
		expect(service.submit).toHaveBeenCalledOnce();
	});
});

describe('login throttling', () => {
	it('stops a blocked IP before parsing the account or checking its password', async () => {
		mocks.limit.mockResolvedValue({ allowed: false, retryAfter: 900 });
		const e = event({ username: 'admin', password: 'fake' });
		expect(await login.default(e)).toMatchObject({ status: 429 });
		expect(e.setHeaders).toHaveBeenCalledWith({ 'Retry-After': '900' });
		expect(mocks.verify).not.toHaveBeenCalled();
	});
	it('normalises account names and blocks distributed attempts on one account', async () => {
		mocks.limit
			.mockResolvedValueOnce({ allowed: true })
			.mockResolvedValueOnce({ allowed: false, retryAfter: 99 });
		expect(await login.default(event({ username: ' ADMIN ', password: 'fake' }))).toMatchObject({
			status: 429
		});
		expect(mocks.limit.mock.calls[1][1]).toBe('admin');
		expect(mocks.verify).not.toHaveBeenCalled();
	});
	it('fails closed on storage errors', async () => {
		mocks.limit.mockRejectedValueOnce(new Error('offline'));
		expect(await login.default(event({ username: 'admin', password: 'fake' }))).toMatchObject({
			status: 503
		});
		expect(mocks.verify).not.toHaveBeenCalled();
	});
	it('retains successful login and its redirect', async () => {
		mocks.verify.mockResolvedValueOnce(true);
		await expect(
			login.default(event({ username: 'admin', password: 'fake' }))
		).rejects.toMatchObject({ status: 303, location: '/admin/bookings' });
		expect(mocks.session).toHaveBeenCalledOnce();
	});
});

describe('public input and mail safety', () => {
	it('rejects malformed and nested analytics without writing to the database', async () => {
		for (const body of [
			'null',
			'{',
			JSON.stringify({ goal: 'opened', params: { nested: { payload: 'fake' } } })
		]) {
			const response = await analytics({
				request: new Request('https://audit.invalid/api/analytics', { method: 'POST', body })
			} as any);
			expect(response.status).toBe(400);
		}
		expect(mocks.insert).not.toHaveBeenCalled();
	});
	it('retains valid analytics events', async () => {
		const response = await analytics({
			request: new Request('https://audit.invalid/api/analytics', {
				method: 'POST',
				body: JSON.stringify({ goal: 'opened', page: '/questionnaires', params: { progress: 75 } })
			})
		} as any);
		expect(response.status).toBe(200);
		expect(mocks.values).toHaveBeenCalledOnce();
	});
	it('does not send or change tokens when a recipient is on cooldown', async () => {
		mocks.limit.mockResolvedValueOnce({ allowed: false, retryAfter: 600 });
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		const e = event({});
		e.request = new Request(e.url, {
			method: 'POST',
			body: JSON.stringify({ email: 'TEST@example.invalid' })
		});
		expect((await subscribe(e)).status).toBe(429);
		expect(mocks.subscriber).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});
	it('never exposes provider response bodies, email or tokens in error logs or responses', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('PRIVATE_PROVIDER_BODY TEST_MAIL_TOKEN', { status: 500 }))
		);
		const e = event({});
		e.request = new Request(e.url, {
			method: 'POST',
			body: JSON.stringify({ email: 'private@example.invalid' })
		});
		const response = await subscribe(e);
		const output = JSON.stringify(log.mock.calls) + (await response.text());
		for (const secret of [
			'PRIVATE_PROVIDER_BODY',
			'TEST_MAIL_TOKEN',
			'PRIVATE_CONFIRMATION_TOKEN',
			'private@example.invalid'
		])
			expect(output).not.toContain(secret);
		log.mockRestore();
	});
	it('generates quiz email text on the server and ignores forged recommendations', async () => {
		const answers = Object.fromEntries(
			bat23Config.questions
				.filter((q) => q.type === 'radio')
				.map((q) => [q.id, q.options![0].value])
		);
		const fetch = vi.fn(
			async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('OK')
		);
		vi.stubGlobal('fetch', fetch);
		const response = await mailResults.sendResults(
			event({
				email: 'test@example.invalid',
				answers: JSON.stringify(answers),
				total_recommendation: 'FORGED_CONTENT',
				sub0_desc: 'FORGED_CONTENT'
			})
		);
		expect(response).toEqual({ success: true });
		const body = JSON.parse(fetch.mock.calls[0][1]!.body as string);
		expect(JSON.stringify(body)).not.toContain('FORGED_CONTENT');
		expect(body.params.total_recommendation).toBeTruthy();
	});
	it('does not send results for incomplete or invalid answers', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		expect(
			await mailResults.sendResults(event({ email: 'test@example.invalid', answers: '{"q1":999}' }))
		).toMatchObject({ status: 400 });
		expect(fetch).not.toHaveBeenCalled();
	});
});
