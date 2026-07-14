import { useMemo, useState } from 'react'
import { Plus, Sparkles, Trash2, Link2, ChevronRight, ChevronDown } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import { suggestCategoriesFromCitations } from '../lib/categorySuggestions'
import { countCitationsInCategory, getCategoryById, getTopLevelCategories, getSubcategories } from '../lib/categories'

export function CategoryPanel() {
  const { project, addCategory, removeCategory, selectCategory, selectedCategoryId } =
    useResearchStore()
  const [customLabel, setCustomLabel] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)

  const suggestions = useMemo(
    () =>
      suggestCategoriesFromCitations(
        project.citations,
        project.categories.map((c) => c.label)
      ),
    [project.citations, project.categories]
  )

  const handleCreate = (parentId?: string) => {
    const label = customLabel.trim()
    if (!label) return
    addCategory(label, { keywords: [label.toLowerCase()], parentId: parentId || undefined })
    setCustomLabel('')
    setAddingSubTo(null)
    if (parentId) {
      setExpandedCategories(prev => new Set(prev).add(parentId))
    }
  }

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const topLevel = getTopLevelCategories(project.categories)

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
          placeholder={addingSubTo ? "Subtopic name..." : "New category name..."}
          className="flex-1 rounded-lg px-3 py-2 text-sm hud-input"
        />
        <button
          onClick={() => handleCreate(addingSubTo || undefined)}
          disabled={!customLabel.trim()}
          className="px-3 py-2 rounded-lg hud-button text-xs disabled:opacity-40"
          title={addingSubTo ? "Create subtopic" : "Create category"}
        >
          <Plus size={14} />
        </button>
      </div>
      {addingSubTo && (
        <p className="text-[10px] text-arc-400">
          Adding subtopic to: {getCategoryById(project.categories, addingSubTo)?.label}
          <button onClick={() => setAddingSubTo(null)} className="ml-2 text-[#9c9590] hover:text-[#f4f1ea]">cancel</button>
        </p>
      )}

      {project.categories.length === 0 ? (
        <p className="text-[11px] text-slate-600 text-center py-4 font-mono">
          No categories yet. Use suggestions or create your own.
        </p>
      ) : (
        <div className="space-y-1.5">
          {topLevel.map((cat) => {
            const count = countCitationsInCategory(project.citations, cat.id)
            const isSelected = selectedCategoryId === cat.id
            const subcats = getSubcategories(project.categories, cat.id)
            const hasSubcats = subcats.length > 0
            const isExpanded = expandedCategories.has(cat.id)
            
            return (
              <div key={cat.id}>
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${
                    isSelected
                      ? 'bg-arc-500/15 border border-arc-500/40 cursor-pointer'
                      : 'bg-stark-800/40 border border-transparent hover:border-arc-500/25 cursor-pointer'
                  }`}
                >
                  {hasSubcats ? (
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-0.5 text-slate-600 hover:text-slate-300"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}
                  <button
                    onClick={() => selectCategory(cat.id)}
                    className="flex-1 flex items-center gap-2 min-w-0"
                  >
                    <span style={{ color: cat.color }}>{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{cat.label}</p>
                      <p className="text-[10px] text-slate-500">{count} source{count !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAddingSubTo(cat.id)
                      setCustomLabel('')
                      setExpandedCategories(prev => new Set(prev).add(cat.id))
                    }}
                    className="text-slate-600 hover:text-arc-400 p-1"
                    title="Add subtopic"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${cat.label}"${hasSubcats ? ' and all subtopics' : ''}?`)) {
                        removeCategory(cat.id)
                      }
                    }}
                    className="text-slate-600 hover:text-red-400 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Subcategories */}
                {isExpanded && hasSubcats && (
                  <div className="ml-8 mt-1 space-y-1">
                    {subcats.map((subcat) => {
                      const subCount = countCitationsInCategory(project.citations, subcat.id)
                      const isSubSelected = selectedCategoryId === subcat.id

                      return (
                        <div
                          key={subcat.id}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all cursor-pointer ${
                            isSubSelected
                              ? 'bg-arc-500/15 border border-arc-500/40'
                              : 'bg-stark-800/20 border border-transparent hover:border-arc-500/25'
                          }`}
                          onClick={() => selectCategory(subcat.id)}
                        >
                          <span style={{ color: subcat.color }} className="text-sm">{subcat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{subcat.label}</p>
                            <p className="text-[10px] text-slate-500">{subCount} source{subCount !== 1 ? 's' : ''}</p>
                          </div>
                          <Link2 size={10} className="text-slate-600" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeCategory(subcat.id)
                            }}
                            className="text-slate-600 hover:text-red-400 p-1"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
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
