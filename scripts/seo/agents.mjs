import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

const STRING = { type: 'string' };
const STRINGS = { type: 'array', items: STRING };
const schema = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const RESEARCH_SCHEMA = schema({
  intent: STRING, competitorAnalysis: STRING,
  sources: { type: 'array', items: schema({ doi: STRING, claim: STRING, limitations: STRING, kind: STRING }) }
});
export const DRAFT_SCHEMA = schema({
  title: STRING, description: STRING, h1: STRING, slug: STRING, author: STRING,
  markdown: STRING, sourceIds: STRINGS
});
export const REVIEW_SCHEMA = schema({ passed: { type: 'boolean' }, score: { type: 'integer' }, findings: STRINGS });

export function runCodex(prompt, outputSchema, scratch, images = []) {
  mkdirSync(scratch, { recursive: true });
  const schemaFile = join(scratch, 'response-schema.json');
  writeFileSync(schemaFile, JSON.stringify(outputSchema, null, 2));
  const args = ['exec', '--skip-git-repo-check', '--sandbox', 'read-only', '--output-schema', schemaFile];
  if (images.length) args.push('--image', images.join(','));
  args.push('-');
  const output = execFileSync('codex', args, {
    input: prompt, encoding: 'utf8', cwd: mkdtempSync(join(tmpdir(), 'seo-codex-isolated-')), maxBuffer: 8 * 1024 * 1024,
    timeout: 5 * 60 * 1000, stdio: ['pipe', 'pipe', 'pipe']
  });
  return JSON.parse(output);
}

export function researchPrompt(topic, competitors) {
  return `Ты независимый научный исследователь. Тема: ${JSON.stringify(topic)}. Выдача: ${JSON.stringify(competitors)}.
Найди систематические обзоры, метаанализы, рекомендации и оригинальные исследования по теме. Для каждого — ТОЛЬКО реальный DOI (не придумывай). Свяжи с осторожным, конкретным утверждением и ограничением дизайна. Если нет доступа к проверяемым данным, верни sources: []. Конкурентов оцени только по переданным данным. Никаких выдуманных цитат и статистики. Ответь JSON по схеме.`;
}
export function draftPrompt(topic, research, correction = '') {
  return `Ты научный редактор-психолог. Напиши НОВЫЙ качественный русский текст с нуля для kalmykov-psy.ru. НИКОГДА не используй ранее опубликованные статьи как основу.
Бриф: ${JSON.stringify(topic)}. Исследование: ${JSON.stringify(research)}.
Требования: ответ в первых 2 абзацах; конкретные примеры без вымышленных клиентских кейсов или личного опыта; ACT/КПТ только уместно; научные источники с валидными ссылками DOI, ограничения; 1-2 внутренние ссылки на гарантированно существующие /questionnaires или /online-therapy и CTA на /booking?acquaintance, спокойный тон; не обещай результаты; автор «Андрей Калмыков, психолог»; SEO title и meta description; H1 отдельно, не дублируй H1 в markdown, подзаголовки ##. sourceIds — использованные DOI из исследования. slug латиницей без совпадения с существующими URL. Не используй эмодзи, штампы, кричащие заголовки. ${correction}
Строгий JSON по схеме.`;
}
export function reviewPrompt(letter, draft, research, topic) {
  const contexts = {
    A: 'Научная корректность и психологическая безопасность. Проверяй каждое существенное утверждение против источника, дизайн исследования и ограничения; не засчитывай голый DOI как подтверждение содержания. Диагнозы, риск, обещания — критично.',
    B: 'SEO, полнота ответа, поисковый интент, противоречия, каннибализация, структура H1/H2, title, description, ссылки и естественная конверсия. Не выдумывай спрос.',
    C: 'AI-slop score 1=очень естественно, 10=ярко выраженный шаблонный ИИ. Оцени штампы, искусственную симметрию, канцелярит, повторы, бессодержательные фразы. passed=true только score<=3.',
    D: 'UX ревью двух скриншотов: mobile и desktop, читабельность, переполнения, типографика, CTA, отсутствие визуальных ошибок. Только по изображениям, не по предположениям.'
  };
  return `Ты независимый ревьюер ${letter}; твоя роль отличается от автора. ${contexts[letter]}
Черновик: ${JSON.stringify(draft)}. Досье: ${JSON.stringify(research)}. Бриф: ${JSON.stringify(topic)}.
Ответь JSON {passed:boolean,score:integer,findings:string[]}. Не снижай требования. При нехватке доказательств или скриншотов passed=false. Для A/B/D score=0.`;
}

export async function screenshots(draft, targetDir) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { return { status: 'missing-playwright', files: [] }; }
  let marked;
  try { ({ marked } = await import('marked')); }
  catch { return { status: 'missing-markdown-renderer', files: [] }; }
  mkdirSync(targetDir, { recursive: true });
  const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(draft.title)}</title><style>
  body{margin:0;background:#fcfaf6;color:#233445;font:17px/1.75 system-ui,sans-serif}header{border-bottom:1px solid #ddd8cf;padding:18px 4%;font-weight:600;color:#304456}main{max-width:820px;margin:56px auto;padding:0 24px 70px}h1{font-size:clamp(34px,5vw,54px);line-height:1.16}h2{font-size:clamp(25px,3vw,32px);line-height:1.24;margin-top:42px}p{margin:18px 0}a{color:#846f40}img,table{max-width:100%;height:auto}table{display:block;overflow-x:auto}blockquote{border-left:3px solid #a88f66;padding-left:18px;color:#5a6068}.byline{color:#6f767b;font-size:14px}article{overflow-wrap:anywhere}</style></head><body><header>Андрей Калмыков · Психолог</header><main><h1>${escapeHtml(draft.h1)}</h1><p class="byline">${escapeHtml(draft.author)} · Черновик, не опубликовано</p><article>${marked.parse(draft.markdown)}</article></main></body></html>`;
  const browser = await chromium.launch({ headless: true });
  const files = [];
  try {
    for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      const path = join(targetDir, `${viewport.name}.png`);
      await page.screenshot({ path, fullPage: true });
      files.push(path);
      await page.close();
    }
  } finally { await browser.close(); }
  return { status: 'ok', previewOnly: true, files };
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
