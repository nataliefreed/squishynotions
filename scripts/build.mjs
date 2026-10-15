// Assembles the deployable site in dist/: the pages, assets/, the tools gallery, every tool,
// and tools/tools.json. Plain tools are copied as they are. A tool whose own package.json has
// a "build" script is installed and built first, and its output folder is what gets published.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, collectTools, toManifest } from './lib.mjs';

const dist = join(root, 'dist');
const ignored = new Set(['node_modules', '.git', '.DS_Store']);
const copyFilter = (src) => !ignored.has(basename(src));

function die(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function npm(args, cwd) {
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) die(`"npm ${args.join(' ')}" failed in ${cwd}`);
}

const { tools, problems } = await collectTools();
if (problems.length) {
  die(`Can't build yet. Fix these first:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'tools'), { recursive: true });

for (const tool of tools) {
  const src = join(root, 'tools', tool.slug);
  const dest = join(dist, 'tools', tool.slug);
  const pkgFile = join(src, 'package.json');
  const hasBuild =
    existsSync(pkgFile) && Boolean(JSON.parse(await readFile(pkgFile, 'utf8')).scripts?.build);

  if (hasBuild) {
    console.log(`Building ${tool.slug}`);
    npm([existsSync(join(src, 'package-lock.json')) ? 'ci' : 'install'], src);
    npm(['run', 'build'], src);

    const out = join(src, tool.outputDir);
    if (!existsSync(out)) {
      die(`tools/${tool.slug}: the build finished but there's no "${tool.outputDir}/" folder. Set "outputDir" in its tool.json.`);
    }
    await cp(out, dest, { recursive: true });

    // The thumbnail lives in the source folder; make sure it reaches the site too.
    if (tool.thumbnailFile && !existsSync(join(dest, tool.thumbnailFile))) {
      await mkdir(dirname(join(dest, tool.thumbnailFile)), { recursive: true });
      await cp(join(src, tool.thumbnailFile), join(dest, tool.thumbnailFile));
    }
  } else {
    await cp(src, dest, { recursive: true, filter: copyFilter });
  }

  if (!existsSync(join(dest, 'index.html'))) die(`tools/${tool.slug}: there's no index.html in what would be published.`);
}

// The gallery page and its list of tools.
if (!existsSync(join(root, 'tools', 'index.html'))) die('tools/index.html (the gallery) is missing.');
await cp(join(root, 'tools', 'index.html'), join(dist, 'tools', 'index.html'));
await writeFile(join(dist, 'tools', 'tools.json'), JSON.stringify(toManifest(tools), null, 2));

// The rest of the site: index.html, every top-level folder that has an index.html (try-me/,
// goodies/, ...), assets/, and the few single files a site might have. Everything else in the
// repo (scripts/, docs, config, node_modules/) stays out.
const singleFiles = new Set(['index.html', '404.html', 'robots.txt', 'favicon.ico', 'CNAME']);
const skipFolders = new Set(['tools', 'scripts', 'dist', 'node_modules']);
const pages = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  const { name } = entry;
  if (name.startsWith('.')) continue;
  const publish = entry.isDirectory()
    ? !skipFolders.has(name) && (name === 'assets' || existsSync(join(root, name, 'index.html')))
    : singleFiles.has(name);
  if (!publish) continue;
  await cp(join(root, name), join(dist, name), { recursive: true, filter: copyFilter });
  if (entry.isDirectory() && name !== 'assets') pages.push(name);
}
if (!existsSync(join(dist, 'index.html'))) die('index.html (the home page) is missing.');

console.log(`Built the site into dist/: ${pages.length + 1} pages and ${tools.length} tool${tools.length === 1 ? '' : 's'}`);
