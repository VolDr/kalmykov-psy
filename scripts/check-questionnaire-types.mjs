import { readFileSync } from 'node:fs';

const log = readFileSync('svelte-check.log', 'utf8').replace(/\x1B\[[0-9;]*m/g, '');
const lines = log.split(/\r?\n/);
const scoped = [
  /^src\/routes\/questionnaires\//,
  /^src\/routes\/surveys\//,
  /^src\/routes\/\+page\.svelte$/,
  /^src\/routes\/online-therapy\/\+page\.svelte$/,
  /^src\/routes\/\+layout\.server\.js$/,
  /^src\/routes\/sitemap\.xml\/\+server\.ts$/,
  /^src\/lib\/data\/questionnaireMethodology\.ts$/,
  /^src\/lib\/components\/questionnaire\/Assessment(?:Page|Methodology)\.svelte$/,
  /^src\/lib\/components\/layout\/MainGridNew\.svelte$/,
  /^src\/lib\/utils\/questionnaire\/assessmentState\.ts$/
];
let failures = [];
let total = 0;
for (let i=0; i<lines.length; i++) {
  if (!/\bError:/.test(lines[i])) continue;
  total++;
  const before = lines.slice(Math.max(0, i-3), i).join(' ');
  const match = before.match(/(?:^|\/)src\/([^:\s]+):(\d+):(\d+)/);
  const file = match ? 'src/' + match[1] : '';
  if (scoped.some((re) => re.test(file))) {
    failures.push(`${file}: ${lines[i].trim()}`);
  }
}
console.log(`Svelte check: ${total} errors repository-wide; ${failures.length} within SEO PR scope.`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
