import { useMemo, useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  FileText,
  Copy,
  Check,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import {
  sortOutlineSections,
  countWords,
  outlineWordCount,
  buildOutlineExport,
  buildDraftPreview,
} from '../lib/outline'
import { formatMLAInText } from '../lib/mla'

export function OutlinePanel() {
  const {
    project,
    selectedOutlineSectionId,
    selectOutlineSection,
    addOutlineSection,
    removeOutlineSection,
    updateOutlineSection,
    moveOutlineSection,
    toggleOutlineCitation,
    linkCategoryToOutlineSection,
    selectCitation,
    setActivePanel,
  } = useResearchStore()

  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')

  const sections = useMemo(
    () => sortOutlineSections(project.outline),
    [project.outline]
  )

  const activeId = selectedOutlineSectionId ?? sections[0]?.id ?? null
  const activeSection = sections.find((s) => s.id === activeId)

  useEffect(() => {
    if (!selectedOutlineSectionId && sections[0]) {
      selectOutlineSection(sections[0].id)
    }
  }, [selectedOutlineSectionId, sections, selectOutlineSection])

  const totalWords = outlineWordCount(sections)
  const draftPreview = useMemo(
    () => buildDraftPreview(project, sections),
    [project, sections]
  )

  const handleCopyDraft = async () => {
    await navigator.clipboard.writeText(buildOutlineExport(project))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddSection = () => {
    const title = newSectionTitle.trim() || 'New Section'
    addOutlineSection(title)
    setNewSectionTitle('')
  }

  if (sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-panel rounded-xl p-10 text-center max-w-md">
          <FileText size={32} className="mx-auto text-arc-500/50 mb-4" />
          <p className="font-display text-sm text-arc-300 tracking-wider mb-2">PAPER OUTLINE</p>
          <p className="text-xs text-slate-500 mb-4">Structure your paper and attach sources to each section.</p>
          <button
            type="button"
            onClick={() => addOutlineSection('Introduction')}
            className="hud-button hud-button-primary px-4 py-2 rounded-lg text-xs"
          >
            Start Outline
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Section list */}
      <aside className="w-56 shrink-0 border-r border-arc-500/20 glass-panel flex flex-col">
        <div className="p-3 border-b border-arc-500/15">
          <h2 className="font-display text-[10px] tracking-[0.25em] text-arc-400">OUTLINE</h2>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">{totalWords} words total</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sections.map((section) => {
            const isActive = section.id === activeId
            const words = countWords(section.content)
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectOutlineSection(section.id)}
                className={`w-full text-left rounded-lg px-2.5 py-2 transition-all ${
                  isActive
                    ? 'bg-arc-500/15 border border-arc-500/40'
                    : 'border border-transparent hover:border-arc-500/20 hover:bg-stark-800/40'
                }`}
              >
                <p className="text-xs font-semibold text-slate-200 truncate">{section.title}</p>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                  {words}w · {section.citationIds.length} source{section.citationIds.length !== 1 ? 's' : ''}
                </p>
              </button>
            )
          })}
        </div>

        <div className="p-2 border-t border-arc-500/15 space-y-2">
          <div className="flex gap-1">
            <input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              placeholder="Section name..."
              className="flex-1 min-w-0 rounded px-2 py-1.5 text-[10px] hud-input"
            />
            <button
              type="button"
              onClick={handleAddSection}
              className="p-1.5 rounded hud-button text-arc-400"
              title="Add section"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Section editor */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {activeSection ? (
          <>
            <div className="shrink-0 px-6 py-3 border-b border-arc-500/15 flex items-center justify-between gap-4 glass-panel">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <input
                  value={activeSection.title}
                  onChange={(e) =>
                    updateOutlineSection(activeSection.id, { title: e.target.value })
                  }
                  className="flex-1 min-w-0 bg-transparent font-display text-sm font-bold text-arc-200 tracking-wider focus:outline-none border-b border-transparent focus:border-arc-500/40 pb-0.5"
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveOutlineSection(activeSection.id, 'up')}
                    className="p-1 text-slate-600 hover:text-arc-400"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOutlineSection(activeSection.id, 'down')}
                    className="p-1 text-slate-600 hover:text-arc-400"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sections.length <= 1) return
                      if (confirm(`Delete "${activeSection.title}"?`)) {
                        removeOutlineSection(activeSection.id)
                      }
                    }}
                    className="p-1 text-slate-600 hover:text-red-400 ml-1"
                    title="Delete section"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-600">
                  {countWords(activeSection.content)} words
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="hud-button px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1"
                >
                  {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPreview ? 'Hide draft' : 'Draft preview'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="hud-button px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy outline'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                {project.thesis && (
                  <div className="glass-panel rounded-lg px-4 py-3 border border-arc-500/20">
                    <p className="text-[9px] font-mono text-arc-500 tracking-wider mb-1">THESIS / QUESTION</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{project.thesis}</p>
                  </div>
                )}

                <label className="block">
                  <span className="text-[10px] font-mono text-arc-500 tracking-wider">SECTION DRAFT</span>
                  <textarea
                    value={activeSection.content}
                    onChange={(e) =>
                      updateOutlineSection(activeSection.id, { content: e.target.value })
                    }
                    placeholder="Write this section — arguments, synthesis, transitions. Sources you link below can inform your draft."
                    className="w-full mt-2 min-h-[220px] rounded-xl px-4 py-3 text-sm hud-input resize-y leading-relaxed"
                  />
                </label>

                {/* Linked sources */}
                <div className="glass-panel rounded-xl p-4 border border-arc-500/15">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-[10px] tracking-[0.2em] text-arc-400 flex items-center gap-2">
                      <BookOpen size={12} />
                      SOURCES FOR THIS SECTION ({activeSection.citationIds.length})
                    </h3>
                    {project.citations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActivePanel('citations')}
                        className="text-[9px] font-mono text-arc-500 hover:text-arc-300"
                      >
                        Open mind map →
                      </button>
                    )}
                  </div>

                  {project.categories.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-mono text-slate-600 mb-1.5 flex items-center gap-1">
                        <Layers size={10} />
                        Add all from topic
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              linkCategoryToOutlineSection(activeSection.id, cat.id)
                            }
                            className="text-[9px] font-mono px-2 py-1 rounded border transition-all hover:opacity-90"
                            style={{
                              borderColor: `${cat.color}40`,
                              color: cat.color,
                              background: `${cat.color}10`,
                            }}
                          >
                            + {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.citations.length === 0 ? (
                    <p className="text-xs text-slate-600 font-mono text-center py-4">
                      No sources yet — add sources in the sidebar
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {project.citations.map((citation) => {
                        const linked = activeSection.citationIds.includes(citation.id)
                        return (
                          <button
                            key={citation.id}
                            type="button"
                            onClick={() =>
                              toggleOutlineCitation(activeSection.id, citation.id)
                            }
                            className={`w-full text-left rounded-lg px-3 py-2 transition-all flex items-start gap-2 ${
                              linked
                                ? 'bg-arc-500/12 border border-arc-500/35'
                                : 'bg-stark-800/30 border border-transparent hover:border-arc-500/15'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-3 h-3 rounded-sm border shrink-0 flex items-center justify-center text-[8px] ${
                                linked
                                  ? 'bg-arc-500/30 border-arc-400/50 text-arc-300'
                                  : 'border-slate-600'
                              }`}
                            >
                              {linked ? '✓' : ''}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-200 truncate">
                                {citation.author || 'Unknown'}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{citation.title}</p>
                              {linked && (
                                <p className="text-[9px] font-mono text-arc-500/70 mt-0.5">
                                  {formatMLAInText(citation)}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {activeSection.citationIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-arc-500/10">
                      <p className="text-[9px] font-mono text-slate-600 mb-2">LINKED IN THIS SECTION</p>
                      <div className="flex flex-wrap gap-1">
                        {activeSection.citationIds.map((id) => {
                          const c = project.citations.find((cite) => cite.id === id)
                          if (!c) return null
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                selectCitation(id)
                                setActivePanel('citations')
                              }}
                              className="text-[9px] font-mono px-2 py-1 rounded bg-arc-500/10 text-arc-400 border border-arc-500/25 hover:bg-arc-500/20"
                            >
                              {c.author.split(',')[0] || c.author}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {showPreview && (
                  <div className="glass-panel rounded-xl p-4 border border-arc-500/20">
                    <h3 className="font-display text-[10px] tracking-[0.2em] text-arc-400 mb-3">
                      FULL DRAFT PREVIEW
                    </h3>
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-body leading-relaxed max-h-64 overflow-y-auto">
                      {draftPreview || '(Start writing sections to see your draft)'}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-sm">
            Select a section
          </div>
        )}
      </div>
    </div>
  )
}
