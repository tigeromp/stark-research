/** Shared React Flow handle IDs for closest-side routing */

export type Side = 'top' | 'right' | 'bottom' | 'left'

export const SOURCE_HANDLE: Record<Side, string> = {
  top: 's-top',
  right: 's-right',
  bottom: 's-bottom',
  left: 's-left',
}

export const TARGET_HANDLE: Record<Side, string> = {
  top: 't-top',
  right: 't-right',
  bottom: 't-bottom',
  left: 't-left',
}

/** Approximate node centers from top-left positions */
export const NODE_HALF = {
  thesis: { w: 130, h: 80 },
  category: { w: 85, h: 50 },
  citation: { w: 95, h: 40 },
} as const

export function nodeCenter(
  position: { x: number; y: number },
  kind: keyof typeof NODE_HALF
): { x: number; y: number } {
  const half = NODE_HALF[kind]
  return { x: position.x + half.w, y: position.y + half.h }
}

/**
 * Pick the facing sides between two node centers.
 * Source uses a source-type handle; target uses a target-type handle.
 */
export function closestSideHandles(
  sourceCenter: { x: number; y: number },
  targetCenter: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetCenter.x - sourceCenter.x
  const dy = targetCenter.y - sourceCenter.y

  let sourceSide: Side
  let targetSide: Side

  if (Math.abs(dx) >= Math.abs(dy)) {
    sourceSide = dx >= 0 ? 'right' : 'left'
    targetSide = dx >= 0 ? 'left' : 'right'
  } else {
    sourceSide = dy >= 0 ? 'bottom' : 'top'
    targetSide = dy >= 0 ? 'top' : 'bottom'
  }

  return {
    sourceHandle: SOURCE_HANDLE[sourceSide],
    targetHandle: TARGET_HANDLE[targetSide],
  }
}

export function kindFromNodeId(id: string): keyof typeof NODE_HALF {
  if (id === 'thesis-center' || id.startsWith('thesis')) return 'thesis'
  if (id.startsWith('citation-')) return 'citation'
  return 'category'
}
