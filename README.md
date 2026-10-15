# Creative Tools

Small creative tools, one folder each, published together as a gallery on GitHub Pages. No server, no framework, and no build step unless a tool wants one.

```
index.html          the gallery (search, tag filters, random tool)
tools/
  doodle-pad/       an example tool
  _template/        copied by `npm run new`
scripts/            dev server, site build, new-tool generator
AGENTS.md           the conventions every tool follows (CLAUDE.md points to it)
```

## Run it locally

You need Node 20 or newer. There is nothing to install.

```sh
npm start
```

Open http://localhost:8000. Edit any tool and refresh. The gallery has to be served rather than opened as a file, because it loads its list with `fetch`. Individual tools still open by double-clicking their `index.html`.

## Add a tool

```sh
npm run new -- paper-planes "Paper Planes"
```

This creates `tools/paper-planes/` from the template. Then:

1. Write a real description and tags in `tool.json`.
2. Build the tool in `index.html`.
3. Optional: add a `thumbnail` (an image in the tool's folder, roughly 3:2).

Or skip the generator: any folder in `tools/` with an `index.html` and a `tool.json` shows up in the gallery. A tool with a missing or broken `tool.json` shows a warning in the gallery locally and stops the build.

## Bring in an older tool

To keep its git history (the repo needs at least one commit first):

```sh
git subtree add --prefix=tools/old-tool https://github.com/YOU/old-tool.git main
```

Or just copy the files in:

```sh
cp -r ~/old-tool tools/old-tool
```

Then add a `tool.json`, and check for absolute paths, which break when the site lives under `/repo-name/`:

```sh
grep -rnE '(src|href)="/' tools/old-tool
```

Change `/js/app.js` to `js/app.js` (or `./js/app.js`). Also look for storage keys like `"project"` and add a prefix (`old-tool:project`), since every tool shares one browser origin.

## Publish to GitHub Pages

1. Push this repo to GitHub on the `main` branch. Pages on a free account needs the repo to be public.
2. In the repo, go to Settings, then Pages, and set Source to **GitHub Actions**. Do this before the first run, or the deploy step fails.
3. Push to `main`, or re-run the workflow from the Actions tab. The site appears at `https://YOUR-NAME.github.io/REPO-NAME/`.

Each push to `main` rebuilds and redeploys. Pull requests run the build to catch mistakes, but don't deploy.

`npm run preview` builds into `dist/` and serves it locally, so you can check exactly what will be published.

## A tool that needs a bundler

Rare, but supported. Give that tool its own `package.json` with a `build` script. The deploy builds it and publishes its `dist/` folder. See AGENTS.md for the details.

## Renaming the gallery

The gallery's title and fonts are at the top of `index.html`. It loads two Google Fonts and falls back to system fonts if they don't load, so it's safe to delete the `<link>` tags.
