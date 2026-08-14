import React, { useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { FrontMatterWarning, KitInfo } from '@/types'
import { ValidateSlug } from '../../../wailsjs/go/main/App'

interface Props {
  frontMatter: Record<string, any>
  hasFrontMatter: boolean
  warnings: FrontMatterWarning[]
  kit?: KitInfo | null
  slugFromPath?: string
  templates: string[]
  template: string
  onTemplateChange: (t: string) => void
  onChange: (fm: Record<string, any>) => void
}

function asTags(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(', ')
  if (typeof v === 'string') return v
  return ''
}

export function FrontmatterInspector({
  frontMatter, warnings, kit, slugFromPath, templates, template, onTemplateChange, onChange,
}: Props) {
  const [slugError, setSlugError] = useState('')
  const title = String(frontMatter.title ?? '')
  const slug = String(frontMatter.slug ?? slugFromPath ?? '')
  const date = String(frontMatter.date ?? '')
  const description = String(frontMatter.description ?? '')
  const tags = asTags(frontMatter.tags)
  const agent = frontMatter.agent_context

  const extraKeys = useMemo(() => {
    const known = new Set(['title', 'slug', 'date', 'description', 'tags', 'agent_context'])
    return Object.keys(frontMatter || {}).filter((k) => !known.has(k))
  }, [frontMatter])

  useEffect(() => {
    if (!slug) {
      setSlugError('')
      return
    }
    ValidateSlug(slug).then(() => setSlugError('')).catch((e: any) => setSlugError(String(e)))
  }, [slug])

  const patch = (key: string, value: unknown) => {
    onChange({ ...frontMatter, [key]: value })
  }

  return (
    <div className="flex flex-col gap-3 p-3 text-[13px]">
      {kit && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-fcms border-fcms/40">{kit.dir}</Badge>
          <span className="text-[11px] text-muted-foreground truncate">{slugFromPath}</span>
        </div>
      )}

      <Field label="Title" htmlFor="fm-title">
        <Input id="fm-title" value={title} onChange={(e) => patch('title', e.target.value)} placeholder="Recommended" />
      </Field>
      <Field label="Slug" htmlFor="fm-slug" hint={slugError || 'lowercase / hyphenated path'}>
        <Input id="fm-slug" value={slug} onChange={(e) => patch('slug', e.target.value)} className={slugError ? 'border-destructive' : ''} />
      </Field>
      <Field label="Date" htmlFor="fm-date" hint="YYYY-MM-DD or RFC3339">
        <Input id="fm-date" value={date} onChange={(e) => patch('date', e.target.value)} placeholder="2026-08-14" />
      </Field>
      <Field label="Description" htmlFor="fm-desc">
        <textarea
          id="fm-desc"
          value={description}
          onChange={(e) => patch('description', e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Tags" htmlFor="fm-tags" hint="comma separated">
        <Input
          id="fm-tags"
          value={tags}
          onChange={(e) => patch('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      </Field>
      <Field label="agent_context" htmlFor="fm-agent" hint="JSON object — stripped from public /fcms JSON">
        <textarea
          id="fm-agent"
          value={typeof agent === 'string' ? agent : JSON.stringify(agent ?? {}, null, 2)}
          onChange={(e) => {
            try {
              patch('agent_context', JSON.parse(e.target.value || '{}'))
            } catch {
              patch('agent_context', e.target.value)
            }
          }}
          rows={5}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono"
        />
      </Field>

      {extraKeys.length > 0 && (
        <div className="text-[11px] text-muted-foreground">
          Extra keys: {extraKeys.join(', ')}
        </div>
      )}

      {warnings?.length > 0 && (
        <ul className="text-[11px] text-dirty space-y-1">
          {warnings.map((w) => (
            <li key={w.field}>{w.field}: {w.message}</li>
          ))}
        </ul>
      )}

      {templates.length > 0 && (
        <Field label="Site template" htmlFor="fm-tpl">
          <select
            id="fm-tpl"
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm cursor-pointer"
          >
            {templates.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      )}
    </div>
  )
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
