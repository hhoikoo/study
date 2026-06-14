---
name: publish
description: Validate the manifest, commit, and push to deploy the site to GitHub Pages. Usage: /publish [commit message]
argument-hint: "[commit message]"
---

# Publish

Commit pending changes and push to `origin/main`. The push triggers `.github/workflows/deploy-pages.yml`, which uploads `public/` to GitHub Pages. No local build.

## Input

`$ARGUMENTS` is an optional commit message. If empty, write one from the actual diff, Conventional Commits style (e.g. `docs(aidcnw): add week 1 RDMA summary`).

## Workflow

1. Sanity-check before committing:
   - `public/manifest.json` is valid JSON.
   - For every study `<id>` and article `<slug>` in the manifest, both `public/<id>/<slug>/index.md` and `public/<id>/<slug>/index.html` exist, and `public/<id>/index.html` exists.
   - Every `public/<id>/<slug>/index.md` on disk is listed in the manifest (warn on orphans, do not auto-add).
   - Referenced images (`images/...`) exist and are committed.
   Report problems and stop if any path is broken.
2. Stage and commit:
   ```bash
   git add -A
   git commit -m "<message>"
   ```
3. Push:
   ```bash
   git push origin main
   ```
   Use `git push -u origin main` if there is no upstream yet.
4. Report the commit, that the Pages workflow is running, and the URLs:
   - Site: `https://hhoikoo.github.io/study/`
   - Study: `https://hhoikoo.github.io/study/<id>/`
   - Article: `https://hhoikoo.github.io/study/<id>/<slug>/`

## Notes

- First-ever deploy also needs GitHub Pages source set to "GitHub Actions" (repo Settings -> Pages). Mention this if the workflow has never run.
- This repo is public. Do not commit secrets.
- Do not add AI-attribution trailers to the commit; the repo strips them by design.

$ARGUMENTS
