// Simple in-memory rate limit: 5 booking attempts per IP per minute.
// Works for single-process deployments. For multi-process, use Redis.
const ipWindow = new Map<string, { count: number; resetAt: number }>();

// Periodically clean up expired entries to prevent unbounded memory growth
setInterval(() => {
	const now = Date.now();
	for (const [ip, data] of ipWindow.entries()) {
		if (data.resetAt < now) ipWindow.delete(ip);
	}
}, 60_000);

export function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = ipWindow.get(ip);
	if (!entry || entry.resetAt < now) {
		ipWindow.set(ip, { count: 1, resetAt: now + 60_000 });
		return false;
	}
	if (entry.count >= 5) return true;
	entry.count++;
	return false;
}

export function _clearIpWindowForTest() {
	ipWindow.clear();
}
