import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Toaster, toast } from 'sonner'
import { Titlebar } from './components/shell/Titlebar'
import { Toolbar } from './components/shell/Toolbar'
import { ActivityRail } from './components/shell/ActivityRail'
import { StatusBar } from './components/shell/StatusBar'
import { OutlinePanel, FilesFallback } from './components/shell/OutlinePanel'
import { SearchPanel } from './components/shell/SearchPanel'
import { DiagnosticsPanel } from './components/shell/DiagnosticsPanel'
import { CommandPalette } from './components/shell/CommandPalette'
import { EmptyState } from './components/shell/EmptyState'
import { KitTree } from './components/sre/KitTree'
import { FrontmatterInspector } from './components/sre/FrontmatterInspector'
import { NewArticleDialog } from './components/sre/NewArticleDialog'
import SitePreview from './components/sre/SitePreview'
import SourceEditor, { SourceEditorHandle } from './components/editors/SourceEditor'
import LocalPreview from './components/editors/LocalPreview'
import AIAssistant from './components/AIAssistant'
import PreferencesModal from './components/PreferencesModal'
import ProjectListModal from './components/ProjectListModal'
import { Button } from './components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './components/ui/dialog'
import { useUiStore } from './stores/ui'
import { collectDiagnostics } from './services/diagnostics'
import { INITIAL_CONTENT, type FileNode, type KitInfo, type SreProject, type ThemeMode } from './types'
import {
  ReadFile, SaveFile, SelectFile, SelectSaveFile, GetFileTree, OpenGitClient, OpenBrowser,
  SaveShadowFile, GetShadowFile, SaveAppState, GetAppState, HasCorruption, RestoreBackup,
  GetDefaultProjectRoot, GetPreference, AddProject, UpdateProjectLastOpened, GetGitIcons,
  InspectSRE, SplitDocument, AssembleDocument, CreateArticle, ProbeHarness, HarnessRenderURL,
  GitRepoStatus, RevealInFileManager, DuplicateFile, HasGeminiKey, ClearShadowFile,
} from '../wailsjs/go/main/App'
import { WindowFullscreen, WindowUnfullscreen, WindowIsFullscreen } from '../wailsjs/runtime/runtime'
import type { VisualEditorHandle } from './components/editors/VisualEditor'
import type { gitstatus, harness as harnessNs } from '../wailsjs/go/models'

const VisualEditor = lazy(() => import('./components/editors/VisualEditor'))

function locate(project: SreProject | null, path: string): { kit?: KitInfo; slug?: string } {
  if (!project?.kits || !path) return {}
  const norm = path.replace(/\\/g, '/')
  for (const kit of project.kits) {
    for (const art of kit.articles || []) {
      if (art.path.replace(/\\/g, '/') === norm) return { kit, slug: art.slug }
    }
    const ct = (kit.path.replace(/\\/g, '/') + '/ct/').toLowerCase()
    if (norm.toLowerCase().startsWith(ct)) {
      const rel = norm.slice(kit.path.replace(/\\/g, '/').length + '/ct/'.length)
      const slug = rel.replace(/\.(md|markdown)$/i, '')
      return { kit, slug }
    }
  }
  return {}
}

const App: React.FC = () => {
  const ui = useUiStore()
  const editorRef = useRef<SourceEditorHandle>(null)
  const visualRef = useRef<VisualEditorHandle>(null)
  const skipSource = useRef(false)
  const rawRef = useRef(INITIAL_CONTENT)
  const fmRef = useRef<Record<string, any>>({})
  const bodyRef = useRef('')
  const hasFmRef = useRef(false)

  const [raw, setRaw] = useState(INITIAL_CONTENT)
  const [savedRaw, setSavedRaw] = useState(INITIAL_CONTENT)
  const [body, setBody] = useState('')
  const [frontMatter, setFrontMatter] = useState<Record<string, any>>({})
  const [hasFrontMatter, setHasFrontMatter] = useState(false)
  const [warnings, setWarnings] = useState<{ field: string; message: string }[]>([])
  const [fileName, setFileName] = useState('untitled.md')
  const [cursorLine, setCursorLine] = useState(1)
  const [projectRoot, setProjectRoot] = useState('')
  const [sre, setSre] = useState<SreProject | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [git, setGit] = useState<gitstatus.Status | null>(null)
  const [harness, setHarness] = useState<harnessNs.Status>({ state: 'disconnected', baseUrl: '', srePath: '', project: '', message: '' })
  const [siteUrl, setSiteUrl] = useState('')
  const [template, setTemplate] = useState('render')
  const [geminiOk, setGeminiOk] = useState(false)
  const [gitIcon, setGitIcon] = useState<string | undefined>()
  const [newArticleKit, setNewArticleKit] = useState<KitInfo | null>(null)
  const [pendingFile, setPendingFile] = useState<string | null>(null)
  const [unsavedOpen, setUnsavedOpen] = useState(false)

  const { kit, slug } = useMemo(() => locate(sre, fileName), [sre, fileName])
  const isDirty = raw !== savedRaw
  const untitled = fileName === 'untitled.md'

  rawRef.current = raw
  fmRef.current = frontMatter
  bodyRef.current = body
  hasFmRef.current = hasFrontMatter

  const applySplit = useCallback(async (content: string) => {
    const doc = await SplitDocument(content)
    setHasFrontMatter(!!doc.hasFrontMatter)
    setFrontMatter(doc.frontMatter || {})
    setBody(doc.body || '')
    setWarnings((doc.warnings || []).map((w) => ({ field: w.field, message: w.message })))
    visualRef.current?.setMarkdown(doc.body || '')
  }, [])

  const applyRaw = useCallback((content: string, syncEditor = false) => {
    setRaw(content)
    if (syncEditor) {
      skipSource.current = true
      editorRef.current?.setValue(content)
    }
  }, [])

  useEffect(() => {
    applySplit(INITIAL_CONTENT)
  }, [applySplit])

  const refreshProject = useCallback(async (root: string) => {
    if (!root) return
    try {
      const proj = await InspectSRE(root)
      setSre({
        root: proj.root,
        name: proj.name,
        isSre: proj.isSre,
        kits: proj.kits || [],
      })
      const tree = await GetFileTree(root)
      setFileTree(tree || [])
      const gs = await GitRepoStatus(root)
      setGit(gs)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const probe = useCallback(async (root: string, url: string) => {
    try {
      const st = await ProbeHarness(url, root)
      setHarness(st)
    } catch {
      setHarness({ state: 'disconnected', baseUrl: url, srePath: '', project: '', message: 'Harness not reachable' })
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const has = await HasCorruption()
        if (has && window.confirm('Database corruption detected. Restore preferences from backup?')) {
          await RestoreBackup()
          window.location.reload()
          return
        }
        const themePref = await GetPreference('theme')
        const theme: ThemeMode = themePref === 'light' || themePref === 'Light' ? 'light' : 'dark'
        ui.setTheme(theme)
        const auto = await GetPreference('autoSave')
        if (typeof auto === 'boolean') ui.setAutoSave(auto)
        const hu = await GetPreference('harnessUrl')
        if (typeof hu === 'string' && hu) ui.setHarnessUrl(hu)
        const iconId = await GetPreference('git_client_icon_id')
        if (iconId) {
          const icons = await GetGitIcons()
          if (icons && icons[iconId as string]) setGitIcon(icons[iconId as string])
        }
        setGeminiOk(await HasGeminiKey())
        let root = (await GetPreference('projectRoot')) as string
        if (!root) root = await GetDefaultProjectRoot()
        if (root) {
          setProjectRoot(root)
          await refreshProject(root)
          await probe(root, (typeof hu === 'string' && hu) ? hu : 'http://127.0.0.1:8080')
        }
        const last = await GetAppState('lastFile')
        if (last) await openFile(last, true)
      } catch (e) {
        console.error(e)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', ui.theme === 'dark')
    document.documentElement.classList.toggle('light', ui.theme === 'light')
  }, [ui.theme])

  useEffect(() => {
    if (!projectRoot) return
    const t = setInterval(() => {
      refreshProject(projectRoot)
      probe(projectRoot, ui.harnessUrl)
      HasGeminiKey().then(setGeminiOk).catch(() => setGeminiOk(false))
    }, 8000)
    return () => clearInterval(t)
  }, [projectRoot, ui.harnessUrl, refreshProject, probe])

  useEffect(() => {
    if (!kit || !slug || harness.state !== 'matched') {
      setSiteUrl('')
      return
    }
    const tpl = template || kit.templates?.[0] || 'render'
    HarnessRenderURL(ui.harnessUrl, kit.ns, kit.name, tpl, slug).then(setSiteUrl).catch(() => setSiteUrl(''))
  }, [kit, slug, template, harness.state, ui.harnessUrl])

  useEffect(() => {
    if (untitled) return
    SaveAppState('lastFile', fileName)
    const t = setTimeout(() => SaveShadowFile(fileName, raw, isDirty), 1000)
    return () => clearTimeout(t)
  }, [fileName, raw, isDirty, untitled])

  useEffect(() => {
    if (!ui.autoSave || untitled || !isDirty) return
    const t = setTimeout(async () => {
      try {
        await SaveFile(fileName, raw)
        await SaveShadowFile(fileName, raw, false)
        setSavedRaw(raw)
      } catch (e) {
        console.error(e)
      }
    }, 2500)
    return () => clearTimeout(t)
  }, [raw, ui.autoSave, untitled, isDirty, fileName])

  const openFile = async (path: string, force = false) => {
    if (!force && isDirty) {
      setPendingFile(path)
      setUnsavedOpen(true)
      return
    }
    try {
      const disk = await ReadFile(path)
      let text = disk
      try {
        const shadow = await GetShadowFile(path)
        if (shadow?.isDirty && typeof shadow.content === 'string') text = shadow.content as string
      } catch { /* ignore */ }
      setSavedRaw(disk)
      applyRaw(text, true)
      await applySplit(text)
      setFileName(path)
      setUnsavedOpen(false)
      setPendingFile(null)
    } catch (e) {
      toast.error('Failed to open file')
      console.error(e)
    }
  }

  const handleSave = async () => {
    try {
      if (ui.canvasMode === 'visual' || ui.canvasMode === 'split') {
        const md = visualRef.current?.getMarkdown()
        if (md != null && md !== body) {
          const assembled = await AssembleDocument(frontMatter, md, hasFrontMatter)
          applyRaw(assembled, true)
          setBody(md)
        }
      }
      const content = rawRef.current
      let path = fileName
      if (untitled) {
        path = await SelectSaveFile()
        if (!path) return
      }
      await SaveFile(path, content)
      await SaveShadowFile(path, content, false)
      setSavedRaw(content)
      setFileName(path)
      toast.success('Saved')
      if (projectRoot) refreshProject(projectRoot)
    } catch (e) {
      toast.error('Save failed')
      console.error(e)
    }
  }

  const onSourceChange = (val: string) => {
    if (skipSource.current) {
      skipSource.current = false
      setRaw(val)
      return
    }
    setRaw(val)
  }

  useEffect(() => {
    const t = setTimeout(() => {
      SplitDocument(raw).then((doc) => {
        setHasFrontMatter(!!doc.hasFrontMatter)
        setFrontMatter(doc.frontMatter || {})
        setWarnings((doc.warnings || []).map((w) => ({ field: w.field, message: w.message })))
        if (useUiStore.getState().canvasMode !== 'visual') {
          setBody(doc.body || '')
        }
      })
    }, 180)
    return () => clearTimeout(t)
  }, [raw])

  const onVisualChange = (md: string) => {
    setBody(md)
    AssembleDocument(fmRef.current, md, hasFmRef.current).then((assembled) => applyRaw(assembled, true))
  }

  const onFrontMatterChange = (fm: Record<string, any>) => {
    setFrontMatter(fm)
    AssembleDocument(fm, bodyRef.current, true).then((assembled) => {
      applyRaw(assembled, true)
      setHasFrontMatter(true)
    })
  }

  const handleInsert = (templateText: string) => {
    editorRef.current?.insertText(templateText)
    editorRef.current?.focus()
  }

  const diagnostics = useMemo(
    () => collectDiagnostics({
      raw, body, frontMatter, warnings, slug, filePath: untitled ? undefined : fileName, project: sre, kit,
    }),
    [raw, body, frontMatter, warnings, slug, fileName, sre, kit, untitled]
  )

  const words = useMemo(() => (body || raw).trim().split(/\s+/).filter(Boolean).length, [body, raw])

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (e.key === 'F11') {
        e.preventDefault()
        const full = await WindowIsFullscreen()
        full ? WindowUnfullscreen() : WindowFullscreen()
        return
      }
      if (e.key === 'F9') {
        e.preventDefault()
        ui.setFullscreen('source')
        ui.setCanvasMode('source')
        return
      }
      if (e.key === 'F10') {
        e.preventDefault()
        ui.setFullscreen('visual')
        ui.setCanvasMode('visual')
        return
      }
      if (e.key === 'Escape' && ui.fullscreen !== 'none') {
        e.preventDefault()
        ui.setFullscreen('none')
        return
      }
      if (!mod) return
      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      } else if (e.key.toLowerCase() === 'p' && e.shiftKey) {
        e.preventDefault()
        ui.setCommandOpen(true)
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault()
        ui.setQuickOpen(true)
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ui.setCommandOpen(true)
      } else if (e.key === '\\') {
        e.preventDefault()
        const order = ['source', 'visual', 'split'] as const
        const i = order.indexOf(ui.canvasMode as typeof order[number])
        ui.setCanvasMode(order[(i + 1) % order.length])
      } else if (e.key === '1') { e.preventDefault(); ui.setCanvasMode('source') }
      else if (e.key === '2') { e.preventDefault(); ui.setCanvasMode('visual') }
      else if (e.key === '3') { e.preventDefault(); ui.setCanvasMode('split') }
      else if (e.key === '4') { e.preventDefault(); if (harness.state === 'matched') ui.setCanvasMode('site') }
      else if (e.key === ',') { e.preventDefault(); ui.setPreferencesOpen(true) }
      else if (e.key.toLowerCase() === 'f' && e.shiftKey) {
        e.preventDefault()
        ui.setSidebarTab('search')
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        ui.setLeftOpen(!useUiStore.getState().leftOpen)
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        ui.setInspectorTab('ai')
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (event.data.type === 'preview-keydown') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: event.data.key, bubbles: true }))
      } else if (event.data.type === 'open-browser' && event.data.url) {
        OpenBrowser(event.data.url)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const handleOpen = async () => {
    const path = await SelectFile()
    if (path) await openFile(path)
  }

  const handleSelectProject = async (path: string) => {
    setProjectRoot(path)
    ui.setProjectListOpen(false)
    await AddProject(path)
    await UpdateProjectLastOpened(path)
    await refreshProject(path)
    await probe(path, ui.harnessUrl)
  }

  const articles = useMemo(
    () => (sre?.kits || []).flatMap((k) => (k.articles || []).map((art) => ({ kit: k, art }))),
    [sre]
  )

  const paletteActions = [
    { id: 'save', label: 'Save', hint: 'Ctrl+S', run: () => handleSave() },
    { id: 'open', label: 'Open file', hint: 'Ctrl+O', run: () => handleOpen() },
    { id: 'projects', label: 'Open project…', run: () => ui.setProjectListOpen(true) },
    { id: 'new', label: 'New article…', run: () => ui.setNewArticleOpen(true) },
    { id: 'source', label: 'Source mode', hint: 'Ctrl+1', run: () => ui.setCanvasMode('source') },
    { id: 'visual', label: 'Visual mode', hint: 'Ctrl+2', run: () => ui.setCanvasMode('visual') },
    { id: 'split', label: 'Split preview', hint: 'Ctrl+3', run: () => ui.setCanvasMode('split') },
    { id: 'site', label: 'Site preview', hint: 'Ctrl+4', run: () => ui.setCanvasMode('site') },
    { id: 'inspector', label: 'Toggle inspector', run: () => ui.setInspectorOpen(!useUiStore.getState().inspectorOpen) },
    { id: 'prefs', label: 'Preferences', hint: 'Ctrl+,', run: () => ui.setPreferencesOpen(true) },
    { id: 'copy-slug', label: 'Copy slug', run: () => slug && navigator.clipboard.writeText(slug) },
    { id: 'copy-fcms', label: 'Copy /fcms path', run: () => kit && slug && navigator.clipboard.writeText(`/fcms/${kit.ns}/${kit.name}/${slug}`) },
    { id: 'reveal', label: 'Reveal in file manager', run: () => !untitled && RevealInFileManager(fileName) },
    { id: 'table', label: 'Insert GFM table', run: () => handleInsert('\n| A | B |\n| --- | --- |\n|  |  |\n') },
  ]

  const showCanvas = ui.fullscreen === 'none'
  const showSource = ui.fullscreen === 'source' || (showCanvas && (ui.canvasMode === 'source' || ui.canvasMode === 'split'))
  const showVisual = ui.fullscreen === 'visual' || (showCanvas && ui.canvasMode === 'visual')
  const showPreview = showCanvas && ui.canvasMode === 'split'
  const showSite = showCanvas && ui.canvasMode === 'site'

  const templates = kit?.templates?.length ? kit.templates : ['render']

  return (
    <div
      id="ndx-app-container"
      className={`flex flex-col h-screen bg-app text-foreground overflow-hidden ${ui.theme === 'dark' ? 'dark' : ''}`}
    >
      <Toaster theme={ui.theme} position="bottom-right" />
      {ui.fullscreen === 'none' && (
        <>
          <Titlebar
            projectName={sre?.name || projectRoot || 'ndxCraft'}
            isSre={!!sre?.isSre}
            kitDir={kit?.dir}
            slug={slug}
            fileName={fileName}
            isDirty={isDirty}
          />
          <Toolbar
            onInsert={handleInsert}
            onOpen={handleOpen}
            onSave={handleSave}
            onUndo={() => editorRef.current?.undo()}
            onRedo={() => editorRef.current?.redo()}
            onNewArticle={() => ui.setNewArticleOpen(true)}
            onProjects={() => ui.setProjectListOpen(true)}
            onGit={async () => {
              const ok = await OpenGitClient(projectRoot)
              if (!ok) OpenBrowser('https://desktop.github.com/')
            }}
            gitIcon={gitIcon}
            canSite={harness.state === 'matched'}
          />
        </>
      )}

      <div className="flex-1 flex overflow-hidden">
        {ui.fullscreen === 'none' && <ActivityRail diagnosticCount={diagnostics.length} />}
        <PanelGroup direction="horizontal" autoSaveId="ndx-studio">
          {ui.fullscreen === 'none' && ui.leftOpen && (
            <>
              <Panel defaultSize={20} minSize={14} maxSize={36} id="left">
                <div className="h-full bg-panel border-r border-border flex flex-col">
                  <div className="h-8 px-3 flex items-center text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    {ui.sidebarTab}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {ui.sidebarTab === 'files' && (
                      sre?.isSre ? (
                        <KitTree
                          kits={sre.kits}
                          activePath={untitled ? undefined : fileName}
                          gitFiles={git?.files}
                          onOpen={(p) => openFile(p)}
                          onNewArticle={(k) => { setNewArticleKit(k || null); ui.setNewArticleOpen(true) }}
                          onDuplicate={async (p) => {
                            const dest = await DuplicateFile(p)
                            toast.success('Duplicated')
                            refreshProject(projectRoot)
                            openFile(dest)
                          }}
                          onCopySlug={(s) => { navigator.clipboard.writeText(s); toast.success('Slug copied') }}
                          onReveal={(p) => RevealInFileManager(p)}
                        />
                      ) : (
                        <FilesFallback fileTree={fileTree} onFileClick={(p) => openFile(p)} />
                      )
                    )}
                    {ui.sidebarTab === 'outline' && (
                      <OutlinePanel
                        content={raw}
                        onContentChange={(c) => { applyRaw(c, true); applySplit(c) }}
                        onNavigate={(line) => editorRef.current?.setCursor(line, 1)}
                      />
                    )}
                    {ui.sidebarTab === 'search' && (
                      <SearchPanel root={projectRoot} onOpen={(p, line) => { openFile(p); if (line) setTimeout(() => editorRef.current?.setCursor(line, 1), 50) }} />
                    )}
                    {ui.sidebarTab === 'diagnostics' && (
                      <DiagnosticsPanel items={diagnostics} onNavigate={(line) => editorRef.current?.setCursor(line, 1)} />
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-fcms transition-colors" />
            </>
          )}

          <Panel id="center" minSize={30}>
            {untitled && !isDirty && ui.fullscreen === 'none' && ui.canvasMode !== 'visual' ? (
              <EmptyState
                isSre={!!sre?.isSre}
                onOpenProject={() => ui.setProjectListOpen(true)}
                onNewArticle={() => ui.setNewArticleOpen(true)}
              />
            ) : (
              <PanelGroup direction="horizontal" autoSaveId="ndx-canvas">
                {showSource && (
                  <Panel minSize={20} defaultSize={50}>
                    <SourceEditor
                      ref={editorRef}
                      key={fileName}
                      defaultValue={raw}
                      onChange={onSourceChange}
                      isFocused={ui.fullscreen === 'source'}
                      onToggleFocus={() => ui.setFullscreen(ui.fullscreen === 'source' ? 'none' : 'source')}
                      onCursorChange={setCursorLine}
                      theme={ui.theme}
                    />
                  </Panel>
                )}
                {showSource && showPreview && <PanelResizeHandle className="w-1 bg-border hover:bg-fcms" />}
                {showPreview && (
                  <Panel minSize={20} defaultSize={50}>
                    <LocalPreview
                      content={raw}
                      isFocused={false}
                      onToggleFocus={() => ui.setFullscreen('visual')}
                      cursorLine={cursorLine}
                    />
                  </Panel>
                )}
                {showVisual && (
                  <Panel minSize={30}>
                    <Suspense fallback={<div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading visual editor…</div>}>
                      <VisualEditor key={fileName} ref={visualRef} markdown={body} onChange={onVisualChange} />
                    </Suspense>
                  </Panel>
                )}
                {showSite && (
                  <Panel minSize={30}>
                    <SitePreview url={siteUrl} matched={harness.state === 'matched'} message={harness.message} />
                  </Panel>
                )}
              </PanelGroup>
            )}
          </Panel>

          {ui.fullscreen === 'none' && ui.inspectorOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-fcms" />
              <Panel defaultSize={22} minSize={16} maxSize={36} id="right">
                <div className="h-full bg-panel border-l border-border flex flex-col">
                  <div className="h-8 flex border-b border-border">
                    {(['frontmatter', 'ai'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => ui.setInspectorTab(tab)}
                        className={`flex-1 text-[11px] uppercase tracking-wider cursor-pointer ${ui.inspectorTab === tab ? 'text-foreground border-b-2 border-fcms' : 'text-muted-foreground'}`}
                      >
                        {tab === 'frontmatter' ? 'Frontmatter' : 'Assistant'}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {ui.inspectorTab === 'frontmatter' ? (
                      <FrontmatterInspector
                        frontMatter={frontMatter}
                        hasFrontMatter={hasFrontMatter}
                        warnings={warnings}
                        kit={kit}
                        slugFromPath={slug}
                        templates={templates}
                        template={template}
                        onTemplateChange={setTemplate}
                        onChange={onFrontMatterChange}
                      />
                    ) : (
                      <AIAssistant
                        currentContent={body || raw}
                        selection={editorRef.current?.getSelection() || ''}
                        title={String(frontMatter.title || '')}
                        agentContext={frontMatter.agent_context}
                        onApply={(text) => editorRef.current?.insertText(text)}
                      />
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {ui.fullscreen === 'none' && (
        <StatusBar
          kitDir={kit?.dir}
          slug={slug}
          chars={raw.length}
          lines={raw.split('\n').length}
          words={words}
          diagnosticCount={diagnostics.length}
          harnessState={harness.state}
          harnessMessage={harness.message}
          gitBranch={git?.branch}
          gitDirty={git?.dirty}
          geminiOk={geminiOk}
        />
      )}

      <CommandPalette
        open={ui.commandOpen || ui.quickOpen}
        mode={ui.quickOpen && !ui.commandOpen ? 'quick' : 'command'}
        articles={articles}
        actions={paletteActions}
        onClose={() => { ui.setCommandOpen(false); ui.setQuickOpen(false) }}
        onOpenFile={(p) => openFile(p)}
      />

      <NewArticleDialog
        open={ui.newArticleOpen}
        kits={sre?.kits || []}
        initialKit={newArticleKit}
        onClose={() => ui.setNewArticleOpen(false)}
        onCreate={async (k, sl, title, desc, tags) => {
          const path = await CreateArticle(k.path, sl, title, desc, tags)
          await refreshProject(projectRoot)
          await openFile(path, true)
          toast.success('Article created')
        }}
      />

      <PreferencesModal
        isOpen={ui.preferencesOpen}
        onClose={() => ui.setPreferencesOpen(false)}
        projectRoot={projectRoot}
        onProjectRootChange={async (p) => { setProjectRoot(p); await refreshProject(p) }}
        onPreferencesChanged={async () => {
          const themePref = await GetPreference('theme')
          ui.setTheme(themePref === 'light' ? 'light' : 'dark')
          const auto = await GetPreference('autoSave')
          if (typeof auto === 'boolean') ui.setAutoSave(auto)
          const hu = await GetPreference('harnessUrl')
          if (typeof hu === 'string' && hu) {
            ui.setHarnessUrl(hu)
            if (projectRoot) probe(projectRoot, hu)
          }
          const iconId = await GetPreference('git_client_icon_id')
          if (iconId) {
            const icons = await GetGitIcons()
            setGitIcon(icons?.[iconId as string])
          }
        }}
      />

      <ProjectListModal
        isOpen={ui.projectListOpen}
        onClose={() => ui.setProjectListOpen(false)}
        onSelectProject={handleSelectProject}
      />

      <Dialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>Save {fileName} before opening another file?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUnsavedOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!untitled) await ClearShadowFile(fileName)
              setSavedRaw(raw)
              if (pendingFile) openFile(pendingFile, true)
            }}>Discard</Button>
            <Button onClick={async () => { await handleSave(); if (pendingFile) openFile(pendingFile, true) }}>Save & open</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
