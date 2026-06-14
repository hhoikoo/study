---
name: new-article
description: Draft a new study article from notes, a topic, or a URL, in a human (non-AI) voice. Usage: /new-article <study-id> [topic or source]
argument-hint: "<study-id> [topic|url|notes]"
---

# New article

Scaffold and draft one article under a study, then register it in `public/manifest.json`. Each article is a directory served at a clean URL `/<study-id>/<slug>/`, holding `index.html` (a generic renderer), `index.md` (the content), and `images/`.

## Input

`$ARGUMENTS`:
- First token: the study `id` (folder under `public/`). If missing or unknown, list studies from `public/manifest.json` and ask.
- Rest: the source for the article. One of:
  - **Notes / summary** the user pastes or points to (the usual weekly-writeup case).
  - **Topic** to research (`GPU Direct RDMA`): WebSearch / WebFetch or a researcher agent, then write from what the sources actually say.
  - **URL / paper**: WebFetch it and summarize the real content.

If no source is given, ask what the article is about and whether it is a session summary or a topic deep-dive.

## Language

Write the article in the study's language. The study group sets this, not the site. `aidcnw` runs in Korean, so its articles are Korean (the Korean rules in `.claude/rules/writing-ko.md` apply). Site chrome stays English; the article and its manifest title/summary match the article's language.

## Voice

The rules in `.claude/rules/` (`article-voice.md`, `writing-ko.md`, `writing-en.md`, `writing-cross-language.md`) are active. Follow them. The honesty bar in `article-voice.md` is non-negotiable: no invented numbers, no fake citations, mark what you are unsure about, keep honest negatives.

## Workflow

1. Resolve the study `id` and confirm it exists in the manifest.
2. Agree on a title (or propose one from the source). Derive a `slug`: ASCII lowercase, `-` separated, short, week-prefixed if useful (`week1-gpu-cluster`). This is the URL segment.
3. Scaffold from templates:
   ```bash
   mkdir -p "public/<id>/<slug>/images"
   cp templates/article-index.html "public/<id>/<slug>/index.html"
   cp templates/article-index.md "public/<id>/<slug>/index.md"
   ```
4. Gather the material. Summary mode: read the user's notes, do not embellish past them. Topic / URL mode: fetch sources, capture concrete facts and their URLs, write from those.
5. Write `public/<id>/<slug>/index.md`. Start with the `# title` H1, then real `##` sections. Embed images with relative paths under `images/` and commit the files. Link every external claim to its source.
6. Run the self-check in `writing-cross-language.md`. Fix AI tells (ending monotony, excessive bold, rule-of-three, generic sentences).
7. Add the article to its study in `public/manifest.json`, newest first (prepend):
   ```json
   { "slug": "<slug>", "title": "<title>", "date": "<today YYYY-MM-DD>", "summary": "<one honest line>" }
   ```
8. Tell the user the article URL (`/study/<id>/<slug>/`), `/preview` for local viewing, and `/publish` to ship.

## Notes

- One article per directory. The `index.html` renderer is copied as-is; only `index.md` and `images/` change.
- `date` is today's date, from the environment, not guessed.
- The manifest summary is one plain sentence in the article's language.
- If research turned up nothing solid, write less rather than padding.

$ARGUMENTS
