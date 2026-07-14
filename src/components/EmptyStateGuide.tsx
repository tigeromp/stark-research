import { useState } from 'react'
import { BookOpen, Upload, Map, FileText, Tags, X } from 'lucide-react'

const steps = [
  { icon: Map, title: 'Set your thesis', desc: 'Click the center node on the mind map' },
  { icon: Upload, title: 'Add sources', desc: 'Import a bibliography or add manually' },
  { icon: Tags, title: 'Create topics', desc: 'Organize sources into themes' },
  { icon: BookOpen, title: 'Connect ideas', desc: 'Draw lines between related items' },
  { icon: FileText, title: 'Write & export', desc: 'Outline your paper and export MLA citations' },
]

export function EmptyStateGuide() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="glass-panel rounded-2xl p-8 max-w-md animate-fade-in-up shadow-xl pointer-events-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl font-semibold text-[#f4f1ea]">
            Start your research
          </h2>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-[#9c9590] hover:text-[#f4f1ea] hover:bg-white/[0.04] transition-colors -mr-1 -mt-1"
            aria-label="Close guide"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-[#9c9590] mb-6">
          Map sources, build an outline, and export your works cited.
        </p>
        <div className="space-y-3">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-arc-400">
                <Icon size={15} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8e4dc]">
                  <span className="text-[#9c9590] font-mono text-xs mr-2">{i + 1}</span>
                  {title}
                </p>
                <p className="text-xs text-[#9c9590] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="hud-button-primary w-full mt-6 py-2"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
