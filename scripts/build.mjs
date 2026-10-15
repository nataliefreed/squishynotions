// Assembles the deployable site in dist/: the gallery, every tool, and tools.json.
// Plain tools are copied as they are. A tool whose own package.json has a "build"
// script is installed and built first, and its output folder is what gets published.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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

await cp(join(root, 'index.html'), join(dist, 'index.html'));
if (existsSync(join(root, 'shared'))) {
  await cp(join(root, 'shared'), join(dist, 'shared'), { recursive: true, filter: copyFilter });
}
await writeFile(join(dist, 'tools.json'), JSON.stringify(toManifest(tools), null, 2));

console.log(`Built ${tools.length} tool${tools.length === 1 ? '' : 's'} into dist/`);
