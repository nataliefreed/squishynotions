# Squishy Notions

The website at squishynotions.com and the small creative tools that live on it, all in one repo, published together on GitHub Pages. No WordPress, no framework, and no build step for the pages.

```
index.html                  About (the home page)
try-me/                     Make Something!  (the tools and tutorials)
goodies/
wander-the-garden/
check-this-out/
assets/
  css/style.css             the whole site stylesheet; the variables at the top are the knobs
  js/menu.js                opens and closes the menu on phones, nothing else
  fonts/                    the two fonts (see the README in there)
tools/
  index.html                the gallery of tools (search, tag filters, random tool), at /tools/
  spirogator/               one folder per tool, each with its own history
  _template/                copied by `npm run new`
scripts/                    dev server, site build, link checker, new-tool and import scripts
AGENTS.md                   the conventions for working in this repo (CLAUDE.md points to it)
```

Each page is its own folder with an `index.html`, so the addresses stay the same as on WordPress (`/try-me/`, `/goodies/`, ...). The tools are at `/tools/<name>/`, for example `/tools/spirogator/`.

## Run it locally

You need Node 20 or newer. There is nothing to install.

```sh
npm start
```

Open http://localhost:8000. Edit anything and refresh. The gallery has to be served rather than opened as a file, because it loads its list with `fetch`. The pages and the individual tools still open by double-clicking their `index.html`.

Before pushing, run:

```sh
npm run check
```

It checks every link to a page, image or tool on the site, that every page has the same menu, a title and one `<h1>`, and that every tool's `tool.json` is valid. It doesn't check links to other sites.

## Change something

- **Words:** edit the page's `index.html`.
- **Look:** edit `assets/css/style.css`. Colors, fonts, spacing and the width of the text column are variables at the top. The gallery at `/tools/` has its own look (a cutting mat), set in a `<style>` block at the top of `tools/index.html`.
- **A new page:** copy a folder (say `goodies/`), edit it, and add it to the menu **on every page**. The menu is repeated in each file, because there is no build step to fill it in. `npm run check` tells you if a page is missing from a menu.

## Add a tool

```sh
npm run new -- paper-planes "Paper Planes"
```

This creates `tools/paper-planes/` from the template. Then:

1. Write a real description and tags in `tool.json`.
2. Build the tool in `index.html`.
3. Optional: add a `thumbnail` (an image in the tool's folder, roughly 3:2).

Any folder in `tools/` with an `index.html` and a `tool.json` shows up in the gallery. A tool with a missing or broken `tool.json` shows a warning in the gallery locally and stops the build. To put a tool on a page of the site, link to it with a relative link, like `../tools/paper-planes/` from `try-me/`.

## Bring in an older tool

The import script keeps the tool's full git history. Every commit is rewritten so its files live under `tools/old-tool/`, which means `git log` and `git blame` follow the tool's folder and still credit whoever wrote each line. Authors, dates and messages don't change, and the original repo is never touched. The script checks that nothing was lost before it changes this repo. It needs bash, git and perl, and a clean working tree.

```sh
npm run import -- https://github.com/YOU/old-tool old-tool
```

After the repo URL comes the slug, which becomes the folder name under `tools/`. You can add the branch to import (the repo's default branch if you leave it out), and then a folder name if you only want one folder of a bigger repo:

```sh
npm run import -- https://github.com/YOU/projects color-picker main color_picker_from_image
```

If you don't need the history, copying the files in works too:

```sh
cp -r ~/old-tool tools/old-tool
```

Then add a `tool.json`, and check for absolute paths, which break when the site lives under a folder like `/squishynotions/` (it does until the custom domain is set up):

```sh
grep -rnE '(src|href)="/' tools/old-tool
```

Change `/js/app.js` to `js/app.js` (or `./js/app.js`). Also look for storage keys like `"project"` and add a prefix (`old-tool:project`), since every tool shares one browser origin.

## Publish it

1. **Make the repo.** On GitHub, create a repo called `squishynotions`, and push this folder to it on the `main` branch. Pages on a free account needs the repo to be public.
2. **Turn on Pages.** Settings, Pages, set Source to **GitHub Actions**. Do this before the first run, or the deploy step fails. Then push, or re-run the workflow from the Actions tab. After a minute the site is at https://YOUR-NAME.github.io/squishynotions/. Nothing about squishynotions.com changes yet. Every link on the site is relative, so it works there as well as on the real domain.
3. **Decide about the blog posts** before touching the domain (next section).
4. **Point the domain at GitHub.** In Settings, Pages, enter `www.squishynotions.com` as the custom domain, and tick "Enforce HTTPS" when it lets you. There is no `CNAME` file to add: with a GitHub Actions deploy the domain is a setting. Then, where the domain's DNS is managed:
   - `www`: a CNAME record pointing to `YOUR-NAME.github.io`
   - the bare `squishynotions.com`: four A records, `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

   DNS changes can take anywhere from minutes to a day.

Each push to `main` rebuilds and redeploys. Pull requests run the checks and the build, but don't deploy. `npm run preview` builds into `dist/` and serves it locally, so you can see exactly what will be published.

Your older tool repos (spiroweb, stab-bindings-designer, ...) and their GitHub Pages addresses keep working as they are. They are not needed for this site anymore.

### The blog posts

The Make Something! and Goodies pages link to 14 blog posts (tutorials, zines, recipes) at addresses like `https://www.squishynotions.com/2018/02/20/design-with-code-paste-paper/`. They are still in WordPress, so they are still absolute links to `www.squishynotions.com`. When the domain moves to GitHub, those links break unless the posts have somewhere to go. Options:

- Move the posts into this repo as pages (the links then become ordinary relative links), keeping each one's address if you want old links to keep working.
- Keep WordPress alive on another address (for example `blog.squishynotions.com`) and change the 14 links.
- Leave the domain where it is for now and use the `github.io` address until the posts are sorted out.

## A tool that needs a bundler

Rare, but supported. Give that tool its own `package.json` with a `build` script. The deploy builds it and publishes its `dist/` folder. See AGENTS.md for the details.

## Where this came from

Two repos were merged into this one, with all of their history: the creative tools repo (five tools brought in from their own repos with every commit and author intact) and the website repo. The website repo's first commit is an exact static copy of the five WordPress pages with the WordPress theme's own CSS. The commit after it is the move to hand-written HTML and one stylesheet, checked side by side against that copy in a browser at widths from 320px to 1920px. They match apart from these differences:

- The "Designed with WordPress" credit is gone, because it isn't true anymore.
- Tool links open the tools on this site instead of the old GitHub Pages addresses.
- An empty bullet at the bottom of "Lessons & Activities" on Goodies is gone.
- Between 600px and about 640px wide (small tablets), the WordPress header ran off the right edge of the screen in testing; the menu items sit closer together there.
- "Make your favorite hypotrochoid" is one link instead of two touching ones.

The site stylesheet was written by hand to match the look of the WordPress "Pixl" theme by Automattic (GPL v2 or later), whose sizes, spacing and colors it follows.
