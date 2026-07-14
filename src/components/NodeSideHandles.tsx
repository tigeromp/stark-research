import { Handle, Position } from '@xyflow/react'
import { SIDE_HANDLE, type Side } from '../lib/edgeHandles'

const SIDES: { side: Side; position: Position }[] = [
  { side: 'top', position: Position.Top },
  { side: 'right', position: Position.Right },
  { side: 'bottom', position: Position.Bottom },
  { side: 'left', position: Position.Left },
]

/**
 * One handle per side. Shown on hover/selection for a clean professional look.
 * Works with ConnectionMode.Loose so each handle can be source or target.
 */
export function NodeSideHandles({ color }: { color: string }) {
  const style = { background: color, borderColor: '#1a1917' }

  return (
    <>
      {SIDES.map(({ side, position }) => (
        <Handle
          key={side}
          type="source"
          position={position}
          id={SIDE_HANDLE[side]}
          className="!w-2.5 !h-2.5 !border-2 !opacity-0 group-hover/node:!opacity-90 group-[.selected]/node:!opacity-90 transition-opacity"
          style={style}
        />
      ))}
    </>
  )
}
