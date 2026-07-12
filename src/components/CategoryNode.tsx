import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { CategoryNodeData } from '../types'

export function CategoryNode({ data, selected }: NodeProps) {
  const { category, citationCount } = data as unknown as CategoryNodeData

  return (
    <div
      className={`rounded-lg px-3.5 py-2.5 min-w-[150px] transition-all ${
        selected ? 'ring-2 ring-offset-1 ring-offset-[#100f0e]' : ''
      }`}
      style={{
        background: '#1a1917',
        border: `1.5px solid ${selected ? category.color : `${category.color}55`}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        ...(selected ? { '--tw-ring-color': category.color } as React.CSSProperties : {}),
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!w-2.5 !h-2.5 !border-2 !-top-1"
        style={{ background: category.color, borderColor: '#1a1917' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="!w-2.5 !h-2.5 !border-2 !-bottom-1"
        style={{ background: category.color, borderColor: '#1a1917' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-right"
        className="!w-2 !h-2 !border-2"
        style={{ background: category.color, borderColor: '#1a1917' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in-left"
        className="!w-2 !h-2 !border-2"
        style={{ background: category.color, borderColor: '#1a1917' }}
      />

      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-base" style={{ color: category.color }}>{category.icon}</span>
        <span className="font-display text-sm font-semibold" style={{ color: category.color }}>
          {category.label}
        </span>
      </div>

      <p className="text-[10px] text-[#9c9590] leading-tight line-clamp-2">{category.description}</p>

      <p
        className="mt-1.5 text-[9px] font-mono"
        style={{ color: `${category.color}cc` }}
      >
        {citationCount} source{citationCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
