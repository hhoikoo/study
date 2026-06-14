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
- Rest: optional specific instructions (`add a section on NCCL`, `shorten the intro`, `it sounds robotic`). With no instructions, do a full voice-and-clarity pass.

## Workflow

1. Resolve and read the article `index.md`.
2. If the user gave instructions, do that work first.
3. Run the self-check from `writing-cross-language.md` against the whole file. Look hard for:
   - Korean ending monotony (~합니다/~할 수 있습니다 clusters): vary registers.
   - Excessive bold: keep 1-2 per section, drop the rest.
   - Rule-of-three padding, negative parallelism ("X가 아니라 Y"), summary endings.
   - Generic sentences that could front any article: cut or make specific.
   - Invented specifics with no source: remove or mark as uncertain.
4. Apply edits directly to the file. Preserve the writer's real claims and any links; do not invent new facts to fill gaps.
5. If the title or one-line summary changed materially, update the matching entry in `public/manifest.json`.
6. Report what changed in one or two sentences. Suggest `/preview` then `/publish`.

## Notes

- Editing, not rewriting. Keep what already sounds human.
- Never raise confidence on a claim the source does not support.

$ARGUMENTS
