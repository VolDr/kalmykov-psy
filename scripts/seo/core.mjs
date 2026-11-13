import { createHash } from 'node:crypto';

export const SITE = 'https://kalmykov-psy.ru';
export const FORMATS = ['article', 'landing', 'tool'];
const clusters = [
  ['burnout', /выгор|истощ|устал|отдых/u],
  ['procrastination', /прокрастин|откладыв|не могу начать|мотивац/u],
  ['anxiety', /тревог|страх|беспоко|паник/u],
  ['perfectionism', /перфекциониз|ошиб|идеальн|самокрит|самооцен/u],
  ['self-regulation', /эмоци|регуляц|ценност|контрол/u]
];
const specialized = /выгор|прокрастин|тревог|перфекциониз|самокрит|работ|стресс|устал|эмоци|не могу начать|контрол|ценност|самооцен|отдых|мотивац|страх|беспоко/u;
const transactional = /психолог|психотерапевт|консультац|записат|стоимост|цена|онлайн сесс|терапия/u;
const problem = /как справит|что делат|помоги|избавит|не могу|как перестат|восстанов|преодол|лечен|почему/u;

export function intent(query) {
  const q = String(query || '').toLowerCase().normalize('NFKC');
  if (!specialized.test(q) && !transactional.test(q)) return 'outside';
  if (transactional.test(q) && (specialized.test(q) || /психолог|психотерапевт/u.test(q))) return 'consultation';
  if (problem.test(q)) return 'problem';
  return 'information';
}
export function cluster(query) {
  const q = String(query || '').toLowerCase();
  return clusters.find(([, rule]) => rule.test(q))?.[0] ?? 'other';
}
export function priority(row) {
  const type = intent(row.query);
  if (type === 'outside') return 0;
  const position = Number(row.position);
  const impressions = Math.max(0, Number(row.impressions) || 0);
  const proximity = position >= 8 && position <= 20 ? 40 : position > 0 && position < 8 ? 16 : position > 20 && position <= 35 ? 8 : 0;
  const conversion = type === 'consultation' ? 36 : type === 'problem' ? 24 : 9;
  const demand = Math.min(24, Math.log1p(impressions) * 4);
  return Math.round(proximity + conversion + demand);
}
export function aggregateSearch(rows) {
  const map = new Map();
  for (const item of rows) {
    if (!item || typeof item.query !== 'string' || !item.query.trim()) continue;
    const key = `${item.provider}|${item.query.toLowerCase().trim()}|${item.page || ''}|${item.windowDays}`;
    if (map.has(key)) continue;
    const impressions = Number(item.impressions) || 0;
    const clicks = Number(item.clicks) || 0;
    map.set(key, {
      provider: item.provider, query: item.query.trim(), page: item.page || null,
      windowDays: Number(item.windowDays), impressions, clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position: Number.isFinite(Number(item.position)) && item.position != null ? Number(item.position) : null,
      intent: intent(item.query), cluster: cluster(item.query), priority: priority(item)
    });
  }
  return [...map.values()].sort((a, b) => b.priority - a.priority || a.query.localeCompare(b.query, 'ru'));
}
export function topicId(query, format = 'article') {
  return `${format}-${createHash('sha256').update(query.trim().toLowerCase().normalize('NFKC')).digest('hex').slice(0, 12)}`;
}
export function validSlug(slug) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || ''); }
export function validateDraft(draft, sourceIds = []) {
  const errors = [];
  for (const f of ['title', 'description', 'h1', 'markdown', 'slug', 'author'])
    if (typeof draft[f] !== 'string' || !draft[f].trim()) errors.push(`missing:${f}`);
  if (!validSlug(draft.slug)) errors.push('invalid:slug');
  if (!draft.markdown?.match(/\n##\s+\S/u)) errors.push('missing:h2');
  if (!draft.markdown?.includes('](/')) errors.push('missing:internal-link');
  if (!draft.markdown?.match(/\]\(https?:\/\//u)) errors.push('missing:source-link');
  if (!draft.markdown?.includes('/booking')) errors.push('missing:booking-link');
  if (!draft.markdown?.includes(draft.author ?? '\0')) errors.push('missing:author-in-body');
  const cited = Array.isArray(draft.sourceIds) ? draft.sourceIds : [];
  if (!cited.length || cited.some((id) => !sourceIds.includes(id))) errors.push('invalid:sources');
  return errors;
}
export function canRelease(review, draft, expectedHash) {
  if (!review || review.draftHash !== expectedHash || !draft) return false;
  if (review.mode !== 'independent') return false;
  if (!['A', 'B', 'C', 'D'].every((key) => review.checks?.[key]?.passed === true)) return false;
  return Number.isInteger(review.checks.C.score) && review.checks.C.score >= 1 && review.checks.C.score <= 3 && review.checks.D.screenshots?.length === 2;
}
export function hashContent(value) { return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex'); }
