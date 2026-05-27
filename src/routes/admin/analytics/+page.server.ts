
import { desc, sql, count } from 'drizzle-orm';
import { analyticsEvents } from '../../../db/schema';
import { db } from '../../..';

export async function load() {

  const topGoals = await db
    .select({
      goal:  analyticsEvents.goal,
      total: count()
    })
    .from(analyticsEvents)
    .groupBy(analyticsEvents.goal)
    .orderBy(desc(count()));


  const recent = await db
    .select()
    .from(analyticsEvents)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(50);


  const byDay = await db.execute(sql`
    select
      date_trunc('day', created_at) as day,
      goal,
      count(*)::int as total
    from analytics_events
    where created_at > now() - interval '7 days'
    group by 1, 2
    order by 1
  `);

  return { topGoals, recent, byDay: byDay.rows };
}