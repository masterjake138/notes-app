# Notes

A fast, private, offline-first note-taking app. Rich-text editing, tags, pinning,
search, trash, and light/dark themes — with **all data stored locally in your
browser** (IndexedDB). No accounts, no server, no tracking.

**[Open the app →](https://masterjake138.github.io/notes-app/)**

## Features

- **Rich-text editor** (Tiptap) — headings, bold/italic/underline/strikethrough,
  inline code, code blocks, blockquotes, bullet/numbered/**task lists**, links,
  and horizontal rules.
- **Autosave** with a subtle "Saving… / Saved" indicator.
- **Tags** — create, rename, delete, assign multiple per note, colored chips, and
  click-to-filter.
- **Pin** important notes to the top.
- **Trash** — soft delete, restore, or empty the trash permanently.
- **Search** across titles and body text (⌘/Ctrl + K focuses the search box).
- **Sort** by last edited, date created, or title.
- **Light / dark / system theme**, applied before first paint (no flash).
- **Responsive** — three-pane desktop layout, drawer + single-column on mobile.
- Works **offline** after the first load.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, static export)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [Tiptap](https://tiptap.dev) 3 (ProseMirror)
- [Dexie](https://dexie.org) 4 (IndexedDB) + `dexie-react-hooks`
- [Zustand](https://zustand.docs.pmnd.rs) for UI state
- [lucide-react](https://lucide.dev) icons

## Getting started

Requires **Node.js 20.9+**.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site into `out/` |
| `npm run lint` | Run ESLint |

## Deployment (GitHub Pages)

The app is a fully static export (`output: "export"`), so it can be hosted on any
static file server. This repo deploys to GitHub Pages via GitHub Actions.

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes `out/` to Pages. The workflow uses `actions/configure-pages` to set
`PAGES_BASE_PATH`, so the assets are correctly served from the `/<repo>` subpath.

To set it up on a fresh fork:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push to `main` (or run the workflow manually from the **Actions** tab).

### Local preview of the static build

```bash
npm run build
npx serve out
```

> Tip: to test the `/repo` subpath locally, build with
> `PAGES_BASE_PATH=/your-repo npm run build` and serve `out/` at that path.

## Notes on data

Everything is stored in **your** browser's IndexedDB, keyed by origin. Notes are
**not** uploaded anywhere. Clearing site data (or using a different browser/device)
means starting fresh. Data on `localhost` and on the GitHub Pages URL are separate
stores.
