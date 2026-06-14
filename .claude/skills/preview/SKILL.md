---
name: preview
description: Serve public/ locally so you can read articles in the browser before publishing. Usage: /preview
---

# Preview

The site renders markdown client-side (zero-md), so it needs to be served over HTTP, not opened as a `file://`. Start a local static server on `public/`.

## Workflow

1. Start the server from the repo root:
   ```bash
   cd public && python3 -m http.server 8000
   ```
   If port 8000 is taken, pick another and report it.
2. Tell the user the URLs:
   - Index: `http://localhost:8000/`
   - A specific article: `http://localhost:8000/viewer.html#<study-id>/<slug>/index.md`
3. Leave the server running in the background. When the user is done, they stop it (Ctrl-C) or ask you to.

## Notes

- Run the server in the background so the session stays usable.
- `file://` will not work: browsers block `fetch` of local files, so zero-md cannot load the `.md`. Always use the HTTP server.
- Edits to `.md` files show on browser refresh. No build step.
