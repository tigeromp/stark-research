import { useEffect } from 'react'
import { useSettingsStore, TEXT_SIZE_SCALE, PANEL_WIDTH_PX } from '../store/useSettingsStore'

export function SettingsApplier() {
  const { textSize, panelWidth, showAnimations, compactMode } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--arc-text-scale', String(TEXT_SIZE_SCALE[textSize]))
    root.style.setProperty('--arc-panel-width', `${PANEL_WIDTH_PX[panelWidth]}px`)
    root.style.fontSize = `${16 * TEXT_SIZE_SCALE[textSize]}px`

    if (!showAnimations) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    if (compactMode) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }
  }, [textSize, panelWidth, showAnimations, compactMode])

  return null
}
