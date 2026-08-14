# ndxCraft User Guide

ndxCraft is the desktop authoring studio for Sentinel **fcms**: git-native Markdown in a kit’s `ct/` directory.

## Open an SRE

1. **Projects** (folder icon) → add the SRE root (the folder that contains `sentinel.yaml`).
2. The Files rail lists **kits**, then **Content** with slugs — not a dump of Lua modules and skill twins.
3. Generic folders without `sentinel.yaml` still work as a plain Markdown project.

## Write

- **Source** — the full file, including YAML frontmatter. Tab indents.
- **Visual** — the Markdown body only. Frontmatter stays in the inspector so YAML cannot be destroyed.
- **Split** — source plus local preview.
- **Site** — live `GET /fcms/render/{ns}/{name}/{template}/{slug}` when a Sentinel harness is running **this** SRE (`GET /hl/runtime`).

Save writes the file on disk. Git is how you publish. The harness watcher reloads `ct/` — ndxCraft does not `PUT /fcms` for ordinary saves.

## Frontmatter

The inspector maps Sentinel’s known fields:

- `title` (recommended)
- `slug` (lowercase / hyphenated path)
- `date` (`YYYY-MM-DD` or RFC3339)
- `description`, `tags`
- `agent_context` (JSON; available to Lua, stripped from public `/fcms` JSON)

Empty documents stay without a `---` block until you fill a field. Key order is stable so diffs stay boring.

## New article

Command palette → **New article…**, or right-click a kit. Pick kit, slug, title, tags. Files land at `{kit}/ct/{slug}.md`.

## Command palette

`Ctrl+K` runs commands. `Ctrl+P` jumps to an article. Copy slug or `/fcms/{ns}/{name}/{slug}` from the palette or the kit context menu.

## Diagnostics

The rail badge lists missing titles, bad dates, invalid or duplicate slugs, heading-level skips, and likely-broken relative `.md` links.

## AI

The inspector’s Assistant tab uses the current section, title, and `agent_context`. Set `GEMINI_API_KEY`. Offline is a quiet status — not a red banner.

## Harness

Preferences → Theme → **Harness URL** (default `http://127.0.0.1:8080`). Status bar shows `disconnected`, `mismatched`, or `matched`.
