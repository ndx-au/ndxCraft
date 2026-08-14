import { create } from 'zustand'
import type { CanvasMode, FullscreenMode, InspectorTab, SidebarTab, ThemeMode } from '../types'

interface UiState {
  theme: ThemeMode
  canvasMode: CanvasMode
  sidebarTab: SidebarTab
  inspectorTab: InspectorTab
  leftOpen: boolean
  inspectorOpen: boolean
  commandOpen: boolean
  quickOpen: boolean
  newArticleOpen: boolean
  preferencesOpen: boolean
  projectListOpen: boolean
  fullscreen: FullscreenMode
  autoSave: boolean
  harnessUrl: string
  setTheme: (theme: ThemeMode) => void
  setCanvasMode: (mode: CanvasMode) => void
  setSidebarTab: (tab: SidebarTab) => void
  setInspectorTab: (tab: InspectorTab) => void
  setLeftOpen: (open: boolean) => void
  setInspectorOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
  setQuickOpen: (open: boolean) => void
  setNewArticleOpen: (open: boolean) => void
  setPreferencesOpen: (open: boolean) => void
  setProjectListOpen: (open: boolean) => void
  setFullscreen: (mode: FullscreenMode) => void
  setAutoSave: (v: boolean) => void
  setHarnessUrl: (url: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  canvasMode: 'split',
  sidebarTab: 'files',
  inspectorTab: 'frontmatter',
  leftOpen: true,
  inspectorOpen: true,
  commandOpen: false,
  quickOpen: false,
  newArticleOpen: false,
  preferencesOpen: false,
  projectListOpen: false,
  fullscreen: 'none',
  autoSave: true,
  harnessUrl: 'http://127.0.0.1:8080',
  setTheme: (theme) => set({ theme }),
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab, leftOpen: true }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab, inspectorOpen: true }),
  setLeftOpen: (leftOpen) => set({ leftOpen }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setQuickOpen: (quickOpen) => set({ quickOpen }),
  setNewArticleOpen: (newArticleOpen) => set({ newArticleOpen }),
  setPreferencesOpen: (preferencesOpen) => set({ preferencesOpen }),
  setProjectListOpen: (projectListOpen) => set({ projectListOpen }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  setAutoSave: (autoSave) => set({ autoSave }),
  setHarnessUrl: (harnessUrl) => set({ harnessUrl }),
}))
