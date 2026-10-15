# Conventions for this repo

The Squishy Notions website (hand-written HTML pages and one stylesheet) and a collection of small, self-contained creative tools, published together as static files on GitHub Pages. Follow these rules whenever you add or change anything here.

## Layout

- The site's pages are `<name>/index.html` (the home page is `index.html` at the root). The folder name is the URL, and the URLs match the old WordPress site, so don't rename them.
- `assets/` is the site's: `css/style.css` is the only stylesheet, `js/menu.js` is the only script (it only runs the phone menu), `fonts/` holds the two font files the stylesheet expects.
- `tools/<slug>/` is one folder per tool. The slug is lowercase-kebab-case and becomes the URL (`/tools/<slug>/`).
- `tools/index.html` is the gallery (served at `/tools/`). It reads `tools/tools.json`, which is generated from every tool's `tool.json`. Never create `tools.json` by hand.
- `tools/_template/` is the starting point for new tools. Folders that start with `_` are not published.
- `scripts/` holds the dev server, the site build, the link checker, the new-tool generator and the import script.

## Rules for the site pages

1. Plain HTML and CSS. No framework, no bundler, no dependencies. If something seems to need one, say so instead of adding it.
2. The header and menu are repeated in every page, so a change to either must be made in all of them. `npm run check` fails if the menus differ.
3. Links within the site are relative (`../goodies/`, `../tools/spirogator/`), so everything works from any folder, including `/squishynotions/` before the custom domain is set. Asset paths too (`../assets/css/style.css`). Never `/something` or `https://...github.io/...`.
4. Style changes go in `assets/css/style.css`, using the variables at the top (`--gap`, `--measure`, `--font-body`, ...). No inline `style` attributes, no `<style>` blocks, no per-page CSS files.
5. Keep the markup semantic and plain: one `<h1>` per page (the page title), `<h2>` for sections, real lists for lists. The site title in the header is not a heading.
6. The custom domain is set in Settings, Pages, not by a `CNAME` file (the deploy is a GitHub Actions workflow).
7. Still on the old WordPress site, and linked to with absolute `https://www.squishynotions.com/...` addresses: the blog posts. Leave those links alone until the posts have a new home.

## Rules for every tool

1. The entry point is `tools/<slug>/index.html`. It opens by double-clicking the file and also works when served from a subpath like `/squishynotions/tools/<slug>/`.
2. Use relative paths only. Never `/app.js` or `https://username.github.io/...`.
3. No server, and no required build step. Plain HTML, CSS and JS by default, inline or in files inside the tool's own folder.
4. Libraries are vendored into the tool's folder, or loaded from a CDN with an exact pinned version. Never "latest". Don't ship files nothing loads (library demos, tests, a local copy of a library the page loads from a CDN).
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
9. Keep tools independent. Don't import from or reach into another tool's folder, or the site's `assets/`. A little duplication is better than coupling. Don't add a `shared/` folder unless asked.
10. Photos and other images are sized for how they are shown: no more than about twice their displayed width, and JPEG for photos. A page that loads a few MB of images on first view is a bug.
11. Everything published is public. Never put API keys, tokens or personal data in a tool.

## Tools that need a build step (rare)

Give the tool its own `package.json` inside its folder with a `build` script. `npm run build` at the root installs and builds it, then publishes its output folder (`dist/` by default, or whatever `outputDir` says in its `tool.json`). Configure the bundler for relative URLs (for Vite, `base: './'`). Don't add dependencies to the root `package.json`.

## Tools imported from other repos

Imported tools keep their original code and git history. When you change one, make small edits and don't reformat, rename or reorganize its files, so `git blame` keeps pointing at the people who wrote them. The rules above are for new tools. Older ones may not meet all of them yet (several load libraries from a CDN, for example), so only bring them up to the rules when asked.

To bring in a tool from another repo, use `npm run import` (see Working here). Don't copy its files in by hand when the history matters.

## Working here

- Run locally: `npm start`, then open http://localhost:8000. The gallery list (`/tools/tools.json`) is rebuilt on every request.
- Before pushing: `npm run check`, then `npm run build`. Check looks at every on-site link, that the menu is the same on every page, that each page has a title and one `<h1>`, and that every `tool.json` is valid. It does not check links to other sites. `npm run preview` builds into `dist/` and serves it, which is exactly what GitHub Pages will serve.
- New page: copy an existing page's folder, change the title, `<h1>` and content, add it to the menu on every page, then `npm run check`.
- New tool: `npm run new -- my-tool "My Tool"`, then edit its `tool.json` and `index.html`.
- Tool from another repo: `npm run import -- <repo-url> <slug> [branch] [folder]`, then add its `tool.json`. It keeps the full history and refuses to run with uncommitted changes.
- When working on one tool, only change that tool's folder.
- Generated and not committed: `dist/`, `node_modules/`.
- If you add a field to `tool.json`, update `scripts/lib.mjs` and the gallery in `tools/index.html` together.
- The history includes an exact static copy of the old WordPress pages (the commit "Static copy of the five WordPress pages, exact"). It's the reference for how the site used to look; don't edit it.
