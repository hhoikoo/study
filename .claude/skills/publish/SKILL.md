---
name: publish
description: Validate the manifest, commit, and push to deploy the site to GitHub Pages. Usage: /publish [commit message]
argument-hint: "[commit message]"
---

# Publish

Commit pending changes and push to `origin/main`. The push triggers `.github/workflows/deploy-pages.yml`, which uploads `public/` to GitHub Pages. No local build.

## Input

`$ARGUMENTS` is an optional commit message. If empty, write one from the actual diff following Conventional Commits (e.g. `docs(ai-networking): add week 1 RoCE summary`).

## Workflow

1. Sanity-check before committing:
   - `public/manifest.json` is valid JSON.
   - Every `path` in the manifest points to a file that exists.
   - Every `public/<study>/<slug>/index.md` on disk is listed in the manifest (warn on orphans, do not auto-add).
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
   If the branch has no upstream yet, use `git push -u origin main`.
4. Report the commit, that the Pages workflow is now running, and the live URL: `https://hhoikoo.github.io/study/`. A specific article is `https://hhoikoo.github.io/study/viewer.html#<study-id>/<slug>/index.md`.

## Notes

- First-ever deploy also needs GitHub Pages set to "GitHub Actions" as the source in repo Settings -> Pages. Mention this if the workflow has never run.
- Do not commit secrets. This repo is public.
- Keep one logical change per commit when it is easy to.

$ARGUMENTS
