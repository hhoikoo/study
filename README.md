# Study Blog

Publish study writeups as Markdown and read them on a GitHub Pages site, rendered in GitHub style by the [zero-md](https://github.com/zerodevx/zero-md) web component. Images and code highlighting work. No build step. No PDF export.

It was built for a network study group, then generalized so any study can use it.

## URLs

Three levels, each a clean URL backed by a directory `index.html`:

```
https://hhoikoo.github.io/study/                           list of studies
https://hhoikoo.github.io/study/<study-id>/                that study's articles
https://hhoikoo.github.io/study/<study-id>/<slug>/         an article (renders its index.md)
```

Live example: <https://hhoikoo.github.io/study/aidcnw/week1-gpu-cluster/>

## Layout

```
public/                              the deployed site
  index.html                         landing page; lists studies from manifest.json
  manifest.json                      studies and their articles
  assets/                            shared CSS
  <study-id>/
    index.html                       study listing page
    <slug>/
      index.html                     article renderer (zero-md loads ./index.md)
      index.md                       the article (first H1 is the title, no frontmatter)
      images/                        images for that article, referenced relatively
templates/                           boilerplate the skills copy; not deployed
```

The two `index.html` files are generic and you never edit them. A study page derives its id from its own URL and reads `manifest.json`; an article page renders its sibling `index.md`. Authoring touches `index.md`, `images/`, and `manifest.json`.

Site chrome and this README are English. Each article is written in its study's own language. The `aidcnw` study runs in Korean, so its articles are Korean.

## Writing articles

Use the Claude Code skills:

```
/new-study <study name>              scaffold a study folder, listing page, and manifest entry
/new-article <study-id> [topic|url|notes]   draft an article and register it
/revise <study-id/slug> [instructions]      iterate on an article, strip AI tells
/preview                             serve public/ locally to read before publishing
/publish [message]                   validate the manifest, commit, push, deploy
```

By hand: copy `templates/article-index.html` and `templates/article-index.md` into `public/<study>/<slug>/`, write the markdown, and add an article entry to `manifest.json`.

The rules in `.claude/rules/` keep articles from reading AI-generated: Korean and English anti-tell guides plus an honesty bar.

## Local preview

zero-md renders Markdown in the browser, so `file://` breaks. Serve over HTTP:

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000/
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which uploads `public/` to GitHub Pages. First time only: set the Pages source to "GitHub Actions" in repo Settings.
