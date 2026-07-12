import { BookOpen, FileText, Download, PanelLeft, ListTree, Layers, Library } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import { useSettingsStore } from '../store/useSettingsStore'

export function Header() {
  const { project, activePanel, setActivePanel, projects } = useResearchStore()
  const { sidebarOpen, toggleSidebar } = useSettingsStore()
  const citationCount = project.citations.length

  const tabs = [
    { id: 'citations' as const, label: 'Mind Map', icon: BookOpen },
    { id: 'outline' as const, label: 'Outline', icon: ListTree },
    { id: 'papers' as const, label: 'Papers', icon: Library },
    { id: 'works-cited' as const, label: 'Works Cited', icon: FileText },
    { id: 'export' as const, label: 'Export', icon: Download },
  ]

  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-2.5 border-b border-white/[0.08] bg-stark-900/95 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          className={`p-2 rounded-lg transition-colors ${
            sidebarOpen
              ? 'text-arc-400 bg-arc-500/10'
              : 'text-[#9c9590] hover:text-[#f4f1ea] hover:bg-white/[0.04]'
          }`}
        >
          <PanelLeft size={18} />
        </button>

        <button
          onClick={() => setActivePanel('papers')}
          className="flex items-center gap-3 text-left rounded-lg px-1 py-0.5 -mx-1 hover:bg-white/[0.04] transition-colors"
          title="Manage papers"
        >
          <div className="w-9 h-9 rounded-lg bg-arc-500/15 border border-arc-500/25 flex items-center justify-center">
            <Layers size={18} className="text-arc-400" />
          </div>
          <div>
            <h1 className="font-display text-base font-semibold text-[#f4f1ea] tracking-tight">
              A.R.C.
            </h1>
            <p className="text-[11px] text-[#9c9590]">
              {project.name !== 'Untitled Research' ? project.name : 'Research workspace'}
              {projects.length > 1 ? ` · ${projects.length} papers` : ''}
            </p>
          </div>
        </button>
      </div>

      <nav className="flex items-center gap-0.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={`nav-tab flex items-center gap-2 px-3.5 py-2 text-sm ${
              activePanel === id ? 'nav-tab-active' : ''
            }`}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="text-xs text-[#9c9590] tabular-nums">
        {citationCount} source{citationCount !== 1 ? 's' : ''}
      </div>
    </header>
  )
}
