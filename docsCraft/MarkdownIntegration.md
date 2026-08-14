# Markdown Integration in ndxCraft

ndxCraft uses two Markdown pipelines on purpose.

## Local preview (Split / Source)

`frontend/src/services/markdownService.ts` runs **markdown-it** in the renderer with GFM tables, task lists, anchors, and highlight.js. Custom renderer rules add `data-line-N` classes so the source cursor can scroll the preview.

This path is fast and offline. It is **not** Sentinel goldmark. Do not treat it as production HTML.

## Visual editor

`@mdxeditor/editor` round-trips the **body** only. YAML frontmatter is stripped before the visual editor and reassembled with ordered keys in Go (`internal/fcmsdoc`). The visual editor never sees `agent_context`.

## Site preview (hybrid)

When a Sentinel harness is running this SRE (`GET /hl` + `GET /hl/runtime` `sre_path` match), Site mode loads:

`GET /fcms/render/{ns}/{name}/{template}/{slug}`

That is goldmark + kit `tp/*.gohtml` — the production fcms path.

## Document structure

The Outline rail still walks ATX headings (blocks + markdown-it AST) for navigation and drag-reorder of the full source, including frontmatter as part of the preamble when present.
