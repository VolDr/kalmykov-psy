import { browser } from '$app/environment';

const COUNTER_ID = 105424317;

// session_id живёт в sessionStorage — один на вкладку
const SESSION_ID = browser
  ? (sessionStorage.getItem('sid') ?? crypto.randomUUID())
  : '';

if (browser) sessionStorage.setItem('sid', SESSION_ID);

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (!browser) return;

  // Яндекс Метрика
  if (typeof window.ym === 'function') {
    window.ym(COUNTER_ID, 'reachGoal', goal, params);
  }

  // Своя база
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal,
      sessionId: SESSION_ID,
      page:      window.location.pathname,
      params:    params ?? null
    })
  }).catch(() => {}); // тихо глотаем ошибки — аналитика не должна ломать UX
}