import { useEffect, useRef, useState } from 'react'
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

function waitForHydration(): Promise<void> {
  const api = useResearchStore.persist
  if (api.hasHydrated()) return Promise.resolve()
  return new Promise((resolve) => {
    const unsub = api.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}

function App() {
  const activePanel = useResearchStore((s) => s.activePanel)
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const loading = useAuthStore((s) => s.loading)
  const initializeAuth = useAuthStore((s) => s.initialize)
  const initializeSync = useResearchStore((s) => s.initializeSync)
  const [showAuth, setShowAuth] = useState(false)
  const syncingForUser = useRef<string | null>(null)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return
    if (syncingForUser.current === userId) return

    let cancelled = false
    ;(async () => {
      await waitForHydration()
      if (cancelled) return
      syncingForUser.current = userId
      await initializeSync(userId)
    })()

    return () => {
      cancelled = true
    }
  }, [userId, initializeSync])

  useEffect(() => {
    if (!userId) syncingForUser.current = null
  }, [userId])

  useEffect(() => {
    if (!loading && !userId && isSupabaseConfigured()) {
      const hasSeenAuth = localStorage.getItem('arc-seen-auth')
      if (!hasSeenAuth) {
        setShowAuth(true)
        localStorage.setItem('arc-seen-auth', 'true')
      }
    }
  }, [userId, loading])

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
