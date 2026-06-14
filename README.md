# study

A place to publish study writeups. Articles are written in Markdown and rendered in GitHub style by GitHub Pages, with images and syntax highlighting. No PDF export, no build step.

Made for a network study group, but any study can use it. Each study is a folder under `public/`, and each article is a folder inside it. The URLs are clean:

```
https://hhoikoo.github.io/study/                       list of studies
https://hhoikoo.github.io/study/aidcnw/                 one study's articles
https://hhoikoo.github.io/study/aidcnw/week1-gpu-cluster/   an article
```

## Layout

```
public/
  index.html                       landing page (lists studies from manifest.json)
  manifest.json                    studies and their articles
  <study-id>/index.html            study listing page
  <study-id>/<slug>/index.md       the article (first H1 is the title, no frontmatter)
  <study-id>/<slug>/images/        images for that article (referenced relatively)
templates/                         boilerplate the skills copy (not deployed)
```

Site navigation, this README, and the study listings are in English. Individual articles are written in the study's own language (the `aidcnw` study runs in Korean, so its articles are Korean).

## Writing articles

Use the Claude Code skills:

```
/new-study AI Data Center Networking   # create a new study
/new-article aidcnw <your week-1 notes>  # draft an article
/revise aidcnw/week1-gpu-cluster         # tighten it, strip AI tells
/preview                                 # view locally before publishing
/publish                                 # commit, push, deploy
```

Or do it by hand: copy `templates/article-index.html` and `templates/article-index.md` into `public/<study>/<slug>/`, write the markdown, and add an entry to `manifest.json`.

The writing rules in `.claude/rules/` exist to keep articles from reading like AI generated them (Korean and English anti-AI-tell guides plus an honesty bar).

## Local preview

The site renders Markdown in the browser, so `file://` will not work. Serve it over HTTP:

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000/
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which uploads `public/` to GitHub Pages. The first time, set the Pages source to "GitHub Actions" in Settings -> Pages.

Site: <https://hhoikoo.github.io/study/>
