import { ChevronDown, ChevronRight } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import { BibliographyUpload } from './BibliographyUpload'
import { CitationForm } from './CitationForm'

export function SourceInputSection() {
  const { sourceInputOpen, toggleSourceInput, setSourceInputOpen, project } = useResearchStore()

  return (
    <div className="rounded-xl border border-arc-500/20 overflow-hidden">
      <button
        type="button"
        onClick={toggleSourceInput}
        aria-expanded={sourceInputOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-arc-500/5 hover:bg-arc-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {sourceInputOpen ? (
            <ChevronDown size={14} className="text-arc-500" />
          ) : (
            <ChevronRight size={14} className="text-arc-500" />
          )}
          <span className="font-display text-xs tracking-[0.15em] text-arc-400">ADD SOURCES</span>
        </div>
        {!sourceInputOpen && project.citations.length > 0 && (
          <span className="text-[10px] font-mono text-slate-600">{project.citations.length} indexed</span>
        )}
      </button>

      {sourceInputOpen && (
        <div className="p-3 space-y-4 border-t border-arc-500/15 animate-fade-in-up">
          <BibliographyUpload onImported={() => setSourceInputOpen(false)} />
          <div className="border-t border-arc-500/10 pt-3">
            <p className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Or add manually</p>
            <CitationForm onAdded={() => setSourceInputOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
