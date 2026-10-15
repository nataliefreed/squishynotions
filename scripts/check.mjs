// Checks the site for the mistakes that are easy to make when every page is its own HTML file:
//   node scripts/check.mjs      (or: npm run check)
//
//  - every link to a page, file, image or tool on this site goes somewhere that exists
//  - the menu is the same list of pages on every page
//  - every page has a title and exactly one <h1>
//  - every tool has a valid tool.json
// The tools themselves (tools/<name>/) have their own conventions; only their tool.json is checked.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { collectTools, root } from './lib.mjs';

const skip = new Set(['.git', '.github', 'node_modules', 'scripts', 'assets', 'tools', 'dist']);

function pages(dir = root, found = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) pages(path, found);
    else if (name.endsWith('.html')) found.push(path);
  }
  return found;
}

const problems = [];
const nice = (page) => relative(root, page).split(sep).join('/');
const problem = (page, message) => problems.push(`${nice(page)}: ${message}`);
const menus = [];
const pageFiles = pages();
let linkCount = 0;

for (const page of pageFiles) {
  const html = readFileSync(page, 'utf8');
  const sitePath = '/' + relative(root, dirname(page)).split(sep).filter(Boolean).join('/');   // e.g. /try-me
  const here = sitePath === '/' ? '/' : sitePath + '/';

  if (!/<title>[^<]+<\/title>/.test(html)) problem(page, 'no <title>');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) problem(page, `has ${h1s} <h1> headings (should be 1)`);

  const menu = html.match(/<div class="menu"[^>]*>[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
  if (menu) {
    menus.push({ page, items: [...menu[1].matchAll(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, href, text]) => `${text} → ${posix.join(here, href)}`) });
  } else {
    problem(page, 'no menu found');
  }

  for (const [, href] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;       // other sites: not checked
    linkCount++;
    if (href.startsWith('#')) {
      if (href.length > 1 && !html.includes(`id="${href.slice(1)}"`)) problem(page, `${href} points at an id that is not on the page`);
      continue;
    }
    const [path] = href.split(/[?#]/);
    const target = path.startsWith('/') ? join(root, path) : resolve(dirname(page), path);
    const file = path.endsWith('/') || (existsSync(target) && statSync(target).isDirectory()) ? join(target, 'index.html') : target;
    if (!existsSync(file)) problem(page, `${href} does not exist`);
  }
}

const first = menus[0];
for (const m of menus.slice(1)) {
  if (m.items.join('\n') !== first.items.join('\n')) {
    problem(m.page, `menu differs from the one on ${nice(first.page)}\n      this page: ${m.items.join(' | ')}\n      that page: ${first.items.join(' | ')}`);
  }
}

const { tools, problems: toolProblems } = await collectTools();
problems.push(...toolProblems);

if (problems.length) {
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log(`OK: ${pageFiles.length} pages, ${linkCount} on-site links, menus match, ${tools.length} tools with a valid tool.json.`);
