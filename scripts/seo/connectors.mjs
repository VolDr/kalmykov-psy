import { SITE } from './core.mjs';

async function json(url, init = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
  return response.json();
}
export function dateWindow(days, now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}
export async function searchConsole(days, env = process.env) {
  const token = env.SEO_GSC_TOKEN, site = env.SEO_GSC_PROPERTY;
  if (!token || !site) return { status: 'missing-access', provider: 'google', days, rows: [] };
  const { from, to } = dateWindow(days);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const rows = [];
  let truncated = false;
  for (let startRow = 0; startRow <= 50000; startRow += 25000) {
    const response = await json(endpoint, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: from, endDate: to, dimensions: ['query', 'page'], type: 'web', dataState: 'final', rowLimit: 25000, startRow })
    });
    const batch = response.rows ?? [];
    if (startRow === 50000) { truncated = batch.length > 0; break; }
    rows.push(...batch.map((r) => ({ provider: 'google', windowDays: days, query: r.keys?.[0], page: r.keys?.[1], impressions: r.impressions, clicks: r.clicks, position: r.position })));
    if (batch.length < 25000) break;
  }
  return { status: 'ok', provider: 'google', days, from, to, partial: true, truncated, rows };
}
export async function yandexWebmaster(days, env = process.env) {
  const token = env.SEO_YANDEX_TOKEN, user = env.SEO_YANDEX_USER_ID, host = env.SEO_YANDEX_HOST_ID;
  if (!token || !user || !host) return { status: 'missing-access', provider: 'yandex', days, rows: [] };
  const { from, to } = dateWindow(days);
  const all = [];
  let count = null;
  for (let offset = 0; offset < 3000; offset += 500) {
    const u = new URL(`https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(user)}/hosts/${encodeURIComponent(host)}/search-queries/popular`);
    u.searchParams.set('order_by', 'TOTAL_SHOWS');
    for (const item of ['TOTAL_SHOWS', 'TOTAL_CLICKS', 'AVG_SHOW_POSITION']) u.searchParams.append('query_indicator', item);
    u.searchParams.set('date_from', from); u.searchParams.set('date_to', to);
    u.searchParams.set('offset', String(offset)); u.searchParams.set('limit', '500');
    const res = await json(u, { headers: { Authorization: `OAuth ${token}` } });
    count = res.count ?? count;
    const batch = res.queries ?? [];
    all.push(...batch.map((q) => ({ provider: 'yandex', windowDays: days, query: q.query_text,
      page: null, impressions: q.indicators?.TOTAL_SHOWS ?? 0,
      clicks: q.indicators?.TOTAL_CLICKS ?? 0, position: q.indicators?.AVG_SHOW_POSITION ?? null })));
    if (batch.length < 500) break;
  }
  return { status: 'ok', provider: 'yandex', days, from, to, partial: true, note: 'Popular queries only; page dimension unavailable; not total demand', count, rows: all };
}
export async function metrika(days, env = process.env) {
  if (!env.SEO_METRIKA_TOKEN || !env.SEO_METRIKA_COUNTER_ID) return { status: 'missing-access', days };
  const { from, to } = dateWindow(days);
  const u = new URL('https://api-metrika.yandex.net/stat/v1/data');
  u.searchParams.set('ids', env.SEO_METRIKA_COUNTER_ID);
  u.searchParams.set('date1', from); u.searchParams.set('date2', to);
  u.searchParams.set('dimensions', 'ym:s:lastTrafficSource');
  u.searchParams.set('metrics', 'ym:s:visits');
  u.searchParams.set('limit', '100');
  const res = await json(u, { headers: { Authorization: `OAuth ${env.SEO_METRIKA_TOKEN}` } });
  return { status: 'ok', days, from, to, trafficSources: (res.data ?? []).map((item) => ({ source: item.dimensions?.[0]?.name ?? 'unknown', visits: item.metrics?.[0] ?? 0 })), note: 'Aggregate traffic only; lead conversion goals require verified goal IDs or aggregate server export' };
}
export async function competitors(query, env = process.env) {
  if (!env.SEO_SERPAPI_KEY) return { status: 'missing-access', results: [] };
  const u = new URL('https://serpapi.com/search.json');
  u.searchParams.set('engine', 'google'); u.searchParams.set('q', query);
  u.searchParams.set('hl', 'ru'); u.searchParams.set('num', '10');
  u.searchParams.set('api_key', env.SEO_SERPAPI_KEY);
  const out = await json(u);
  return { status: 'ok', results: (out.organic_results ?? []).slice(0, 10).map((x) => ({ title: x.title, url: x.link, snippet: x.snippet ?? '', rank: x.position })) };
}
export async function verifyDoi(doi) {
  if (!/^10\.\d{4,9}\/[\x21-\x7e]+$/i.test(doi)) throw new Error('Invalid DOI');
  const out = await json(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  const m = out.message;
  const year = m.published?.['date-parts']?.[0]?.[0] ?? m.issued?.['date-parts']?.[0]?.[0] ?? null;
  return { doi: m.DOI, url: m.URL ?? `https://doi.org/${doi}`, title: m.title?.[0] ?? '', year, type: m.type, metadataVerified: true, abstract: typeof m.abstract === 'string' ? m.abstract.replace(/<[^>]+>/g, ' ').slice(0, 4000) : null };
}
export const SITE_URL = SITE;
