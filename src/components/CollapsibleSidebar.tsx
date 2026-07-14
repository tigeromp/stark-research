import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'

export function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useSettingsStore()

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <div className="relative flex h-full shrink-0">
        <aside
          className={`h-full overflow-hidden transition-[width] duration-300 ease-in-out md:relative fixed left-0 top-0 z-50 ${
            sidebarOpen ? 'md:relative' : ''
          }`}
          style={{ width: sidebarOpen ? 'var(--arc-panel-width, 320px)' : 0 }}
          aria-hidden={!sidebarOpen}
        >
          <div className="h-full bg-stark-900" style={{ width: 'var(--arc-panel-width, 320px)' }}>
            {children}
          </div>
        </aside>

        <button
          type="button"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`absolute top-1/2 -translate-y-1/2 z-30 w-6 h-12 flex items-center justify-center rounded-r-lg bg-stark-800 border border-l-0 border-white/[0.08] text-[#9c9590] hover:text-[#f4f1ea] transition-all duration-300 ${
            sidebarOpen ? 'left-full -ml-px' : 'left-0'
          }`}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>
    </>
  )
}
