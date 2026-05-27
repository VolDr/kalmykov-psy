import { json } from '@sveltejs/kit';
import { db } from '../../..';
import { analyticsEvents } from '../../../db/schema';

export async function POST({ request }) {
  const { goal, sessionId, page, params } = await request.json();

  if (!goal) return json({ error: 'goal required' }, { status: 400 });

  await db.insert(analyticsEvents).values({
    goal,
    sessionId: sessionId ?? null,
    page:      page ?? null,
    params: (typeof params === 'object' && params !== null && Object.keys(params).length > 0) ? params : null
  });

  return json({ ok: true });
}