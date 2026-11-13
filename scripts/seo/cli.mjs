#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { aggregateSearch, intent, cluster, topicId, FORMATS, validateDraft, hashContent, canRelease, validSlug, SITE } from './core.mjs';
import { searchConsole, yandexWebmaster, metrika, competitors, verifyDoi } from './connectors.mjs';
import { runCodex, RESEARCH_SCHEMA, DRAFT_SCHEMA, REVIEW_SCHEMA, researchPrompt, draftPrompt, reviewPrompt, screenshots } from './agents.mjs';

const argv = process.argv.slice(2);
const command = argv[0] ?? 'help';
const flags = Object.fromEntries(argv.slice(1).filter((x) => x.startsWith('--')).map((x) => {
  const [name, ...value] = x.slice(2).split('='); return [name, value.length ? value.join('=') : true];
}));
const dry = Boolean(flags['dry-run']);
const root = resolve(String(flags.dir || 'storage/seo-pipeline'));
const today = new Date().toISOString().slice(0, 10);
const pathFor = (...parts) => join(root, ...parts);
function output(value) { console.log(JSON.stringify(value, null, 2)); }
function read(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function save(path, value) { if (!dry) { mkdirSync(resolve(path, '..'), { recursive: true }); writeFileSync(path, JSON.stringify(value, null, 2) + '\n'); } return value; }
function required(path) { if (!existsSync(path)) throw new Error(`Missing ${path}`); return read(path); }
function titlePath(id, name) { return pathFor('topics', id, `${name}.json`); }
function topic(id) { return required(titlePath(id, 'brief')); }
function savedRecords() { const dir = pathFor('snapshots'); return existsSync(dir) ? readdirSync(dir).filter(x => x.endsWith('.json')).map(x => read(join(dir, x))) : []; }
function topicDirectory(id) { return pathFor('topics', id); }
function listExistingSlugs() {
  const dir = resolve('content/articles');
  return existsSync(dir) ? readdirSync(dir).filter(x => x.endsWith('.md')).map(x => basename(x, '.md')) : [];
}
function avoidDuplicateSlug(slug, id = '') {
  if (!validSlug(slug)) throw new Error('Slug must be lowercase latin / hyphens only');
  if (listExistingSlugs().includes(slug)) throw new Error('Slug already exists on site (collision check only)');
  const parent = pathFor('topics');
  if (existsSync(parent) && readdirSync(parent, { withFileTypes: true }).some(d => d.isDirectory() && d.name !== id && existsSync(join(parent, d.name, 'brief.json')) && read(join(parent, d.name, 'brief.json')).slug === slug)) throw new Error('Slug already reserved in another topic');
}
async function collect() {
  if (dry) return output({ dryRun: true, commands: ['Search Console 28/90 days', 'Yandex Webmaster 28/90 days', 'Yandex Metrika aggregated visits 28/90 days'], missingCredentials: credentialStatus() });
  const results = [];
  for (const days of [28, 90]) {
    for (const [name, fn] of [['google', searchConsole], ['yandex', yandexWebmaster], ['metrika', metrika]]) {
      try { results.push({ name, ...await fn(days) }); }
      catch (e) { results.push({ name, days, status: 'error', message: String(e) }); }
    }
  }
  const report = { createdAt: new Date().toISOString(), site: SITE, results,
    notes: ['Search engine data is partial and must not be interpreted as total search volume.', 'SEO pipeline never reads questionnaire answers.'] };
  save(pathFor('snapshots', `${today}.json`), report);
  output({ saved: pathFor('snapshots', `${today}.json`), results: results.map(x => ({ name: x.name, days: x.days, status: x.status, rows: x.rows?.length ?? null })) });
}
function credentialStatus() { return { google: Boolean(process.env.SEO_GSC_TOKEN && process.env.SEO_GSC_PROPERTY), yandex: Boolean(process.env.SEO_YANDEX_TOKEN && process.env.SEO_YANDEX_USER_ID && process.env.SEO_YANDEX_HOST_ID), metrika: Boolean(process.env.SEO_METRIKA_TOKEN && process.env.SEO_METRIKA_COUNTER_ID), serpapi: Boolean(process.env.SEO_SERPAPI_KEY) }; }
function plan() {
  const snapshots = savedRecords().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = snapshots[0];
  const fromFile = flags.input && existsSync(String(flags.input)) ? read(String(flags.input)) : null;
  const records = fromFile ? (Array.isArray(fromFile) ? fromFile : fromFile.rows ?? []) : latest?.results.flatMap(x => x.rows ?? []) ?? [];
  const ranked = aggregateSearch(records).filter(r => r.intent !== 'outside');
  const groups = Object.groupBy(ranked, r => r.cluster);
  const proposals = Object.entries(groups).map(([name, rows]) => ({ cluster: name, topQueries: rows.slice(0, 10),
    score: Math.max(...rows.map(r => r.priority)), suggestedFormat: rows.some(r => r.intent === 'consultation') ? 'landing' : 'article',
    demandMeasured: rows.some(r => r.impressions > 0), competitorResearch: 'pending', existingPageAudit: 'pending', conversionPotential: rows.some(r => r.intent === 'consultation') ? 'high' : 'unknown' })).sort((a, b) => b.score - a.score);
  const result = { date: today, source: fromFile ? 'fixture-input' : latest ? 'search-console-snapshot' : 'missing-analytics', status: proposals.length ? 'requires-research' : 'blocked-no-search-data', proposals };
  save(pathFor('plan.json'), result); output({ ...result, dryRun: dry });
}
function createTopic() {
  const query = String(flags.query ?? '').trim();
  const slug = String(flags.slug ?? '');
  const format = String(flags.format ?? 'article');
  if (!query || !FORMATS.includes(format)) throw new Error('Use --query="..." --slug=latin-slug --format=article|landing|tool');
  const id = topicId(query, format);
  avoidDuplicateSlug(slug, id);
  if (existsSync(titlePath(id, 'brief'))) return output({ id, unchanged: true, brief: titlePath(id, 'brief') });
  const result = { id, query, slug, format, intent: intent(query), cluster: cluster(query), author: 'Андрей Калмыков, психолог', targetAudience: 'Русскоязычные взрослые', searchDemand: 'unknown', competition: 'pending', conversion: 'consultation', internalLinks: ['/online-therapy', '/questionnaires', '/booking?acquaintance'], createdAt: today };
  save(titlePath(id, 'brief'), result); output({ ...result, dryRun: dry });
}
async function research(id) {
  const brief = topic(id); const file = titlePath(id, 'research');
  if (existsSync(file) && !flags.force) return output({ id, status: 'unchanged', path: file });
  if (dry) return output({ dryRun: true, id, steps: ['SERP from licensed provider', 'Codex research agent', 'Crossref DOI metadata verification', 'source dossier'] });
  let serp = { status: 'missing-access', results: [] };
  if (flags['serp-file']) serp = { status: 'file-import', results: required(String(flags['serp-file'])) };
  else serp = await competitors(brief.query);
  if (!['ok', 'file-import'].includes(serp.status)) return output(save(file, { status: 'blocked-serp-access', sources: [], serp }));
  let candidates;
  try { candidates = runCodex(researchPrompt(brief, serp.results), RESEARCH_SCHEMA, pathFor('scratch', id, 'research')); }
  catch (e) { return output(save(file, { status: 'blocked-codex', sources: [], error: String(e), serp })); }
  const verified = [];
  for (const x of candidates.sources.slice(0, 12)) {
    try { const meta = await verifyDoi(x.doi); verified.push({ ...meta, claim: x.claim, limitations: x.limitations, kind: x.kind, evidenceSupport: 'pending-independent-review' }); }
    catch (e) { verified.push({ doi: x.doi, metadataVerified: false, error: String(e), claim: x.claim, limitations: x.limitations, kind: x.kind }); }
  }
  const ready = verified.some(s => s.metadataVerified && s.claim.trim() && s.limitations.trim());
  const result = { status: ready ? 'metadata-verified-awaiting-claim-review' : 'blocked-unverified-sources', createdAt: new Date().toISOString(),
    serp, competitorAnalysis: candidates.competitorAnalysis, searchIntent: candidates.intent, sources: verified };
  save(file, result); output({ status: result.status, id, sources: verified.length, verified: verified.filter(x => x.metadataVerified).length });
}
function versionPath(id, version) { return titlePath(id, `draft-v${version}`); }
function currentDraft(id) { const state = required(titlePath(id, 'state')); return { state, draft: required(versionPath(id, state.version)) }; }
function storeDraft(id, draft, status = 'draft') {
  const stateFile = titlePath(id, 'state');
  const old = existsSync(stateFile) ? read(stateFile) : { version: 0, history: [] };
  const hash = hashContent(draft);
  if (old.hash === hash) return old;
  const version = old.version + 1;
  save(versionPath(id, version), draft);
  const state = { version, hash, status, history: [...old.history, { version, hash, savedAt: new Date().toISOString(), reason: status }] };
  save(stateFile, state); return state;
}
async function draft(id, correction = '') {
  const brief = topic(id); const research = required(titlePath(id, 'research'));
  if (research.status !== 'metadata-verified-awaiting-claim-review') return output({ id, status: 'blocked-research', researchStatus: research.status });
  if (dry) return output({ dryRun: true, id, wouldCall: 'Codex writer' });
  let article;
  try { article = runCodex(draftPrompt(brief, research, correction), DRAFT_SCHEMA, pathFor('scratch', id, 'draft')); }
  catch (e) { return output({ id, status: 'blocked-codex', error: String(e) }); }
  if (article.slug !== brief.slug) return output({ id, status: 'blocked-slug-mismatch' });
  avoidDuplicateSlug(article.slug, id);
  const sourceIds = research.sources.filter(x => x.metadataVerified).map(x => x.doi);
  const errors = validateDraft(article, sourceIds);
  if (errors.length) return output({ id, status: 'blocked-validation', errors });
  const state = storeDraft(id, article, correction ? 'revised' : 'draft');
  output({ id, status: 'draft-only', version: state.version, hash: state.hash });
}
async function review(id) {
  if (dry) return output({ dryRun: true, id, gates: ['A scientific', 'B SEO', 'C AI slop <=3', 'D screenshots and UX'] });
  const brief = topic(id), research = required(titlePath(id, 'research'));
  const { state, draft: article } = currentDraft(id);
  const checks = {};
  const sourceIds = research.sources.filter(x => x.metadataVerified).map(x => x.doi);
  const errors = validateDraft(article, sourceIds);
  if (errors.length) return output({ id, status: 'blocked-validation', errors });
  const visual = await screenshots(article, pathFor('screenshots', id, `v${state.version}`)).catch(e => ({ status: 'screenshot-error', error: String(e), files: [] }));
  for (const letter of ['A', 'B', 'C', 'D']) {
    if (letter === 'D' && visual.files.length !== 2) { checks.D = { passed: false, score: 0, findings: [visual.status], screenshots: [] }; continue; }
    try {
      const result = runCodex(reviewPrompt(letter, article, research, brief), REVIEW_SCHEMA, pathFor('scratch', id, `review-${letter}`), letter === 'D' ? visual.files : []);
      checks[letter] = { ...result, passed: result.passed && (letter !== 'C' || (result.score >= 1 && result.score <= 3)), ...(letter === 'D' ? { screenshots: visual.files, previewOnly: true } : {}) };
    } catch (e) { checks[letter] = { passed: false, score: 0, findings: [String(e)], ...(letter === 'D' ? { screenshots: visual.files } : {}) }; }
  }
  const result = { mode: 'independent', reviewedAt: new Date().toISOString(), draftHash: state.hash, draftVersion: state.version, checks };
  result.status = canRelease(result, article, state.hash) ? 'passed-for-human-approval' : 'needs-revision';
  save(titlePath(id, 'review'), result);
  output({ id, status: result.status, checks: Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, { passed: v.passed, score: v.score, findings: v.findings }])) });
}
async function cycle(id) {
  if (dry) return output({ dryRun: true, id, maxRevisions: Number(flags.revisions || 2) });
  for (let attempt = 0; attempt <= Math.min(3, Number(flags.revisions || 2)); attempt++) {
    await review(id);
    const results = required(titlePath(id, 'review'));
    if (results.status === 'passed-for-human-approval') return output({ id, status: results.status });
    if (attempt >= Math.min(3, Number(flags.revisions || 2))) break;
    if (Object.values(results.checks).some(x => x.findings.some(y => /missing-playwright|screenshot-error|ENOENT|codex/i.test(y)))) break;
    const notes = Object.entries(results.checks).filter(([, r]) => !r.passed).map(([letter, r]) => `${letter}: ${r.findings.join('; ')}`).join('\n');
    const old = currentDraft(id).draft;
    await draft(id, `Исправь замечания: ${notes}. Старый текст для точечной редакции: ${JSON.stringify(old)}`);
  }
  output({ id, status: 'needs-human-intervention' });
}
function status(id) {
  const dir = topicDirectory(id);
  const names = existsSync(dir) ? readdirSync(dir).filter(x => x.endsWith('.json')) : [];
  const state = existsSync(titlePath(id, 'state')) ? read(titlePath(id, 'state')) : null;
  const review = existsSync(titlePath(id, 'review')) ? read(titlePath(id, 'review')) : null;
  output({ id, files: names, currentDraft: state, reviewStatus: review?.status ?? 'not-reviewed', eligibleForHumanApproval: state && review ? canRelease(review, required(versionPath(id, state.version)), state.hash) : false, livePublication: false });
}
function monitor(id) {
  const published = existsSync(titlePath(id, 'publication')) ? read(titlePath(id, 'publication')) : null;
  if (!published?.approvedByHuman || !published?.publishedAt) return output({ id, status: 'not-published', monitoring: 'not-started' });
  const age = Math.floor((Date.now() - Date.parse(published.publishedAt)) / 86400000);
  const snapshots = savedRecords().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows = snapshots.map(s => ({ date: s.createdAt.slice(0, 10), matching: s.results.filter(x => x.name === 'google').flatMap(x => x.rows ?? []).filter(x => x.page === published.url) }));
  const milestones = [7, 21, 60].map(day => {
    if (age < day) return { day, status: 'not-due' };
    const current = rows.find(r => r.date >= new Date(Date.parse(published.publishedAt) + day * 86400000).toISOString().slice(0, 10) && r.matching.length);
    const baseline = rows.find(r => r.date < published.publishedAt.slice(0, 10) && r.matching.length);
    if (!current || !baseline) return { day, status: 'missing-comparable-metrics', visits: null, leads: null };
    const sum = arr => arr.reduce((acc, x) => acc + Number(x.impressions || 0), 0);
    const before = sum(baseline.matching), after = sum(current.matching);
    return { day, status: 'observed-partial-data', beforeImpressions: before, afterImpressions: after,
      possibleCauses: after < before ? ['Seasonality', 'Indexing', 'SERP changes', 'Different query coverage', 'Technical changes'] : [],
      organicVisits: null, bookingClicks: null, enquiries: null, autoRollback: false };
  });
  const report = { id, publishedAt: published.publishedAt, checkedAt: new Date().toISOString(), milestones };
  save(titlePath(id, 'monitor'), report); output(report);
}
function demo() {
  const query = 'почему я откладываю сложные задачи на работе';
  const id = topicId(query);
  const brief = { id, query, slug: 'otkladyvayu-slozhnye-zadachi-demo', format: 'article', intent: intent(query), cluster: cluster(query),
    author: 'Андрей Калмыков, психолог', searchDemand: 'unknown', competition: 'unverified', demo: true, createdAt: today };
  const evidence = { status: 'demo-unverified-not-for-publication', serp: { status: 'missing-access', results: [] },
    sources: [{ doi: '10.1037/0033-2909.133.1.65', url: 'https://doi.org/10.1037/0033-2909.133.1.65', year: 2007, kind: 'meta-analysis', metadataVerified: false,
      claim: 'Прокрастинация связана с характеристиками задачи и саморегуляцией', limitations: 'Корреляционные данные не доказывают причинность' }] };
  const article = { title: 'Почему мы откладываем сложные задачи на работе', description: 'Разбираем, почему возникает откладывание трудных задач и что можно попробовать без давления на себя.', h1: 'Почему я откладываю сложные задачи на работе', slug: brief.slug, author: brief.author,
    markdown: 'Сложная задача может вызывать напряжение задолго до начала работы. Откладывание иногда даёт краткое облегчение, но не решает исходную проблему.\n\n## Что происходит перед откладыванием\n\nПопробуйте заметить, какие мысли, чувства и обстоятельства возникают непосредственно перед тем, как переключиться на другое дело. Это наблюдение, а не диагноз.\n\n## Небольшой эксперимент\n\nВыберите один измеримый шаг, который займёт несколько минут. После попытки запишите, что помогло начать и что мешало. Не требуется заставлять себя работать через истощение.\n\n## Когда полезно обратиться за помощью\n\nЕсли трудности продолжаются и заметно влияют на жизнь, имеет смысл обсудить их на [консультации](/booking?acquaintance). О процессе работы можно прочитать [здесь](/online-therapy).\n\n## Источник\n\nSteel P. (2007). [The nature of procrastination](https://doi.org/10.1037/0033-2909.133.1.65). Обзор и метаанализ: ассоциации не означают причинность.\n\nАвтор: Андрей Калмыков, психолог.', sourceIds: ['10.1037/0033-2909.133.1.65'] };
  if (!dry) { save(titlePath(id, 'brief'), brief); save(titlePath(id, 'research'), evidence); const state = storeDraft(id, article, 'demo-synthetic');
    save(titlePath(id, 'review'), { mode: 'simulation', draftHash: state.hash, status: 'blocked-external-review', checks: { A: { passed: false }, B: { passed: false }, C: { passed: false }, D: { passed: false } } }); }
  output({ id, status: 'demo-unpublished-blocked', dryRun: dry, contentValidation: validateDraft(article, evidence.sources.map(s => s.doi)), sourceVerification: 'pending Crossref', scientificReview: 'pending Codex', seoReview: 'pending Codex', aiSlopReview: 'pending Codex', screenshotReview: 'pending Playwright+Codex', published: false, path: topicDirectory(id) });
}
try {
  const id = String(flags.id ?? '');
  switch (command) {
    case 'collect': await collect(); break;
    case 'plan': plan(); break;
    case 'topic': createTopic(); break;
    case 'research': if (!id) throw new Error('--id required'); await research(id); break;
    case 'draft': if (!id) throw new Error('--id required'); await draft(id); break;
    case 'review': if (!id) throw new Error('--id required'); await review(id); break;
    case 'cycle': if (!id) throw new Error('--id required'); await cycle(id); break;
    case 'status': if (!id) throw new Error('--id required'); status(id); break;
    case 'monitor': if (!id) throw new Error('--id required'); monitor(id); break;
    case 'demo': demo(); break;
    case 'help': output({ commands: ['collect', 'plan', 'topic --query=... --slug=...', 'research --id=...', 'draft --id=...', 'review --id=...', 'cycle --id=...', 'status --id=...', 'monitor --id=...', 'demo'], options: ['--dry-run', '--dir=storage/seo-pipeline'] }); break;
    default: throw new Error(`Unknown command: ${command}`);
  }
} catch (e) { console.error(JSON.stringify({ status: 'error', message: String(e) })); process.exitCode = 1; }
