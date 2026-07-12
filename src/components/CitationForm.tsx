import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'
import { parseMLAString, detectSourceType } from '../lib/mlaParser'
import type { CitationFormData } from '../lib/mlaParser'

const emptyForm: CitationFormData = {
  author: '',
  title: '',
  sourceType: 'article',
  notes: '',
  quote: '',
}

export function CitationForm({ onAdded }: { onAdded?: () => void }) {
  const { addCitation } = useResearchStore()
  const [form, setForm] = useState<CitationFormData>(emptyForm)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.author.trim() || !form.title.trim()) return
    addCitation(form, [])
    setForm(emptyForm)
    setPasteText('')
    onAdded?.()
  }

  const handlePasteParse = () => {
    const parsed = parseMLAString(pasteText)
    setForm((prev) => ({
      ...prev,
      author: parsed.author ?? prev.author,
      title: parsed.title ?? prev.title,
      containerTitle: parsed.containerTitle,
      publisher: parsed.publisher,
      publicationDate: parsed.publicationDate,
      volume: parsed.volume,
      issue: parsed.issue,
      pages: parsed.pages,
      url: parsed.url,
      accessDate: parsed.accessDate,
      sourceType: detectSourceType({ ...prev, ...parsed }),
    }))
    setPasteText('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Author</span>
        <input
          value={form.author}
          onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
          placeholder="Smith, John"
          className="w-full mt-1 rounded-lg px-3 py-2 text-sm hud-input"
        />
      </label>

      <label className="block">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Title</span>
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Article or book title"
          className="w-full mt-1 rounded-lg px-3 py-2 text-sm hud-input"
        />
      </label>

      <button
        type="submit"
        className="w-full py-2.5 rounded-lg hud-button hud-button-primary text-xs flex items-center justify-center gap-2"
      >
        <Plus size={14} />
        Index Source
      </button>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-[10px] font-mono text-slate-500 hover:text-arc-400 flex items-center justify-center gap-1"
      >
        {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {showAdvanced ? 'Hide' : 'Show'} paste MLA / details
      </button>

      {showAdvanced && (
        <div className="space-y-2 pt-1 border-t border-arc-500/10">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste MLA works-cited entry to auto-fill..."
            className="w-full h-20 rounded-lg px-3 py-2 text-xs hud-input resize-none"
          />
          {pasteText.trim() && (
            <button
              type="button"
              onClick={handlePasteParse}
              className="w-full py-1.5 rounded-lg hud-button text-[10px] flex items-center justify-center gap-1"
            >
              <Sparkles size={12} />
              Parse into fields
            </button>
          )}

          <label className="block">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Quote</span>
            <textarea
              value={form.quote}
              onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
              placeholder="Key passage..."
              className="w-full mt-1 rounded px-2 py-1.5 text-xs hud-input resize-none h-14"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Your analysis..."
              className="w-full mt-1 rounded px-2 py-1.5 text-xs hud-input resize-none h-14"
            />
          </label>
        </div>
      )}
    </form>
  )
}
