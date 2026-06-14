---
name: new-study
description: Scaffold a new study (folder + listing page) and register it in the manifest. Usage: /new-study <study name>
argument-hint: "<study name>"
---

# New study

Create a new study under `public/` and add it to `public/manifest.json`. A study is a directory with its own `index.html` listing page, served at `/<id>/`.

## Input

`$ARGUMENTS` is the human-readable study name (e.g. `AI Data Center Networking`). If empty, ask for it.

## Workflow

1. Pick an `id` slug: short, ASCII lowercase, no spaces. This is the folder name and the URL segment (`/study/<id>/`), so keep it stable. Confirm the slug with the user if it is not obvious from the name.
2. Scaffold the directory and its listing page from the template:
   ```bash
   mkdir -p "public/<id>"
   cp templates/study-index.html "public/<id>/index.html"
   ```
   The listing page is generic: it derives the study id from its own URL and reads `../manifest.json`. No per-study edits needed.
3. Read `public/manifest.json`. Append to `studies`:
   ```json
   { "id": "<id>", "title": "<study name>", "description": "<one concrete line>", "articles": [] }
   ```
   Ask for the description if it is not obvious. Site chrome is English (study title and description included), even when the articles will be in another language.
4. Write the manifest back as valid JSON (2-space indent, no trailing commas).
5. Report the study URL (`/study/<id>/`) and suggest `/new-article <id>` for the first article.

## Notes

- Do not reuse an existing `id`. If it exists, say so and stop.
- Manifest order is display order; new studies go at the end unless the user says otherwise.
