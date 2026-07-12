import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { Unlink } from 'lucide-react'
import { useResearchStore } from '../store/useResearchStore'

export function DeletableEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const handleMapDisconnect = useResearchStore((s) => s.handleMapDisconnect)
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.35,
  })

  const deletable = data?.deletable !== false

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          ...style,
          strokeWidth: selected ? 3.5 : style?.strokeWidth ?? 2.5,
          opacity: selected ? 1 : style?.opacity ?? 0.85,
        }}
        markerEnd={markerEnd}
        interactionWidth={20}
      />
      {selected && deletable && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="nodrag nopan flex items-center justify-center w-7 h-7 rounded-full glass-panel border border-arc-500/40 text-arc-300 hover:text-red-300 hover:border-red-400/50 hover:bg-red-500/10 transition-colors shadow-lg"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            title="Disconnect"
            onClick={(e) => {
              e.stopPropagation()
              handleMapDisconnect(id, source, target)
            }}
          >
            <Unlink size={12} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
