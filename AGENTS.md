# Conventions for this repo

A collection of small, self-contained creative tools, published as static files on GitHub Pages. Follow these rules whenever you add or change anything here.

## Layout

- `tools/<slug>/` is one folder per tool. The slug is lowercase-kebab-case and becomes the URL.
- `index.html` at the repo root is the gallery. It reads `tools.json`, which is generated from every tool's `tool.json`. Never create `tools.json` by hand.
- `scripts/` holds the build script, the dev server, and the new-tool generator.
- `tools/_template/` is the starting point for new tools. Folders that start with `_` are not published.

## Rules for every tool

1. The entry point is `tools/<slug>/index.html`. It opens by double-clicking the file and also works when served from a subpath like `/repo/tools/<slug>/`.
2. Use relative paths only. Never `/app.js` or `https://username.github.io/...`.
3. No server, and no required build step. Plain HTML, CSS and JS by default, inline or in files inside the tool's own folder.
4. Libraries are vendored into the tool's folder, or loaded from a CDN with an exact pinned version. Never "latest".
5. Every tool has a `tool.json`:
   - `title` (required): matches the page's `<title>`.
   - `description` (required): one line, plain words, says what you can do with it.
   - `tags` (optional): short lowercase words like `drawing` or `zine`. Reuse existing tags before inventing new ones.
   - `emoji` (optional): shown on the card when there is no thumbnail.
   - `thumbnail` (optional): an image file inside the tool's folder, roughly 3:2.
   - `added` (optional): `YYYY-MM-DD`, used for sorting newest first.
6. Every tool on the site shares one origin, so browser storage is shared too. Prefix every `localStorage`, `sessionStorage` and IndexedDB key with `<slug>:` and wrap storage calls in try/catch. The template has a small `store` helper that does both.
7. No service workers.
8. Include the viewport meta tag, work at phone width, and use pointer events (not mouse events) so touch and pen work.
9. Keep tools independent. Don't import from or reach into another tool's folder. A little duplication is better than coupling. Don't add a `shared/` folder unless asked.
10. Everything published is public. Never put API keys, tokens or personal data in a tool.

## Tools that need a build step (rare)

Give the tool its own `package.json` inside its folder with a `build` script. `npm run build` at the root installs and builds it, then publishes its output folder (`dist/` by default, or whatever `outputDir` says in its `tool.json`). Configure the bundler for relative URLs (for Vite, `base: './'`). Don't add dependencies to the root `package.json`.

## Working here

- New tool: `npm run new -- my-tool "My Tool"`, then edit its `tool.json` and `index.html`.
- Run locally: `npm start`, then open http://localhost:8000. The gallery list refreshes on each page load.
- Before pushing: `npm run build`. It fails with a list of problems if any `tool.json` is wrong. `npm run preview` serves the built site, which is exactly what GitHub Pages will serve.
- When working on one tool, only change that tool's folder.
- Generated and not committed: `dist/`, `node_modules/`.
- If you add a field to `tool.json`, update `scripts/lib.mjs` and the gallery in `index.html` together.
