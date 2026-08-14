import React, { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { KitInfo } from '@/types'
import { ValidateSlug } from '../../../wailsjs/go/main/App'

interface Props {
  open: boolean
  kits: KitInfo[]
  initialKit?: KitInfo | null
  onClose: () => void
  onCreate: (kit: KitInfo, slug: string, title: string, description: string, tags: string[]) => Promise<void>
}

export function NewArticleDialog({ open, kits, initialKit, onClose, onCreate }: Props) {
  const [kitDir, setKitDir] = useState(initialKit?.dir || kits[0]?.dir || '')
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setKitDir(initialKit?.dir || kits[0]?.dir || '')
      setSlug('')
      setTitle('')
      setDescription('')
      setTags('')
      setError('')
    }
  }, [open, initialKit, kits])

  const kit = kits.find((k) => k.dir === kitDir)

  const submit = async () => {
    if (!kit) {
      setError('Select a kit')
      return
    }
    try {
      await ValidateSlug(slug)
    } catch (e: any) {
      setError(String(e))
      return
    }
    setBusy(true)
    try {
      await onCreate(kit, slug, title, description, tags.split(',').map((s) => s.trim()).filter(Boolean))
      onClose()
    } catch (e: any) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>New article</DialogTitle>
          <DialogDescription>Creates a Markdown file under the kit’s ct/ directory.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="na-kit">Kit</Label>
            <select
              id="na-kit"
              value={kitDir}
              onChange={(e) => setKitDir(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {kits.map((k) => (
                <option key={k.dir} value={k.dir}>{k.displayName} ({k.dir})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-slug">Slug</Label>
            <Input id="na-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="guides/getting-started" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-title">Title</Label>
            <Input id="na-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-desc">Description</Label>
            <Input id="na-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-tags">Tags</Label>
            <Input id="na-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="guide, intro" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !slug}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
