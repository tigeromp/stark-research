import { Trash2, ArrowRight, Quote, StickyNote, Tag } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import { formatMLAInText } from '../lib/mla'
import { SourceInputSection } from './SourceInputSection'
import { CategoryPanel, CategoryBadge } from './CategoryPanel'

export function CitationPanel() {
  const {
    project,
    selectedCitationId,
    selectCitation,
    removeCitation,
    toggleCitationCategory,
    updateCitation,
  } = useResearchStore()

  const selected = project.citations.find((c) => c.id === selectedCitationId)

  return (
    <aside className="flex flex-col h-full w-full bg-stark-900 border-r border-white/[0.08] min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        <SourceInputSection />

        <div className="border-t border-white/[0.06] pt-4">
          <CategoryPanel />
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <h3 className="section-label mb-3">
            Sources · {project.citations.length}
          </h3>

          {project.citations.length === 0 ? (
            <p className="text-xs text-[#9c9590] text-center py-6">
              No sources yet
            </p>
          ) : (
            <div className="space-y-2">
              {project.citations.map((citation) => {
                const isSelected = citation.id === selectedCitationId

                return (
                  <button
                    key={citation.id}
                    onClick={() => selectCitation(citation.id)}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${
                      isSelected
                        ? 'bg-arc-500/10 border border-arc-500/30'
                        : 'bg-stark-950/50 border border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#f4f1ea] truncate">
                          {citation.author || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-[#9c9590] truncate">{citation.title}</p>

                        <div className="flex flex-col gap-1.5 mt-2">
                          {citation.notes?.trim() && (
                            <span
                              className="notes-badge inline-flex w-fit items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border"
                              title="Private notes saved (not shown on map)"
                            >
                              <StickyNote size={9} />
                              PRIVATE NOTES
                            </span>
                          )}
                          {citation.categoryIds.length > 0 ? (
                            <span className="inline-flex flex-wrap gap-1">
                              {citation.categoryIds.map((catId) => (
                                <CategoryBadge key={catId} categoryId={catId} />
                              ))}
                            </span>
                          ) : (
                            <span className="inline-block w-fit text-[9px] font-mono text-[#9c9590] px-1.5 py-0.5 rounded border border-white/[0.08]">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCitation(citation.id)
                        }}
                        className="text-[#9c9590] hover:text-red-400 transition-colors p-1 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="shrink-0 flex flex-col border-t border-white/[0.08] bg-stark-950 max-h-[min(62%,28rem)] min-h-0">
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-white/[0.06]">
            <h4 className="section-label mb-1">Source detail</h4>
            <p className="text-sm font-medium text-[#f4f1ea] truncate">{selected.author}</p>
            <p className="text-xs text-[#9c9590] truncate">{selected.title}</p>
            {selected.quote && (
              <div className="mt-2 flex gap-2 text-xs text-arc-400/80 italic">
                <Quote size={12} className="shrink-0 mt-0.5" />
                <span className="line-clamp-2">"{selected.quote}"</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            {/* Private notes — warm amber zone */}
            <div className="notes-zone rounded-xl p-3">
              <span className="notes-zone-label text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                <StickyNote size={10} />
                Private notes
              </span>
              <p className="text-[9px] text-[#9c9590] mt-0.5 mb-2">
                Hidden on the map · helps suggest & match categories
              </p>
              <textarea
                value={selected.notes ?? ''}
                onChange={(e) => updateCitation(selected.id, { notes: e.target.value })}
                placeholder="Long summaries, themes, quotes, how this source supports your argument..."
                className="notes-input w-full min-h-[9rem] max-h-[14rem] rounded-lg px-3 py-2 text-xs resize-y leading-relaxed"
              />
              {(selected.notes?.length ?? 0) > 0 && (
                <p className="text-[9px] font-mono text-[#9c9590] mt-1.5">
                  {selected.notes!.length.toLocaleString()} characters
                </p>
              )}
            </div>

            <p className="text-[10px] font-mono text-[#9c9590] px-0.5">
              In-text: {formatMLAInText(selected, selected.pages?.split('-')[0])}
            </p>

            {/* Categories — cool indigo zone, separate from notes */}
            <div className="categories-zone rounded-xl p-3">
              <p className="categories-zone-label text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={10} />
                Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.categories.length === 0 ? (
                  <p className="text-[10px] text-[#9c9590]">Create a category above first</p>
                ) : (
                  project.categories.map((cat) => {
                    const active = selected.categoryIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCitationCategory(selected.id, cat.id)}
                        className={`text-[9px] font-mono px-2.5 py-1.5 rounded-md transition-all ${
                          active
                            ? 'text-white shadow-sm'
                            : 'text-[#9c9590] hover:text-[#f4f1ea] bg-stark-950'
                        }`}
                        style={{
                          background: active ? `${cat.color}55` : undefined,
                          border: `1px solid ${active ? cat.color : 'rgba(255,248,240,0.1)'}`,
                        }}
                      >
                        <ArrowRight size={8} className="inline mr-1 opacity-70" />
                        {cat.label}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
