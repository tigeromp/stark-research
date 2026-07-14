import { type NodeProps } from '@xyflow/react'
import type { CategoryNodeData } from '../types'
import { NodeSideHandles } from './NodeSideHandles'

export function CategoryNode({ data, selected }: NodeProps) {
  const { category, citationCount } = data as unknown as CategoryNodeData
  const isSub = Boolean(category.parentId)

  return (
    <div
      className={`group/node rounded-lg px-3.5 py-2.5 min-w-[150px] transition-all ${
        selected ? 'selected ring-2 ring-offset-1 ring-offset-[#100f0e]' : ''
      }`}
      style={{
        background: '#1a1917',
        border: `1.5px solid ${selected ? category.color : `${category.color}${isSub ? '88' : '55'}`}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        ...(selected ? ({ '--tw-ring-color': category.color } as React.CSSProperties) : {}),
      }}
    >
      <NodeSideHandles color={category.color} />

      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-base" style={{ color: category.color }}>
          {category.icon}
        </span>
        <span className="font-display text-sm font-semibold" style={{ color: category.color }}>
          {category.label}
        </span>
      </div>

      <p className="text-[10px] text-[#9c9590] leading-tight line-clamp-2">{category.description}</p>

      <p className="mt-1.5 text-[9px] font-mono" style={{ color: `${category.color}cc` }}>
        {isSub ? 'subtopic · ' : ''}
        {citationCount} source{citationCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
