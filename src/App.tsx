import { Header } from './components/Header'
import { HUDBackground } from './components/HUDBackground'
import { CollapsibleSidebar } from './components/CollapsibleSidebar'
import { CitationPanel } from './components/CitationPanel'
import { MindMap } from './components/MindMap'
import { OutlinePanel } from './components/OutlinePanel'
import { WorksCitedPanel } from './components/WorksCitedPanel'
import { ExportPanel } from './components/ExportPanel'
import { PapersPanel } from './components/PapersPanel'
import { SettingsApplier } from './components/SettingsApplier'
import { SettingsButton, SettingsPanel } from './components/SettingsPanel'
import { useResearchStore } from './store/useResearchStore'

function App() {
  const activePanel = useResearchStore((s) => s.activePanel)

  return (
    <div className="relative h-full flex flex-col">
      <SettingsApplier />
      <HUDBackground />
      <Header />

      <main className="relative z-10 flex flex-1 overflow-hidden">
        <CollapsibleSidebar>
          <CitationPanel />
        </CollapsibleSidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activePanel === 'citations' && <MindMap />}
          {activePanel === 'outline' && <OutlinePanel />}
          {activePanel === 'papers' && <PapersPanel />}
          {activePanel === 'works-cited' && <WorksCitedPanel />}
          {activePanel === 'export' && <ExportPanel />}
        </div>
      </main>

      <SettingsButton />
      <SettingsPanel />
    </div>
  )
}

export default App
