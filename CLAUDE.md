# study

A place to publish study writeups. Articles are Markdown, rendered natively in GitHub style on a GitHub Pages site (no PDF, no export). Built for a network study group, generalized so any study can use it.

Three levels, each a clean URL backed by a directory `index.html`:

```
/study/                       landing: list of studies
/study/<study-id>/            one study: list of its articles
/study/<study-id>/<slug>/     one article (renders its index.md)
```

## Layout

```
public/
  index.html                  # landing; reads manifest.json, lists studies
  manifest.json               # registry: studies -> articles (drives every listing page)
  assets/style.css            # shared styling
  <study-id>/
    index.html                # study listing page (generic: derives id from URL, reads ../manifest.json)
    <slug>/
      index.html              # article renderer (generic: zero-md loads ./index.md)
      index.md                # the article (first H1 is the title, no frontmatter)
      images/                 # images for that article, referenced relatively
templates/                    # copied by skills; NOT deployed (outside public/)
  study-index.html  article-index.html  article-index.md
.github/workflows/deploy-pages.yml   # push to main -> uploads public/ to Pages
.claude/                      # skills, writing rules, output style (committed, shared)
```

## How rendering and clean URLs work

Each article and study directory has an `index.html`. GitHub Pages serves `index.html` for a directory request, so `/study/aidcnw/week1-gpu-cluster/` resolves with no `.html` in the URL. Articles render `index.md` client-side with [zero-md](https://github.com/zerodevx/zero-md) (CDN): GitHub-flavored markdown, GitHub CSS, syntax highlighting, relative-path images. No build step. `public/.nojekyll` makes Pages serve files raw.

The two `index.html` templates are generic. The study page derives its id from its own URL and reads `../manifest.json`; the article page just renders `./index.md`. Authoring touches `index.md`, `images/`, and `manifest.json`, never the HTML.

Live site is a project page at `https://hhoikoo.github.io/study/`, so in-page paths are relative.

## Prev/next article navigation

Every article and sub-article page renders a previous/next footer at the bottom, injected by `public/assets/nav.js` (included after `theme.js` in the article + sub-article HTML, and in both `templates/`). It reads `manifest.json`, ordering articles by `date` ascending and each article's `children` in manifest order. The `next` chain is a flat depth-first walk; the `prev` of a main page is asymmetric:

- week main page: `prev` = previous week's **main** page, `next` = its own first child.
- child page: `prev` = previous child (or the week main if it is the first child), `next` = next child (or the next week's main page if it is the last child).

So from a week's last child `next` lands on the following week's main, but that main's `prev` jumps back to the previous week's main rather than that week's last child. Navigation stays inside one study; the first and last pages show only the one available side.

This is automatic. Do not hand-write prev/next links in `index.md`. To keep ordering correct you only maintain `manifest.json`: list each article with a `date`, and order each `children` array the way the sections read. New pages scaffolded from `templates/` already include `nav.js`; if you hand-build article HTML, add the `nav.js` script line after `theme.js` with the same relative prefix.

## Skills

| Skill | Use |
|---|---|
| `/new-study <name>` | Scaffold a study folder + listing page + manifest entry |
| `/new-article <study-id> [topic\|url\|notes]` | Draft an article in a human voice; register it |
| `/revise <study-id/slug> [instructions]` | Iterate on an article, strip AI tells |
| `/preview` | Serve `public/` locally to read before publishing |
| `/publish [message]` | Validate manifest, commit, push, deploy |

## Writing voice

The point of this repo is articles that do not read AI-generated. Output style for chat/commits: `.claude/output-styles/concise.md`. Article prose rules: `.claude/rules/article-voice.md` (structure + honesty bar) plus `writing-ko.md`, `writing-en.md`, `writing-cross-language.md` (anti-AI-tells, scoped to `public/**/*.md`).

Language split: site chrome (landing, listings, nav, README, this file) is English. Each article follows its study's language. The `aidcnw` study runs in Korean, so its articles and their manifest title/summary are Korean.

The honesty bar matters most: only write what the source actually said, no invented numbers or citations, mark uncertainty, keep honest negatives. Generic prose that could front any article is the main tell to cut.

## Delegation policy

When a skill exists for the task, use it. Writing or revising an article means following the active rules in `.claude/rules/`, not approximating them from memory.

## Verify before assuming

For Claude Code surface details (frontmatter fields, settings keys, hooks), look them up (`claude-code-guide` agent or `https://code.claude.com/docs/en/`), don't guess. For a study topic, write from sources you actually read, not training-data recall.
