import { Download, FileText, Map, Copy, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useResearchStore } from '../store/useResearchStore'
import { generateWorksCitedPage, sortCitationsAlphabetically } from '../lib/mla'
import { buildOutlineExport, sortOutlineSections } from '../lib/outline'

export function ExportPanel() {
  const { project, resetProject } = useResearchStore()
  const [copied, setCopied] = useState(false)

  const exportResearch = () => {
    const categories = project.categories.map((category) => {
      const citations = project.citations.filter((c) => c.categoryIds.includes(category.id))
      if (citations.length === 0) return null
      return {
        category: category.label,
        citations: citations.map((c) => ({
          author: c.author,
          title: c.title,
          quote: c.quote,
          notes: c.notes,
        })),
      }
    }).filter(Boolean)

    const payload = {
      project: project.name,
      thesis: project.thesis,
      outline: sortOutlineSections(project.outline).map((s) => ({
        title: s.title,
        content: s.content,
        citationIds: s.citationIds,
        sources: s.citationIds
          .map((id) => project.citations.find((c) => c.id === id))
          .filter(Boolean)
          .map((c) => ({ author: c!.author, title: c!.title, quote: c!.quote })),
      })),
      categories,
      connections: project.connections,
      worksCited: sortCitationsAlphabetically(project.citations).map((c) =>
        generateWorksCitedPage([c]).split('\n').slice(2).join('')
      ),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-research.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportWorksCited = () => {
    const text = generateWorksCitedPage(project.citations)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-works-cited.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyOutline = async () => {
    await navigator.clipboard.writeText(buildOutlineExport(project))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cards = [
    {
      icon: FileText,
      title: 'Works Cited',
      desc: 'Download formatted MLA Works Cited page',
      action: exportWorksCited,
      label: 'Download .txt',
    },
    {
      icon: Map,
      title: 'Research Map',
      desc: 'Export full project with sections and citations',
      action: exportResearch,
      label: 'Download .json',
    },
    {
      icon: Copy,
      title: 'Paper Outline',
      desc: 'Copy full outline with sections, drafts, and linked sources',
      action: copyOutline,
      label: copied ? 'Copied!' : 'Copy Outline',
    },
    {
      icon: FileText,
      title: 'Draft Export',
      desc: 'Download your outline sections as a plain-text draft',
      action: () => {
        const blob = new Blob([buildOutlineExport(project)], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-draft.txt`
        a.click()
        URL.revokeObjectURL(url)
      },
      label: 'Download .txt',
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-xl font-semibold text-[#f4f1ea] mb-2">
          Export
        </h2>
        <p className="text-sm text-[#9c9590] mb-8">
          Download your research, outline, and bibliography
        </p>

        <div className="grid gap-4 mb-8">
          {cards.map(({ icon: Icon, title, desc, action, label }) => (
            <div key={title} className="glass-panel rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-arc-500/10 border border-arc-500/30 flex items-center justify-center">
                  <Icon size={20} className="text-arc-400" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-200 tracking-wider">{title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
              <button onClick={action} className="hud-button px-4 py-2 rounded-lg text-xs flex items-center gap-2">
                <Download size={14} />
                {label}
              </button>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-xl p-6 border-red-500/20">
          <h3 className="font-display text-sm text-red-400 tracking-wider mb-2">DANGER ZONE</h3>
          <p className="text-xs text-slate-500 mb-4">Reset all research data. This cannot be undone.</p>
          <button
            onClick={() => {
              if (confirm('Reset all research data?')) resetProject()
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
          >
            <RotateCcw size={14} />
            Reset Project
          </button>
        </div>
      </div>
    </div>
  )
}
