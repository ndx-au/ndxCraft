# ndxCraft

[![Built with Wails](https://img.shields.io/badge/Built%20with-Wails-red)](https://wails.io)
[![Frontend React](https://img.shields.io/badge/Frontend-React-blue)](https://react.dev)

**ndxCraft** is an fcms authoring studio for Sentinel SREs. Technical writers open a Sentinel Runtime Environment, edit git-native Markdown in kit `ct/` trees, and optionally preview the live harness render.

## Features

- **SRE-aware tree** — kits, slugs, and `ct/` content instead of a junk drawer of files
- **Dual editing** — Monaco source (full file, including YAML) and MDXEditor visual (body only)
- **Frontmatter inspector** — title, slug, date, tags, `agent_context`, ordered YAML that does not churn git diffs
- **Hybrid preview** — local Markdown preview, plus Site mode against `/fcms/render` when the harness serves this SRE
- **Command palette** — `Ctrl+K` / `Ctrl+P`, diagnostics, search, git badges
- **Keyboard** — Tab indents. `Ctrl+S` saves. `Ctrl+1…4` switch Source / Visual / Split / Site

Generic Markdown folders still open when `sentinel.yaml` is absent.

## Installation

### Prerequisites

- **Go**: v1.21 or newer
- **Node.js**: v18 or newer
- **Wails**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Build from Source

```bash
git clone https://github.com/ndx-video/ndxCraft.git
cd ndxCraft
cd frontend && npm install && cd ..
wails dev
```

Production:

```bash
wails build
```

## Keyboard

| Key | Action |
| --- | --- |
| `Tab` | Indent in the source editor |
| `Ctrl+S` | Save |
| `Ctrl+P` | Quick open |
| `Ctrl+K` / `Ctrl+Shift+P` | Command palette |
| `Ctrl+1…4` | Source / Visual / Split / Site |
| `Ctrl+\\` | Cycle source / visual / split |
| `F9` / `F10` | Source / visual fullscreen |
| `Ctrl+,` | Preferences |

## Stack

Go (Wails) · React · Monaco · MDXEditor · Tailwind · shadcn/ui

## License

MIT
