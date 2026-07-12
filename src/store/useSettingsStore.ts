import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TextSize = 'small' | 'medium' | 'large' | 'xlarge'
export type PanelWidth = 'narrow' | 'normal' | 'wide'

export interface AppSettings {
  textSize: TextSize
  panelWidth: PanelWidth
  sidebarOpen: boolean
  showAnimations: boolean
  showMinimap: boolean
  showGrid: boolean
  compactMode: boolean
  autoFitMap: boolean
}

interface SettingsState extends AppSettings {
  settingsOpen: boolean
  setTextSize: (size: TextSize) => void
  setPanelWidth: (width: PanelWidth) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setShowAnimations: (value: boolean) => void
  setShowMinimap: (value: boolean) => void
  setShowGrid: (value: boolean) => void
  setCompactMode: (value: boolean) => void
  setAutoFitMap: (value: boolean) => void
  toggleSettings: () => void
  setSettingsOpen: (open: boolean) => void
  resetSettings: () => void
}

export const TEXT_SIZE_SCALE: Record<TextSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
  xlarge: 1.25,
}

export const PANEL_WIDTH_PX: Record<PanelWidth, number> = {
  narrow: 280,
  normal: 320,
  wide: 380,
}

const DEFAULT_SETTINGS: AppSettings = {
  textSize: 'medium',
  panelWidth: 'normal',
  sidebarOpen: true,
  showAnimations: true,
  showMinimap: true,
  showGrid: true,
  compactMode: false,
  autoFitMap: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      settingsOpen: false,

      setTextSize: (textSize) => set({ textSize }),
      setPanelWidth: (panelWidth) => set({ panelWidth }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setShowAnimations: (showAnimations) => set({ showAnimations }),
      setShowMinimap: (showMinimap) => set({ showMinimap }),
      setShowGrid: (showGrid) => set({ showGrid }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setAutoFitMap: (autoFitMap) => set({ autoFitMap }),
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    { name: 'arc-settings' }
  )
)
