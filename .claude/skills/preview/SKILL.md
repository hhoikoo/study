---
name: preview
description: Serve public/ locally so you can read articles in the browser before publishing. Usage: /preview
---

# Preview

The site renders markdown client-side (zero-md), so it needs HTTP, not `file://`. Serve `public/` with a static server.

## Workflow

1. Start the server from `public/`:
   ```bash
   cd public && python3 -m http.server 8000
   ```
   If 8000 is taken, pick another port and report it.
2. Give the user the URLs (clean paths, directories serve their `index.html`):
   - Studies index: `http://localhost:8000/`
   - A study: `http://localhost:8000/<study-id>/`
   - An article: `http://localhost:8000/<study-id>/<slug>/`
3. Leave the server running in the background. The user stops it (Ctrl-C) or asks you to.

## Notes

- Run the server in the background so the session stays usable.
- `file://` will not work: browsers block `fetch` of local files, so zero-md cannot load the `.md`.
- Edits to `.md` show on browser refresh. No build step.
