import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, open, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

const DAY = 24 * 60 * 60 * 1000;

type TokenState = {
	version: 1;
	sourceFingerprint: string;
	accessToken: string;
	refreshedAt: number | null;
	expiresAt: number | null;
	nextAttemptAt: number;
	refreshFailed: boolean;
};

type TokenOptions = {
	seedToken: string;
	filePath: string;
	refresh: (token: string) => Promise<unknown>;
	now?: () => number;
};

/** The refreshed token survives restarts; replacing .env's seed resets the saved connection. */
export class InstagramTokenStore {
	private state: TokenState | undefined;
	private loading: Promise<TokenState> | undefined;
	private refreshing: Promise<'skipped' | 'refreshed' | 'failed'> | undefined;
	private readonly now: () => number;

	constructor(private readonly options: TokenOptions) {
		this.now = options.now ?? Date.now;
	}

	private async load(): Promise<TokenState> {
		if (this.state) return this.state;
		if (this.loading) return this.loading;
		this.loading = this.readState();
		try {
			this.state = await this.loading;
			return this.state;
		} finally {
			this.loading = undefined;
		}
	}

	private async readState(): Promise<TokenState> {
		const sourceFingerprint = createHash('sha256').update(this.options.seedToken).digest('hex');
		try {
			const saved: unknown = JSON.parse(await readFile(this.options.filePath, 'utf8'));
			if (
				typeof saved === 'object' &&
				saved !== null &&
				'sourceFingerprint' in saved &&
				saved.sourceFingerprint !== sourceFingerprint
			) {
				// An explicitly replaced seed in .env starts a new connection.
				return this.freshState(sourceFingerprint);
			}
			if (
				typeof saved === 'object' &&
				saved !== null &&
				'version' in saved &&
				saved.version === 1 &&
				'sourceFingerprint' in saved &&
				saved.sourceFingerprint === sourceFingerprint &&
				'accessToken' in saved &&
				typeof saved.accessToken === 'string' &&
				saved.accessToken &&
				'nextAttemptAt' in saved &&
				typeof saved.nextAttemptAt === 'number' &&
				Number.isFinite(saved.nextAttemptAt) &&
				'refreshedAt' in saved &&
				(saved.refreshedAt === null ||
					(typeof saved.refreshedAt === 'number' && Number.isFinite(saved.refreshedAt))) &&
				'expiresAt' in saved &&
				(saved.expiresAt === null ||
					(typeof saved.expiresAt === 'number' && Number.isFinite(saved.expiresAt))) &&
				'refreshFailed' in saved &&
				typeof saved.refreshFailed === 'boolean'
			) {
				return saved as TokenState;
			}
			throw new Error('Invalid Instagram token file');
		} catch (error) {
			if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
				// A corrupt/unreadable persisted token must not silently fall back to an expired seed.
				throw new Error(
					'Не удалось прочитать сохранённый токен Instagram. Проверьте файл и права доступа.'
				);
			}
		}
		return this.freshState(sourceFingerprint);
	}

	private freshState(sourceFingerprint: string): TokenState {
		return {
			version: 1,
			sourceFingerprint,
			accessToken: this.options.seedToken,
			refreshedAt: null,
			expiresAt: null,
			nextAttemptAt: this.now(),
			refreshFailed: false
		};
	}

	private async persist(state: TokenState) {
		await mkdir(dirname(this.options.filePath), { recursive: true, mode: 0o700 });
		const temporary = `${this.options.filePath}.${randomUUID()}.tmp`;
		try {
			const file = await open(temporary, 'wx', 0o600);
			try {
				await file.writeFile(JSON.stringify(state));
				await file.sync();
			} finally {
				await file.close();
			}
			await rename(temporary, this.options.filePath);
		} finally {
			await unlink(temporary).catch(() => {});
		}
	}

	async getToken(): Promise<string> {
		if (!this.options.seedToken) return '';
		return (await this.load()).accessToken;
	}

	async getStatus() {
		if (!this.options.seedToken)
			return {
				configured: false,
				refreshedAt: null,
				expiresAt: null,
				nextAttemptAt: null,
				refreshFailed: false
			};
		const state = await this.load();
		return {
			configured: true,
			refreshedAt: state.refreshedAt,
			expiresAt: state.expiresAt,
			nextAttemptAt: state.nextAttemptAt,
			refreshFailed: state.refreshFailed
		};
	}

	check(): Promise<'skipped' | 'refreshed' | 'failed'> {
		if (this.refreshing) return this.refreshing;
		this.refreshing = this.refreshIfDue().finally(() => {
			this.refreshing = undefined;
		});
		return this.refreshing;
	}

	private async refreshIfDue(): Promise<'skipped' | 'refreshed' | 'failed'> {
		if (!this.options.seedToken) return 'skipped';
		const current = await this.load();
		if (this.now() < current.nextAttemptAt) return 'skipped';
		try {
			const result = await this.options.refresh(current.accessToken);
			if (
				typeof result !== 'object' ||
				result === null ||
				!('access_token' in result) ||
				typeof result.access_token !== 'string' ||
				!result.access_token ||
				!('expires_in' in result) ||
				typeof result.expires_in !== 'number' ||
				!Number.isFinite(result.expires_in) ||
				result.expires_in < DAY / 1000
			)
				throw new Error('Invalid token refresh response');
			const lifetime = result.expires_in * 1000;
			const next: TokenState = {
				...current,
				accessToken: result.access_token,
				refreshedAt: this.now(),
				expiresAt: this.now() + lifetime,
				nextAttemptAt: this.now() + Math.min(30 * DAY, lifetime / 2),
				refreshFailed: false
			};
			// Persist before publishing the new credential to the running app.
			await this.persist(next);
			this.state = next;
			return 'refreshed';
		} catch {
			// Includes newly issued tokens (<24h), outages, and revoked/expired credentials.
			// Retain the working token and retry daily, including across process restarts.
			const retry = { ...current, nextAttemptAt: this.now() + DAY, refreshFailed: true };
			this.state = retry;
			await this.persist(retry);
			return 'failed';
		}
	}
}
