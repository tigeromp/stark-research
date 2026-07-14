import { type CSSProperties } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { CategoryNodeData } from '../types'
import { NodeSideHandles } from './NodeSideHandles'

export function CategoryNode({ data, selected }: NodeProps) {
  const { category, citationCount } = data as unknown as CategoryNodeData
  const isSub = Boolean(category.parentId)
  const color = category.color

  return (
    <div
      className={`group/node rounded-lg px-3.5 py-2.5 min-w-[150px] transition-all ${
        selected ? 'selected ring-2 ring-offset-1 ring-offset-[#100f0e]' : ''
      }`}
      style={{
        background: isSub ? '#22201d' : '#1a1917',
        border: `1.5px solid ${selected ? color : `${color}${isSub ? '99' : '55'}`}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        opacity: isSub ? 0.92 : 1,
        ...(selected ? ({ '--tw-ring-color': color } as CSSProperties) : {}),
      }}
    >
      <NodeSideHandles color={color} />

      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-base" style={{ color }}>
          {category.icon}
        </span>
        <span
          className={`font-display font-semibold ${isSub ? 'text-[13px]' : 'text-sm'}`}
          style={{ color }}
        >
          {category.label}
        </span>
      </div>

      <p className="text-[10px] text-[#9c9590] leading-tight line-clamp-2">{category.description}</p>

      <p className="mt-1.5 text-[9px] font-mono" style={{ color: `${color}cc` }}>
        {isSub ? 'subtopic · ' : ''}
        {citationCount} source{citationCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
