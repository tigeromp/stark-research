import { useSettingsStore } from '../store/useSettingsStore'

export function HUDBackground() {
  const { showGrid } = useSettingsStore()

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212, 100, 74, 0.07), transparent),
            linear-gradient(180deg, #100f0e 0%, #1a1917 50%, #100f0e 100%)
          `,
        }}
      />

      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(244, 241, 234, 0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(244, 241, 234, 0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      )}
    </div>
  )
}
