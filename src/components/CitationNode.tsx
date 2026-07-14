import { type NodeProps } from '@xyflow/react'
import type { CitationNodeData } from '../types'
import { NodeSideHandles } from './NodeSideHandles'

export function CitationNode({ data, selected }: NodeProps) {
  const { citation, label, color } = data as unknown as CitationNodeData
  const hasNotes = Boolean(citation.notes?.trim())

  return (
    <div
      className={`group/node min-w-[170px] max-w-[220px] rounded-lg px-3 py-2.5 transition-all ${
        selected ? 'selected ring-2 ring-white/20' : ''
      }`}
      style={{
        background: '#1a1917',
        border: `1px solid ${selected ? color : 'rgba(255,248,240,0.1)'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}
    >
      <NodeSideHandles color={color} />

      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#f4f1ea] truncate">{label}</p>
          <p className="text-[10px] text-[#9c9590] truncate mt-0.5">{citation.title}</p>
          {citation.categoryIds.length > 1 && (
            <p className="text-[9px] text-[#9c9590] mt-1">{citation.categoryIds.length} topics</p>
          )}
          {hasNotes && (
            <span className="notes-badge inline-flex w-fit items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded mt-1.5 border">
              NOTES
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
