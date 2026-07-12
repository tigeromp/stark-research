import { useMemo, useState } from 'react'
import { Plus, Sparkles, Trash2, Link2 } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import { suggestCategoriesFromCitations } from '../lib/categorySuggestions'
import { countCitationsInCategory, getCategoryById } from '../lib/categories'

export function CategoryPanel() {
  const { project, addCategory, removeCategory, selectCategory, selectedCategoryId } =
    useResearchStore()
  const [customLabel, setCustomLabel] = useState('')

  const suggestions = useMemo(
    () =>
      suggestCategoriesFromCitations(
        project.citations,
        project.categories.map((c) => c.label)
      ),
    [project.citations, project.categories]
  )

  const handleCreate = () => {
    const label = customLabel.trim()
    if (!label) return
    addCategory(label, { keywords: [label.toLowerCase()] })
    setCustomLabel('')
  }

  return (
    <div className="space-y-3">
      <h3 className="section-label">Categories</h3>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-arc-500/70 flex items-center gap-1">
            <Sparkles size={10} className="text-arc-400" />
            SUGGESTED FROM TITLES & NOTES
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.keyword}
                onClick={() =>
                  addCategory(s.label, {
                    keywords: [s.keyword],
                    isSuggested: true,
                  })
                }
                className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-arc-500/25 bg-arc-500/8 text-arc-300 hover:bg-arc-500/15 hover:border-arc-400/35 transition-all"
                title={`${s.matchingSources} source${s.matchingSources !== 1 ? 's' : ''} mention "${s.keyword}" in titles or notes`}
              >
                + {s.label}
                <span className="text-slate-600 ml-1">({s.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New category name..."
          className="flex-1 rounded-lg px-3 py-2 text-sm hud-input"
        />
        <button
          onClick={handleCreate}
          disabled={!customLabel.trim()}
          className="px-3 py-2 rounded-lg hud-button text-xs disabled:opacity-40"
          title="Create category"
        >
          <Plus size={14} />
        </button>
      </div>

      {project.categories.length === 0 ? (
        <p className="text-[11px] text-slate-600 text-center py-4 font-mono">
          No categories yet. Use suggestions or create your own.
        </p>
      ) : (
        <div className="space-y-1.5">
          {project.categories.map((cat) => {
            const count = countCitationsInCategory(project.citations, cat.id)
            const isSelected = selectedCategoryId === cat.id
            return (
              <div
                key={cat.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-arc-500/15 border border-arc-500/40'
                    : 'bg-stark-800/40 border border-transparent hover:border-arc-500/25'
                }`}
                onClick={() => selectCategory(cat.id)}
              >
                <span style={{ color: cat.color }}>{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{cat.label}</p>
                  <p className="text-[10px] text-slate-500">{count} source{count !== 1 ? 's' : ''}</p>
                </div>
                <Link2 size={12} className="text-slate-600 shrink-0" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCategory(cat.id)
                  }}
                  className="text-slate-600 hover:text-red-400 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const { project } = useResearchStore()
  const cat = getCategoryById(project.categories, categoryId)
  if (!cat) return null
  return (
    <span
      className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${cat.color}20`, color: cat.color }}
    >
      {cat.label.toUpperCase()}
    </span>
  )
}
