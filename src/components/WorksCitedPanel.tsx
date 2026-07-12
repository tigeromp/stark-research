import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useResearchStore } from '../store/useResearchStore'
import { formatMLAWorksCitedPlain, sortCitationsAlphabetically } from '../lib/mla'

export function WorksCitedPanel() {
  const { project } = useResearchStore()
  const [copied, setCopied] = useState(false)
  const sorted = sortCitationsAlphabetically(project.citations)

  const text = sorted.map((c) => formatMLAWorksCitedPlain(c)).join('\n\n')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#f4f1ea] mb-1">
          Works cited
        </h2>
        <p className="text-sm text-[#9c9590] mt-1">
          MLA 9th edition · {sorted.length} entries
        </p>
          </div>
          <button onClick={handleCopy} className="hud-button px-4 py-2 rounded-lg text-xs flex items-center gap-2">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy All'}
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <p className="text-slate-500 font-mono text-sm">NO CITATIONS INDEXED</p>
            <p className="text-slate-600 text-xs mt-2">Add sources to generate your Works Cited page</p>
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-8 space-y-6">
            {sorted.map((citation, i) => (
              <div
                key={citation.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <p className="text-sm text-slate-300 leading-relaxed pl-8 -indent-8">
                  {formatMLAWorksCitedPlain(citation)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
