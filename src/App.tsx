import { useEffect, useState } from 'react'
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
import { AuthPanel } from './components/AuthPanel'
import { useResearchStore } from './store/useResearchStore'
import { useAuthStore } from './store/useAuthStore'
import { isSupabaseConfigured } from './lib/supabase'

function App() {
  const activePanel = useResearchStore((s) => s.activePanel)
  const { user, loading, initialize: initializeAuth } = useAuthStore()
  const { initializeSync } = useResearchStore()
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Initialize auth
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // Initialize sync when user logs in
    if (user && isSupabaseConfigured()) {
      initializeSync(user.id)
    }
  }, [user, initializeSync])

  // Show auth panel on first visit if Supabase is configured
  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured()) {
      const hasSeenAuth = localStorage.getItem('arc-seen-auth')
      if (!hasSeenAuth) {
        setShowAuth(true)
        localStorage.setItem('arc-seen-auth', 'true')
      }
    }
  }, [user, loading])

  return (
    <div className="relative h-full flex flex-col">
      <SettingsApplier />
      <HUDBackground />
      <Header onAuthClick={() => setShowAuth(true)} />

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
      
      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default App
