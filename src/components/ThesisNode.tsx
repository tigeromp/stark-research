import { Handle, Position, type NodeProps } from '@xyflow/react'
import { THESIS_COLOR } from '../lib/categories'
import type { ThesisNodeData } from '../types'

export function ThesisNode({ data, selected }: NodeProps) {
  const { thesis, projectName } = data as unknown as ThesisNodeData

  return (
    <div
      className={`rounded-xl px-5 py-4 min-w-[220px] max-w-[300px] text-center transition-all ${
        selected ? 'ring-2 ring-offset-2 ring-offset-[#100f0e]' : ''
      }`}
      style={{
        background: '#1a1917',
        border: `1.5px solid ${selected ? THESIS_COLOR : `${THESIS_COLOR}88`}`,
        boxShadow: selected
          ? `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${THESIS_COLOR}33`
          : '0 4px 20px rgba(0,0,0,0.25)',
        ...(selected ? { '--tw-ring-color': THESIS_COLOR } as React.CSSProperties : {}),
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!w-2.5 !h-2.5 !border-2 !-top-1"
        style={{ background: THESIS_COLOR, borderColor: '#1a1917' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="!w-2.5 !h-2.5 !border-2 !-bottom-1"
        style={{ background: THESIS_COLOR, borderColor: '#1a1917' }}
      />

      <div
        className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center text-sm font-display font-semibold"
        style={{ background: `${THESIS_COLOR}22`, color: THESIS_COLOR, border: `1px solid ${THESIS_COLOR}44` }}
      >
        ◎
      </div>

      <p className="section-label mb-1" style={{ color: THESIS_COLOR }}>
        Main idea
      </p>
      <h2 className="font-display text-sm font-semibold text-[#f4f1ea] mb-1.5 truncate">{projectName}</h2>
      <p className="text-xs text-[#9c9590] leading-relaxed line-clamp-3">
        {thesis || 'Click to define your thesis or question...'}
      </p>
    </div>
  )
}
