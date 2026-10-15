# Squishy Notions

The website at squishynotions.com, as plain HTML and one stylesheet, ready for GitHub Pages. No WordPress, no build step, nothing to install.

```
index.html                  About (the home page)
try-me/                     Make Something!  (the tools and tutorials)
goodies/
wander-the-garden/
check-this-out/
assets/
  css/style.css             the whole stylesheet; the variables at the top are the knobs
  js/menu.js                opens and closes the menu on phones, nothing else
  fonts/                    the two fonts (see the README in there)
scripts/                    preview server and a link checker
AGENTS.md                   conventions for working in this repo (CLAUDE.md points to it)
```

Each page is its own folder with an `index.html`, so the addresses stay the same as on WordPress (`/try-me/`, `/goodies/`, ...).

## Run it locally

You need Node 20 or newer.

```sh
npm start
```

Open http://localhost:8000. If the creative tools repo is next to this one (`../creative-tools`), build it once with `npm run build` in that repo, and the tool links on the Make Something! page work locally too.

## Change something

- Words: edit the page's `index.html`.
- Look: edit `assets/css/style.css`. Colors, fonts, spacing and the width of the text column are variables at the top.
- A new page: copy a folder (say `goodies/`), edit it, and add it to the menu **on every page**. The menu is repeated in each file, because there is no build step to fill it in for you. `npm run check` tells you if a page is missing from a menu, or if any link on the site is broken.
- A new tool on the site: it goes in the creative tools repo, and gets linked here as `/creative-tools/tools/<name>/`.

## How the tools fit in

The software tools (Spirogator, the stab binding designer, the paper doll designer, the security envelope maker, the color picker) are not on this site's server anymore. They live in the [creative-tools](https://github.com/nataliefreed/creative-tools) repo, with their full history, and this site links to them at `/creative-tools/tools/<name>/`.

That only works because of how GitHub Pages names things: a repo called `nataliefreed.github.io` is your main site, and every other repo's site appears under it as `/<repo-name>/`. Once the main site has a custom domain, the project sites follow it, so `creative-tools` shows up at `squishynotions.com/creative-tools/`.

Motif still needs a server, so the Make Something! page links out to it on Netlify.

## Publish it

1. **Make the repo.** On GitHub, create a repo named exactly `nataliefreed.github.io` and push this folder to it. (If a repo with that name already exists, look at what is in it before pushing anything.)
2. **Turn on Pages.** Settings, Pages, "Deploy from a branch", branch `main`, folder `/ (root)`. After a minute the site is at https://nataliefreed.github.io/. Nothing about squishynotions.com changes yet.
3. **Publish the tools** by pushing the creative-tools repo (its README says how). Then https://nataliefreed.github.io/creative-tools/ works, and so do the tool links on the Make Something! page.
4. **Decide about the blog posts** before touching the domain (next section).
5. **Point the domain at GitHub.** In Settings, Pages, enter `www.squishynotions.com` as the custom domain and tick "Enforce HTTPS" when it lets you. GitHub adds a file called `CNAME` to the repo; leave it there. Then, where the domain's DNS is managed:
   - `www`: a CNAME record pointing to `nataliefreed.github.io`
   - the bare `squishynotions.com`: four A records, `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

   DNS changes can take anywhere from minutes to a day. Don't add the `CNAME` file by hand before this step: it would send visitors from `nataliefreed.github.io` to the WordPress site.

### The blog posts

The Make Something! and Goodies pages link to 14 blog posts (tutorials, zines, recipes) at addresses like `https://www.squishynotions.com/2018/02/20/design-with-code-paste-paper/`. They are still in WordPress, so they are still absolute links to `www.squishynotions.com`. When the domain moves to GitHub, those links break unless the posts have somewhere to go. Options:

- Move the posts into this repo as pages (the links then become ordinary relative links), keeping each one's address if you want old links to keep working.
- Keep WordPress alive on another address (for example `blog.squishynotions.com`) and change the 14 links.
- Leave the domain where it is for now and use `nataliefreed.github.io` until the posts are sorted out.

## Where this came from

The first commit in this repo is an exact static copy of the five WordPress pages, with the WordPress theme's own CSS. The next commit is the move to hand-written HTML and one stylesheet. The new pages were checked against that copy side by side in a browser, at widths from 320px to 1920px, and they match apart from the differences below.

Deliberate differences from the WordPress site:

- The "Designed with WordPress" credit is gone, because it isn't true anymore.
- Tool links open the tools on this site instead of the old GitHub Pages addresses.
- An empty bullet at the bottom of "Lessons & Activities" on Goodies is gone.
- Between 600px and about 640px wide (small tablets), the WordPress header ran off the right edge of the screen in testing; the menu items sit closer together there.
- "Make your favorite hypotrochoid" is one link instead of two touching ones.

The stylesheet was written by hand to match the look of the WordPress "Pixl" theme by Automattic (GPL v2 or later), whose sizes, spacing and colors it follows.
