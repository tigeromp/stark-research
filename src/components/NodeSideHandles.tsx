import { Handle, Position } from '@xyflow/react'
import { SOURCE_HANDLE, TARGET_HANDLE, type Side } from '../lib/edgeHandles'

const SIDES: { side: Side; position: Position }[] = [
  { side: 'top', position: Position.Top },
  { side: 'right', position: Position.Right },
  { side: 'bottom', position: Position.Bottom },
  { side: 'left', position: Position.Left },
]

/** Source + target handle on every side so edges can attach to the closest side. */
export function NodeSideHandles({ color }: { color: string }) {
  const style = { background: color, borderColor: '#1a1917' }

  return (
    <>
      {SIDES.map(({ side, position }) => (
        <span key={side}>
          <Handle
            type="source"
            position={position}
            id={SOURCE_HANDLE[side]}
            className="!w-2 !h-2 !border-2 !opacity-60"
            style={style}
          />
          <Handle
            type="target"
            position={position}
            id={TARGET_HANDLE[side]}
            className="!w-2 !h-2 !border-2 !opacity-60"
            style={style}
          />
        </span>
      ))}
    </>
  )
}
