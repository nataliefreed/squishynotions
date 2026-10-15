// Usage: npm run new -- my-tool-name "My Tool Name"
// Copies tools/_template to tools/my-tool-name and fills in the name and date.
import { cp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SLUG, toolsDir } from './lib.mjs';

const [rawSlug, ...titleWords] = process.argv.slice(2);
const slug = (rawSlug ?? '').toLowerCase();

if (!SLUG.test(slug)) {
  console.error('Usage: npm run new -- my-tool-name "My Tool Name"\nThe folder name can use lowercase letters, numbers and hyphens.');
  process.exit(1);
}

const title =
  titleWords.join(' ').trim() ||
  slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const dest = join(toolsDir, slug);
if (existsSync(dest)) {
  console.error(`tools/${slug} already exists.`);
  process.exit(1);
}

await cp(join(toolsDir, '_template'), dest, { recursive: true });

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeJson = (s) => JSON.stringify(s).slice(1, -1);
const added = new Date().toLocaleDateString('en-CA'); // 2026-10-14

for (const [file, escape] of [['index.html', escapeHtml], ['tool.json', escapeJson]]) {
  const path = join(dest, file);
  const filled = (await readFile(path, 'utf8'))
    .replaceAll('{{slug}}', slug)
    .replaceAll('{{title}}', escape(title))
    .replaceAll('{{added}}', added);
  await writeFile(path, filled);
}

console.log(`Created tools/${slug}/
  1. Write a real description and tags in tools/${slug}/tool.json
  2. Build the tool in tools/${slug}/index.html
  3. Run npm start to see it in the gallery`);
