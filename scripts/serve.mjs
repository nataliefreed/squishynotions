// A tiny preview server with no dependencies: node scripts/serve.mjs
//
// Serves this folder at http://localhost:8000/. The tool links on the site point at
// /creative-tools/..., which on the live site is the creative tools repo. To make those links
// work here too, this also serves the built creative tools site under /creative-tools/ when it
// finds one: ../creative-tools/dist (run `npm run build` in that repo first), or the folder named
// in the TOOLS_DIR environment variable.
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = resolve(process.env.TOOLS_DIR || join(root, '..', 'creative-tools', 'dist'));
const hasTools = existsSync(join(toolsDir, 'index.html'));
const port = Number(process.env.PORT) || 8000;
const host = process.env.HOST || '127.0.0.1';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
};

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    let base = root;
    let rel = pathname;
    if (pathname === '/creative-tools' || pathname.startsWith('/creative-tools/')) {
      if (!hasTools) {
        return send(res, 404, types['.txt'],
          'The creative tools site is not available here. Build it (npm run build in the creative-tools repo) and put it next to this repo, or set TOOLS_DIR.');
      }
      base = toolsDir;
      rel = pathname.slice('/creative-tools'.length) || '/';
    }

    let file = normalize(join(base, rel));
    if (file !== base && !file.startsWith(base + sep)) return send(res, 403, types['.txt'], 'Forbidden');

    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: `${pathname}/${url.search}` });
        return res.end();
      }
      file = join(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    if (!info) return send(res, 404, types['.txt'], `Not found: ${pathname}`);
    send(res, 200, types[extname(file).toLowerCase()] ?? 'application/octet-stream', await readFile(file));
  } catch (err) {
    send(res, 500, types['.txt'], String(err));
  }
}).listen(port, host, () => {
  console.log(`Site running at http://${host}:${port}/`);
  console.log(hasTools ? `Tools served from ${toolsDir} at /creative-tools/` : 'Tool links (/creative-tools/...) will 404 until the creative tools site is built next to this repo.');
});
