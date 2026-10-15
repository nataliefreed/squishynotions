# Conventions for this repo

The Squishy Notions website: a handful of hand-written HTML pages and one stylesheet, published as static files on GitHub Pages. Follow these rules whenever you change anything here.

## Layout

- Each page is `<name>/index.html` (the home page is `index.html` at the root). The folder name is the URL, and the URLs match the old WordPress site, so don't rename them.
- `assets/css/style.css` is the only stylesheet. `assets/js/menu.js` is the only script, and it only runs the phone menu.
- `assets/fonts/` holds the two font files the stylesheet expects (DM Mono and "uni 05_53").
- `scripts/serve.mjs` is the preview server, `scripts/check.mjs` is the link and menu checker.

## Rules

1. Plain HTML and CSS. No framework, no bundler, no build step, no dependencies. If something seems to need one, say so instead of adding it.
2. The header and menu are repeated in every page, so a change to either must be made in all of them. `npm run check` fails if the menus differ.
3. Links within the site are relative (`../goodies/`), so pages work from any folder or preview. Asset paths too (`../assets/css/style.css`).
4. The one exception is the tools, which live in the separate creative-tools repo and are linked as `/creative-tools/tools/<slug>/` (root-relative). That works because this repo is the user site `nataliefreed.github.io`, and project sites appear under it. Never link to a tool at `https://nataliefreed.github.io/...`.
5. Style changes go in `style.css`, using the variables at the top (`--gap`, `--measure`, `--font-body`, ...). No inline `style` attributes, no `<style>` blocks, no per-page CSS files.
6. Keep the markup semantic and plain: one `<h1>` per page (the page title), `<h2>` for sections, real lists for lists. The site title in the header is not a heading.
7. Don't add a `CNAME` file until the custom domain is switched over (see the README). GitHub adds it when you set the domain in Settings, Pages. Before that, a `CNAME` would redirect `nataliefreed.github.io` to the old WordPress site.
8. Everything here is public. No keys, tokens or personal data.

## Working here

- Run locally: `npm start`, then open http://localhost:8000. With the creative tools repo built next to this one (`../creative-tools/dist`), the tool links work locally too.
- Before pushing: `npm run check`. It looks at every link to a page, file or image on the site, whether each tool link matches a tool in `../creative-tools`, and whether every page has the same menu, a title and one `<h1>`. It does not check links to other sites.
- New page: copy an existing page's folder, change the title, `<h1>` and content, add it to the menu on every page, then `npm run check`.
- The first commit in the history is an exact static copy of the WordPress pages (with WordPress's own markup and CSS). It's the reference for how the site used to look; don't edit it.
- Still on the old WordPress site, and linked to with absolute `https://www.squishynotions.com/...` addresses: the blog posts. Leave those links alone until the posts have a new home.
