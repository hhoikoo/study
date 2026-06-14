---
name: revise
description: Iterate on an existing article: tighten the writing and strip AI tells. Usage: /revise <study-id/slug> [what to change]
argument-hint: "<study-id/slug> [instructions]"
---

# Revise

Improve an existing article in place. Default job is to make the prose read like a person wrote it and to sharpen the content.

## Input

`$ARGUMENTS`:
- First token: the article, as `<study-id>/<slug>` or a path to its `index.md`. If ambiguous, list articles from `public/manifest.json` and ask.
- Rest: optional instructions (`add a section on NCCL`, `shorten the intro`, `it sounds robotic`). With none, do a full voice-and-clarity pass.

## Workflow

1. Resolve and read `public/<study-id>/<slug>/index.md`.
2. If the user gave instructions, do that first.
3. Run the self-check from `writing-cross-language.md` over the whole file. Match the article's language. Look hard for:
   - Korean ending monotony (~합니다/~할 수 있습니다 clusters): vary registers.
   - Excessive bold: 1-2 per section, drop the rest.
   - Rule-of-three padding, negative parallelism ("X가 아니라 Y"), summary endings.
   - Generic sentences that could front any article: cut or make specific.
   - Invented specifics with no source: remove or mark as uncertain.
4. Apply edits directly to the file. Preserve the writer's real claims and links; do not invent facts to fill gaps.
5. If the title or one-line summary changed materially, update the matching entry in `public/manifest.json`.
6. Report what changed in a sentence or two. Suggest `/preview` then `/publish`.

## Notes

- Editing, not rewriting. Keep what already sounds human.
- Never raise confidence on a claim the source does not support.

$ARGUMENTS
