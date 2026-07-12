import { useState } from 'react'
import {
  Plus,
  FileText,
  Trash2,
  Check,
  Pencil,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'

function formatPaperDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PapersPanel() {
  const {
    projects,
    activeProjectId,
    createPaper,
    switchPaper,
    deletePaper,
    renamePaper,
    setActivePanel,
  } = useResearchStore()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)

  const handleCreate = () => {
    const name = newName.trim() || 'Untitled Research'
    createPaper(name)
    setNewName('')
  }

  const startRename = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const commitRename = (id: string) => {
    renamePaper(id, editName)
    setEditingId(null)
    setEditName('')
  }

  const handleOpen = (id: string) => {
    switchPaper(id)
    setActivePanel('citations')
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-[#f4f1ea] tracking-tight">
            Papers
          </h2>
          <p className="mt-1.5 text-sm text-[#9c9590] leading-relaxed">
            Create separate research projects for each paper. Switch between them anytime —
            sources, topics, and outlines stay isolated per paper.
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New paper title…"
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#f4f1ea] text-sm placeholder:text-[#6b6560] focus:outline-none focus:border-arc-500/40"
          />
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-arc-500/20 border border-arc-500/30 text-arc-300 text-sm font-medium hover:bg-arc-500/30 transition-colors"
          >
            <Plus size={16} />
            New paper
          </button>
        </div>

        <div className="space-y-3">
          {sorted.map((paper) => {
            const isActive = paper.id === activeProjectId
            const isEditing = editingId === paper.id

            return (
              <article
                key={paper.id}
                className={`group rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-arc-500/35 bg-arc-500/[0.06]'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-arc-500/20 text-arc-300'
                        : 'bg-white/[0.04] text-[#9c9590]'
                    }`}
                  >
                    <FileText size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(paper.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="flex-1 px-3 py-1.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[#f4f1ea] text-sm focus:outline-none focus:border-arc-500/40"
                        />
                        <button
                          onClick={() => commitRename(paper.id)}
                          className="p-1.5 rounded-md text-arc-300 hover:bg-arc-500/15"
                          title="Save name"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#f4f1ea] truncate">{paper.name}</h3>
                        {isActive && (
                          <span className="shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-arc-500/20 text-arc-300 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    )}

                    <p className="mt-1 text-xs text-[#9c9590] line-clamp-2">
                      {paper.thesis.trim() || 'No thesis or question yet'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6b6560]">
                      <span>
                        {paper.citations.length} source
                        {paper.citations.length !== 1 ? 's' : ''}
                      </span>
                      <span>{paper.categories.length} topics</span>
                      <span>Updated {formatPaperDate(paper.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    {!isEditing && (
                      <button
                        onClick={() => startRename(paper.id, paper.name)}
                        className="p-2 rounded-lg text-[#9c9590] hover:text-[#f4f1ea] hover:bg-white/[0.06]"
                        title="Rename"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {projects.length > 1 && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${paper.name}"? This cannot be undone.`
                            )
                          ) {
                            deletePaper(paper.id)
                          }
                        }}
                        className="p-2 rounded-lg text-[#9c9590] hover:text-red-400 hover:bg-red-500/10"
                        title="Delete paper"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {!isActive && (
                      <button
                        onClick={() => handleOpen(paper.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-arc-300 hover:bg-arc-500/15 border border-transparent hover:border-arc-500/25"
                      >
                        Open
                        <ArrowRight size={14} />
                      </button>
                    )}
                    {isActive && (
                      <button
                        onClick={() => setActivePanel('citations')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-arc-300 bg-arc-500/10 border border-arc-500/20"
                      >
                        <BookOpen size={14} />
                        Workspace
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
