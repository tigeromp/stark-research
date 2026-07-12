import { X, RotateCcw, Info } from 'lucide-react'
import {
  useSettingsStore,
  type TextSize,
  type PanelWidth,
} from '../store/useSettingsStore'

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="py-3 border-b border-arc-500/10 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200">{label}</p>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-arc-500/25 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1.5 text-[10px] font-mono tracking-wide transition-all ${
            value === opt.value
              ? 'bg-arc-500/25 text-arc-300'
              : 'text-slate-500 hover:text-slate-300 hover:bg-arc-500/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? 'bg-arc-500/50' : 'bg-stark-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

export function SettingsButton() {
  const { settingsOpen, toggleSettings } = useSettingsStore()

  return (
    <button
      onClick={toggleSettings}
      className={`fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg border ${
        settingsOpen
          ? 'bg-arc-500 text-white border-arc-400 scale-95'
          : 'bg-stark-800 text-[#9c9590] border-white/[0.1] hover:text-[#f4f1ea] hover:border-white/[0.18]'
      }`}
      title="Settings"
      aria-label="Open settings"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  )
}

export function SettingsPanel() {
  const {
    settingsOpen,
    setSettingsOpen,
    textSize,
    panelWidth,
    showAnimations,
    showMinimap,
    showGrid,
    compactMode,
    autoFitMap,
    setTextSize,
    setPanelWidth,
    setShowAnimations,
    setShowMinimap,
    setShowGrid,
    setCompactMode,
    setAutoFitMap,
    resetSettings,
  } = useSettingsStore()

  if (!settingsOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />

      <aside className="fixed top-0 right-0 bottom-0 z-50 w-80 glass-panel border-l border-arc-500/25 flex flex-col animate-fade-in-up shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-arc-500/20">
          <div>
            <h2 className="font-display text-sm font-bold tracking-widest text-arc-300">SETTINGS</h2>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Customize your workspace</p>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-arc-500/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <p className="text-[10px] font-mono text-arc-500/60 tracking-widest uppercase py-2">Display</p>

          <SettingRow label="Text Size" description="Adjust reading size across the app">
            <SegmentedControl<TextSize>
              value={textSize}
              onChange={setTextSize}
              options={[
                { value: 'small', label: 'S' },
                { value: 'medium', label: 'M' },
                { value: 'large', label: 'L' },
                { value: 'xlarge', label: 'XL' },
              ]}
            />
          </SettingRow>

          <SettingRow label="Sidebar Width" description="Source panel width">
            <SegmentedControl<PanelWidth>
              value={panelWidth}
              onChange={setPanelWidth}
              options={[
                { value: 'narrow', label: 'N' },
                { value: 'normal', label: 'M' },
                { value: 'wide', label: 'W' },
              ]}
            />
          </SettingRow>

          <SettingRow label="Compact Mode" description="Tighter spacing in lists and panels">
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </SettingRow>

          <p className="text-[10px] font-mono text-arc-500/60 tracking-widest uppercase py-2 mt-2">Mind Map</p>

          <SettingRow label="Show Minimap" description="Navigation overview in corner">
            <Toggle checked={showMinimap} onChange={setShowMinimap} />
          </SettingRow>

          <SettingRow label="Background Grid" description="HUD grid and scan effects">
            <Toggle checked={showGrid} onChange={setShowGrid} />
          </SettingRow>

          <SettingRow label="Animations" description="Glow, spin, and motion effects">
            <Toggle checked={showAnimations} onChange={setShowAnimations} />
          </SettingRow>

          <SettingRow label="Auto-fit Map" description="Fit view when sources change">
            <Toggle checked={autoFitMap} onChange={setAutoFitMap} />
          </SettingRow>

          <div className="mt-4 rounded-lg bg-arc-500/5 border border-arc-500/15 p-3">
            <div className="flex gap-2 text-arc-400">
              <Info size={14} className="shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upload bibliographies with multiple sources via .txt, .bib, .ris, or .csv.
                Drag files onto the upload zone or paste a full works-cited list.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-arc-500/20">
          <button
            onClick={resetSettings}
            className="w-full py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-stark-600 hover:border-arc-500/30 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
          <p className="text-center text-[10px] font-mono text-slate-600 mt-3">A.R.C. v1.0.0</p>
        </div>
      </aside>
    </>
  )
}
