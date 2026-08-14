import type { Diagnostic, FrontMatterWarning, KitInfo, SreProject } from '../types'
import { parseAST } from './markdownService'

const MD_LINK = /\]\(([^)]+)\)/g
const IMG_LINK = /!\[([^\]]*)\]\(([^)]+)\)/g

export function collectDiagnostics(opts: {
  raw: string
  body: string
  frontMatter: Record<string, unknown>
  warnings: FrontMatterWarning[]
  slug?: string
  filePath?: string
  project?: SreProject | null
  kit?: KitInfo | null
}): Diagnostic[] {
  const out: Diagnostic[] = []
  const seen = new Set<string>()
  const push = (d: Diagnostic) => {
    if (seen.has(d.id)) return
    seen.add(d.id)
    out.push(d)
  }

  for (const w of opts.warnings || []) {
    push({
      id: `fm-${w.field}`,
      severity: w.field === 'slug' ? 'error' : 'warning',
      message: w.message,
      field: w.field,
    })
  }

  const ast = parseAST(opts.body || opts.raw || '')
  let prev = 0
  const walk = (nodes: ReturnType<typeof parseAST>) => {
    for (const n of nodes) {
      if (prev && n.level > prev + 1) {
        push({
          id: `heading-${n.line}`,
          severity: 'warning',
          message: `Heading level skips from H${prev} to H${n.level} (“${n.title}”)`,
          line: n.line,
        })
      }
      prev = n.level
      if (n.children?.length) walk(n.children)
    }
  }
  walk(ast)

  if (opts.kit && opts.slug) {
    const dupes = opts.kit.articles.filter((a) => a.slug === opts.slug && a.path !== opts.filePath)
    if (dupes.length) {
      push({
        id: `dup-slug-${opts.slug}`,
        severity: 'error',
        message: `Slug “${opts.slug}” is already used in ${opts.kit.dir}`,
      })
    }
  }

  const ctRoot = opts.kit ? opts.kit.path.replace(/\\/g, '/') + '/ct/' : ''
  const fileDir = (opts.filePath || '').replace(/\\/g, '/').replace(/\/[^/]+$/, '/')
  const targets = new Set<string>()
  const scan = (re: RegExp, group: number) => {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    const src = opts.body || opts.raw
    while ((m = re.exec(src))) {
      const href = m[group]
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) continue
      targets.add(href.split('#')[0])
    }
  }
  scan(MD_LINK, 1)
  scan(IMG_LINK, 2)

  if (opts.kit) {
    const known = new Set(opts.kit.articles.map((a) => a.relPath.replace(/\\/g, '/')))
    for (const href of targets) {
      if (href.startsWith('http')) continue
      const cleaned = href.replace(/^\.\//, '')
      if (cleaned.endsWith('.md') || cleaned.endsWith('.markdown')) {
        const hit = [...known].some((rel) => rel === cleaned || rel.endsWith('/' + cleaned) || cleaned.endsWith(rel))
        if (!hit && !cleaned.includes('://')) {
          push({
            id: `link-${cleaned}`,
            severity: 'warning',
            message: `Relative Markdown link may be broken: ${cleaned}`,
          })
        }
      }
    }
  }

  void ctRoot
  void fileDir
  return out
}
