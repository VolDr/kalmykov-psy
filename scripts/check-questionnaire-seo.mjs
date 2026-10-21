import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const ids = ['phq9', 'gad7', 'cpq', 'psi', 'ips', 'gps9', 'impostor', 'ipss3', 'bat4', 'bat12', 'bat23'];
const layout = read('src/routes/+layout.svelte');
const content = read('src/lib/data/questionnaireMethodology.ts');
const catalogue = read('src/lib/data/content.ts');
const index = read('src/routes/questionnaires/+page.svelte');
const sitemap = read('src/routes/sitemap.xml/+server.ts');

assert.match(layout, /rel="canonical"/, 'Layout should provide canonical URL');
assert.doesNotMatch(index, /rel="canonical"/, 'Index must not duplicate canonical');
assert.doesNotMatch(index, /name="keywords"/, 'Legacy meta keywords should not return');
assert.match(index, /Психологические опросники/, 'Catalogue must identify its topic');
assert.match(sitemap, /questionnaires/, 'Sitemap must list questionnaires');

for (const id of ids) {
  const page = read(`src/routes/questionnaires/${id}/+page.svelte`);
  assert.match(page, new RegExp(`methodologyKey="${id}"`), `Missing methodology: ${id}`);
  assert.match(page, /<AssessmentWizard\b/, `Missing interactive form: ${id}`);
  assert.match(page, /<AssessmentResult\b/, `Missing result component: ${id}`);
  assert.doesNotMatch(page, /rel="canonical"/, `Duplicate canonical: ${id}`);
  assert.doesNotMatch(page, /kalmykov\.pro/, `Legacy domain: ${id}`);
  assert.match(content, new RegExp(`\\b${id}: \\{`), `Missing content record: ${id}`);
  assert.ok(catalogue.includes(`/questionnaires/${id}`), `Missing catalogue link: ${id}`);
  assert.ok(sitemap.includes(`'${id}'`), `Missing sitemap entry: ${id}`);
}

const sourceLinks = content.match(/href: 'https:\/\//g) ?? [];
assert.ok(sourceLinks.length >= ids.length, 'Expected a science source per questionnaire');
assert.match(read('src/routes/surveys/+server.ts'), /redirect\(301, '\/questionnaires'\)/);
assert.match(read('src/routes/surveys/[...slug]/+server.ts'), /redirect\(301, `\/questionnaires\/\$\{slug\}`\)/);

console.log(`SEO source checks passed: ${ids.length} questionnaires, ${sourceLinks.length} cited sources`);
