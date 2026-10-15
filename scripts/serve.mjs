// A tiny dev server with no dependencies.
//   node scripts/serve.mjs          serves the repo; the gallery's list is rebuilt on every request
//   node scripts/serve.mjs --dist   serves dist/, which is what GitHub Pages will serve
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { root, collectTools, toManifest } from './lib.mjs';

const useDist = process.argv.includes('--dist');
const siteRoot = useDist ? join(root, 'dist') : root;
const port = Number(process.env.PORT) || 8000;
const host = process.env.HOST || '127.0.0.1'; // HOST=0.0.0.0 to try a tool on your phone over wifi

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

if (!existsSync(siteRoot)) {
  console.error('There is no dist/ folder yet. Run "npm run build" first (or just use "npm run preview").');
  process.exit(1);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if (!useDist && pathname === '/tools.json') {
      const { tools, problems } = await collectTools();
      return send(res, 200, types['.json'], JSON.stringify({ ...toManifest(tools), problems }));
    }

    let file = normalize(join(siteRoot, pathname));
    if (file !== siteRoot && !file.startsWith(siteRoot + sep)) return send(res, 403, types['.txt'], 'Forbidden');

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
  console.log(`${useDist ? 'Built site' : 'Gallery'} running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
});
