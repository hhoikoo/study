# study

A place to publish study writeups. Articles are markdown, rendered natively in GitHub style on a GitHub Pages site (no PDF, no export). Built for a network study group, generalized so any study can use it: each study is a folder under `public/`, each article a folder inside it.

## Layout

```
public/
  index.html        # landing page; reads manifest.json, lists studies + articles
  viewer.html       # renders one .md via zero-md (hash-routed: viewer.html#<study>/<slug>/index.md)
  manifest.json     # registry of studies and articles (drives the index)
  assets/style.css  # shared styling
  _template/        # article template that new-article copies
  <study-id>/       # one study (e.g. ai-networking/)
    <slug>/         # one article
      index.md      # the article (first H1 is the title, no frontmatter)
      images/       # images for that article, referenced relatively
.github/workflows/deploy-pages.yml   # push to main -> uploads public/ to Pages
.claude/            # skills, writing rules, output style (committed, shared)
```

## How rendering works

The site renders `.md` client-side with [zero-md](https://github.com/zerodevx/zero-md) (loaded from CDN), which gives GitHub-flavored markdown, GitHub CSS, syntax highlighting, and relative-path images. No build step. `viewer.html#<path>` loads one article; relative image paths resolve against the article's `index.md` URL. `public/.nojekyll` tells Pages to serve files raw.

Live site: `https://hhoikoo.github.io/study/`. It is a project page, so all in-page paths are relative.

## Skills

| Skill | Use |
|---|---|
| `/new-study <name>` | Scaffold a new study folder + manifest entry |
| `/new-article <study-id> [topic\|url\|notes]` | Draft an article in a human voice; register it |
| `/revise <study-id/slug> [instructions]` | Iterate on an article, strip AI tells |
| `/preview` | Serve `public/` locally to read before publishing |
| `/publish [message]` | Validate manifest, commit, push, deploy |

## Writing voice

The point of this repo is articles that do not read AI-generated. Output style for chat/commits: `.claude/output-styles/concise.md`. Article prose rules: `.claude/rules/article-voice.md` (structure + honesty bar) plus `writing-ko.md`, `writing-en.md`, `writing-cross-language.md` (anti-AI-tells, scoped to `public/**/*.md`). Default article language is Korean; the study group runs in Korean.

The honesty bar matters most: only write what the source actually said, no invented numbers or citations, mark uncertainty, keep honest negatives. Generic prose that could front any article is the main tell to cut.

## Delegation policy

When a skill exists for the task, use it. Writing or revising an article means following the active rules in `.claude/rules/`, not approximating them from memory.

## Verify before assuming

For Claude Code surface details (frontmatter fields, settings keys, hooks), look them up (`claude-code-guide` agent or `https://code.claude.com/docs/en/`), don't guess. For a study topic, write from sources you actually read, not training-data recall.
