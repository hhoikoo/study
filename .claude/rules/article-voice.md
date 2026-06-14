---
paths:
  - "public/**/*.md"
---
# Article voice

These are study writeups published to a GitHub Pages site. A person wrote them after a study session, not a content farm. The voice rules in `writing-en.md`, `writing-ko.md`, `writing-cross-language.md` apply to every word. This file covers article-specific structure and the honesty bar.

## What an article is

Write in the study's language, not the site's. The site chrome (landing page, study listings, navigation) is English; an individual article follows its study. The `aidcnw` study runs in Korean, so its articles are Korean. One article is one `index.md` inside its own directory at `public/<study>/<slug>/`, served at the clean URL `/study/<study>/<slug>/`. Images live in `images/` next to it and are referenced relatively (`![구조도](images/topology.png)`).

No YAML frontmatter. The renderer takes the first `# H1` as the title. Start the file with that H1.

## Structure

- Open with the actual content, not a preamble. The first paragraph says what the session covered or what the topic is, with specifics. No "In this post I'll cover..." / "이번 글에서는 ~를 다뤄보겠습니다".
- Use `##` sections for the real subtopics. Section titles name the thing, not a category ("RoCE가 손실 네트워크에서 죽는 이유", not "주요 개념").
- Vary section depth by how much there is to say. A subtopic you understood well gets more room. Don't pad thin ones to match.
- End on a concrete takeaway, an open question, or what you want to dig into next. Not a recap of what you just wrote.
- Length follows the material. A weekly summary is usually 400 to 900 words. A single-topic deep dive can be longer. Don't inflate.

## The honesty bar (most important)

This is the line between a real study note and AI filler.

- Only write what the source actually said or what you can verify. If you summarize a session, summarize what was covered, not what a textbook would cover.
- No invented numbers, benchmarks, dates, or "studies show". If you cite a figure, it comes from a named source (a doc, a paper, a repo, a vendor page). Link it.
- Mark uncertainty in the writer's voice ("여기는 아직 잘 모르겠는데", "확인이 필요함" / "not sure about this part yet"). Do not smooth over gaps with confident generic prose.
- Allow honest negatives. If a technology has annoying tradeoffs, say so. AI positivity bias is a tell.
- When researching a topic the writer didn't cover, say where it came from and keep claims to what the source supports.

## Images and code

- Embed diagrams and screenshots with relative paths under `images/`. Commit the image files.
- Code blocks get a language tag for highlighting (```python, ```bash, ```yaml). Keep snippets short and real.
- Don't add an image just to fill space. An image earns its place by showing something prose can't.

## Before publishing

Run the self-check in `writing-cross-language.md`. Read it aloud once. If a paragraph sounds like it could front any article on any topic, it is generic. Cut it or make it specific.
