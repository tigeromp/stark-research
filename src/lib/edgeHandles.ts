/** Closest-side edge attachment for React Flow nodes */

export type Side = 'top' | 'right' | 'bottom' | 'left'

/** One handle per side — used with ConnectionMode.Loose */
export const SIDE_HANDLE: Record<Side, string> = {
  top: 'h-top',
  right: 'h-right',
  bottom: 'h-bottom',
  left: 'h-left',
}

export const NODE_HALF = {
  thesis: { w: 130, h: 90 },
  category: { w: 90, h: 48 },
  citation: { w: 95, h: 42 },
} as const

export function nodeCenter(
  position: { x: number; y: number },
  kind: keyof typeof NODE_HALF,
  measured?: { width?: number; height?: number } | null
): { x: number; y: number } {
  const half = NODE_HALF[kind]
  const w = measured?.width ? measured.width / 2 : half.w
  const h = measured?.height ? measured.height / 2 : half.h
  return { x: position.x + w, y: position.y + h }
}

const SIDES: Side[] = ['top', 'right', 'bottom', 'left']

function sidePoint(
  center: { x: number; y: number },
  kind: keyof typeof NODE_HALF,
  side: Side,
  measured?: { width?: number; height?: number } | null
) {
  const half = NODE_HALF[kind]
  const w = measured?.width ? measured.width / 2 : half.w
  const h = measured?.height ? measured.height / 2 : half.h
  switch (side) {
    case 'top':
      return { x: center.x, y: center.y - h }
    case 'bottom':
      return { x: center.x, y: center.y + h }
    case 'left':
      return { x: center.x - w, y: center.y }
    case 'right':
      return { x: center.x + w, y: center.y }
  }
}

/**
 * Pick the pair of sides with the shortest connection between box edges.
 */
export function closestSideHandles(
  sourceCenter: { x: number; y: number },
  targetCenter: { x: number; y: number },
  sourceKind: keyof typeof NODE_HALF = 'category',
  targetKind: keyof typeof NODE_HALF = 'category',
  sourceMeasured?: { width?: number; height?: number } | null,
  targetMeasured?: { width?: number; height?: number } | null
): { sourceHandle: string; targetHandle: string } {
  let bestDist = Infinity
  let bestSource: Side = 'bottom'
  let bestTarget: Side = 'top'

  for (const s of SIDES) {
    const sp = sidePoint(sourceCenter, sourceKind, s, sourceMeasured)
    for (const t of SIDES) {
      const tp = sidePoint(targetCenter, targetKind, t, targetMeasured)
      const dist = Math.hypot(tp.x - sp.x, tp.y - sp.y)
      // Prefer opposite-facing sides slightly (e.g. right→left)
      const facingBonus =
        (s === 'right' && t === 'left') ||
        (s === 'left' && t === 'right') ||
        (s === 'bottom' && t === 'top') ||
        (s === 'top' && t === 'bottom')
          ? -12
          : 0
      const score = dist + facingBonus
      if (score < bestDist) {
        bestDist = score
        bestSource = s
        bestTarget = t
      }
    }
  }

  return {
    sourceHandle: SIDE_HANDLE[bestSource],
    targetHandle: SIDE_HANDLE[bestTarget],
  }
}

export function kindFromNodeId(id: string): keyof typeof NODE_HALF {
  if (id === 'thesis-center' || id.startsWith('thesis')) return 'thesis'
  if (id.startsWith('citation-')) return 'citation'
  return 'category'
}
