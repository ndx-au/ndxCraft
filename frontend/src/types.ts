export type CanvasMode = 'source' | 'visual' | 'split' | 'site'
export type SidebarTab = 'files' | 'outline' | 'search' | 'diagnostics'
export type InspectorTab = 'frontmatter' | 'ai'
export type ThemeMode = 'dark' | 'light'
export type FullscreenMode = 'none' | 'source' | 'visual'

/** @deprecated use SidebarTab */
export enum LeftTab {
  FILES = 'FILES',
  OUTLINE = 'OUTLINE',
}

export interface StructureNode {
  id: string
  title: string
  level: number
  lineNumber: number
}

export interface FileNode {
  name: string
  path: string
  isDir: boolean
  children?: FileNode[]
}

export interface FrontMatterWarning {
  field: string
  message: string
}

export interface Diagnostic {
  id: string
  severity: 'warning' | 'error'
  message: string
  field?: string
  line?: number
}

export interface KitInfo {
  dir: string
  path: string
  ns: string
  name: string
  displayName: string
  articles: ArticleInfo[]
  templates: string[]
}

export interface ArticleInfo {
  slug: string
  path: string
  title: string
  relPath: string
}

export interface SreProject {
  root: string
  name: string
  isSre: boolean
  kits: KitInfo[]
}

export const INITIAL_CONTENT = `---
title: Welcome to ndxCraft
description: fcms authoring studio for Sentinel SREs
tags:
  - intro
---

# Welcome to ndxCraft

Open an **SRE** (a folder with \`sentinel.yaml\`) to author kit content under \`ct/\`.

## Writing

- **Source** — full Markdown, including YAML frontmatter
- **Visual** — body only; frontmatter stays in the inspector
- **Site** — live harness preview when Sentinel is serving this SRE

Tab indents. \`Ctrl+K\` opens the command palette. \`Ctrl+S\` saves.
`
