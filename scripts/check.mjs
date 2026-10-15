// Checks the site for the mistakes that are easy to make when every page is its own HTML file:
//   node scripts/check.mjs      (or: npm run check)
//
//  - every link to a page, file or image on this site goes somewhere that exists
//  - links to the tools (/creative-tools/tools/<name>/) match a tool in ../creative-tools, if that repo is next door
//  - the menu is the same list of pages on every page
//  - every page has a title and exactly one <h1>
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsRepo = resolve(root, '..', 'creative-tools');
const skip = new Set(['.git', 'node_modules', 'scripts', 'assets']);

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
const problem = (page, message) => problems.push(`${relative(root, page).split(sep).join('/')}: ${message}`);
const menus = [];
let linkCount = 0;
let toolsChecked = false;

for (const page of pages()) {
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

    if (path.startsWith('/creative-tools/')) {                      // the other repo, served under the same domain
      if (!existsSync(toolsRepo)) continue;
      toolsChecked = true;
      const rest = path.slice('/creative-tools/'.length);
      const wanted = rest.endsWith('/') || rest === '' ? join(toolsRepo, rest, 'index.html') : join(toolsRepo, rest);
      if (!existsSync(wanted)) problem(page, `${href} is not a tool in the creative-tools repo`);
      continue;
    }

    const target = path.startsWith('/') ? join(root, path) : resolve(dirname(page), path);
    const file = path.endsWith('/') || (existsSync(target) && statSync(target).isDirectory()) ? join(target, 'index.html') : target;
    if (!existsSync(file)) problem(page, `${href} does not exist`);
  }
}

const first = menus[0];
for (const m of menus.slice(1)) {
  if (m.items.join('\n') !== first.items.join('\n')) {
    problem(m.page, `menu differs from the one on ${relative(root, first.page).split(sep).join('/')}\n      this page: ${m.items.join(' | ')}\n      that page: ${first.items.join(' | ')}`);
  }
}

if (problems.length) {
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log(`OK: ${pages().length} pages, ${linkCount} on-site links, menus match${toolsChecked ? ', tool links match ../creative-tools' : ' (../creative-tools not found, so tool links were not checked)'}.`);
