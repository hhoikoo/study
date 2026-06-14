---
name: new-article
description: Draft a new study article from notes, a topic, or a URL, in a human (non-AI) voice. Usage: /new-article <study-id> [topic or source]
argument-hint: "<study-id> [topic|url|notes]"
---

# New article

Scaffold and draft one article under a study, then register it in `public/manifest.json`. The article is markdown rendered natively on the GitHub Pages site, so write the `.md`, not HTML.

## Input

`$ARGUMENTS`:
- First token: the study `id` (folder under `public/`). If it is missing or unknown, list the studies in `public/manifest.json` and ask which one.
- Rest: the source for the article. One of:
  - **Notes / summary** the user pastes or points to (the most common case for a weekly study writeup).
  - **Topic** to research (`GPU Direct RDMA`): use WebSearch / WebFetch or launch a researcher agent, then write from what the sources actually say.
  - **URL / paper**: WebFetch it and summarize the real content.

If the user gave no source, ask what the article is about and whether it is a session summary or a topic deep-dive.

## Voice

This is the whole point. Before writing, the rules in `.claude/rules/` (`article-voice.md`, `writing-ko.md`, `writing-en.md`, `writing-cross-language.md`) are active. Follow them. The honesty bar in `article-voice.md` is non-negotiable: no invented numbers, no fake citations, mark what you are unsure about, keep negatives.

## Workflow

1. Resolve the study `id`. Confirm it exists in the manifest.
2. Agree on a title with the user (or propose one from the source). Derive a `slug`: ASCII lowercase, `-` separated, short. Prefix weekly summaries with the week if it helps (`week1-rocev2-basics`).
3. Create the article folder by copying the template:
   ```bash
   mkdir -p "public/<id>/<slug>/images"
   cp public/_template/index.md "public/<id>/<slug>/index.md"
   ```
4. Gather the material:
   - Summary mode: read the user's notes. Do not embellish beyond them.
   - Topic / URL mode: fetch sources, capture concrete facts and the source URLs, then write from those.
5. Write `public/<id>/<slug>/index.md`. Start with the `# title` H1, then real `##` sections. Embed any images with relative paths under `images/` and commit the image files. Link every external claim to its source.
6. Run the self-check in `writing-cross-language.md`. Fix AI tells (ending monotony, excessive bold, rule-of-three, generic sentences).
7. Add the article to its study in `public/manifest.json`:
   ```json
   { "title": "<title>", "path": "<id>/<slug>/index.md", "date": "<today YYYY-MM-DD>", "summary": "<one honest line>" }
   ```
   Newest article first within the study (prepend), so the latest shows on top.
8. Tell the user the local preview command (`/preview`) and that `/publish` ships it.

## Notes

- One article per folder. Images stay beside their article.
- `date` is today's date. Get it from the environment, do not guess.
- Do not write the article and the manifest summary in two different voices. The summary is one plain sentence.
- If research turned up nothing solid, say so and write less rather than padding.

$ARGUMENTS
