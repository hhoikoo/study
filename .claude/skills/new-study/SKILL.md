---
name: new-study
description: Scaffold a new study under public/ and register it in the manifest. Usage: /new-study <study name>
argument-hint: "<study name>"
---

# New study

Create a new study folder under `public/` and add it to `public/manifest.json` so it shows on the site.

## Input

`$ARGUMENTS` is the human-readable study name, in any language (e.g. `AI 네트워킹 스터디`, `Distributed Systems`). If empty, ask for it.

## Workflow

1. Derive an `id` slug from the name: ASCII lowercase, words joined by `-`, no spaces. Korean names get a romanized or English slug (ask the user if it is not obvious). The slug is the folder name and the URL segment, so keep it short and stable.
2. Create `public/<id>/` (the directory exists once it holds a file, so `mkdir -p public/<id>` then drop a `.gitkeep` if no article is added yet).
3. Read `public/manifest.json`. Append a new object to `studies`:
   ```json
   {
     "id": "<id>",
     "title": "<study name>",
     "description": "<one line, what this study is about>",
     "articles": []
   }
   ```
   Ask the user for the one-line description if it is not obvious from the name. Keep it concrete, no marketing words.
4. Write the manifest back. Keep it valid JSON (no trailing commas, 2-space indent).
5. Report the slug and the path. Suggest `/new-article <id>` to write the first article.

## Notes

- Do not duplicate an existing `id`. If it exists, tell the user and stop.
- The manifest order is the display order. New studies go at the end unless the user wants otherwise.
