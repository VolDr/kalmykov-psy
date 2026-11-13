import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { intent, cluster, priority, aggregateSearch, validateDraft, canRelease, hashContent } from './core.mjs';
import { dateWindow } from './connectors.mjs';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
test('intent distinguishes consultation, problem, information, and unrelated', () => {
  assert.equal(intent('психолог по выгоранию онлайн'), 'consultation');
  assert.equal(intent('как перестать прокрастинировать'), 'problem');
  assert.equal(intent('признаки выгорания'), 'information');
  assert.equal(intent('купить холодильник'), 'outside');
  assert.equal(cluster('сильный перфекционизм в работе'), 'perfectionism');
});
test('positions 8-20 and conversion intent get a boost', () => {
  assert.ok(priority({query:'как справиться с тревогой',position:12,impressions:100}) > priority({query:'как справиться с тревогой',position:37,impressions:100}));
  assert.ok(priority({query:'консультация психолога при выгорании',position:12,impressions:100}) > priority({query:'признаки выгорания',position:12,impressions:100}));
  assert.equal(priority({query:'купить холодильник',position:10,impressions:5000}),0);
});
test('provider and window are independent; CTR uses actual clicks', () => {
  const rows=aggregateSearch([{provider:'google',query:'почему тревога',page:'/',windowDays:28,impressions:100,clicks:4,position:11},{provider:'yandex',query:'почему тревога',page:null,windowDays:28,impressions:60,clicks:2,position:8}]);
  assert.equal(rows.length,2); assert.equal(rows.find(x=>x.provider==='google').ctr,.04);
});
test('28/90-day windows are inclusive and finalized', () => {
  assert.deepEqual(dateWindow(28,new Date('2026-11-13T11:00:00Z')),{from:'2026-10-14',to:'2026-11-10'});
  assert.deepEqual(dateWindow(90,new Date('2026-11-13T11:00:00Z')),{from:'2026-08-13',to:'2026-11-10'});
});
test('release requires independent reviews, slop <=3, two screenshots, matching hash', () => {
  const draft={markdown:'example'},h=hashContent(draft);
  const review={mode:'independent',draftHash:h,checks:{A:{passed:true},B:{passed:true},C:{passed:true,score:3},D:{passed:true,screenshots:['mobile.png','desktop.png']}}};
  assert.equal(canRelease(review,draft,h),true);
  assert.equal(canRelease({...review,mode:'simulation'},draft,h),false);
  assert.equal(canRelease(review,draft,'wrong'),false);
  assert.equal(canRelease({...review,checks:{...review.checks,C:{passed:true,score:4}}},draft,h),false);
});
test('offline demo is idempotent and never treated as publication', () => {
  const dir=mkdtempSync(join(tmpdir(),'seo-demo-'));
  const go=(name,...args)=>JSON.parse(execFileSync(process.execPath,[cli,name,`--dir=${dir}`,...args],{encoding:'utf8'}));
  const first=go('demo'),second=go('demo');
  assert.equal(first.id,second.id);
  assert.equal(first.published,false);
  assert.deepEqual(first.contentValidation,[]);
  assert.equal(readFileSync(join(dir,'topics',first.id,'review.json'),'utf8').includes('"mode": "simulation"'),true);
  assert.equal(existsSync(join(dir,'articles')),false);
  assert.equal(go('status',`--id=${first.id}`).eligibleForHumanApproval,false);
});
test('dry-run never writes a draft', () => {
  const dir=mkdtempSync(join(tmpdir(),'seo-dry-'));
  const out=JSON.parse(execFileSync(process.execPath,[cli,'demo',`--dir=${dir}`,'--dry-run'],{encoding:'utf8'}));
  assert.equal(out.dryRun,true);assert.equal(out.published,false);
  assert.equal(existsSync(join(dir,'topics')),false);
});
