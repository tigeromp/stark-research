import type { Category, Citation, MapConnection } from '../types'

export const THESIS_POSITION = { x: -120, y: -80 }
const THESIS = THESIS_POSITION

/** Inner ring: all topics orbit the main idea */
export const CATEGORY_RING_RADIUS = 360

/** Outer ring baseline — actual radius is computed to clear the topic ring */
export const SOURCE_RING_RADIUS = 680

const TOPIC_NODE_RADIUS = 105
const SOURCE_NODE_RADIUS = 88
const TOPIC_SOURCE_GAP = 80
const UNASSIGNED_EXTRA_RADIUS = 100
const MIN_CITATION_GAP = 120
const THESIS_KEEP_OUT = 220

const THESIS_BOX = { cx: THESIS.x, cy: THESIS.y, halfW: 175, halfH: 115 }
const HUD_PANEL_BOX = { cx: -200, cy: 70, halfW: 240, halfH: 130 }

export const UNASSIGNED_CLUSTER = {
  x: THESIS.x,
  y: THESIS.y + SOURCE_RING_RADIUS + UNASSIGNED_EXTRA_RADIUS,
}

export interface OrganizedLayout {
  categoryPositions: Record<string, { x: number; y: number }>
  citationPositions: Record<string, { x: number; y: number }>
}

interface LayoutNode {
  id: string
  x: number
  y: number
  radius: number
}

function round(n: number) {
  return Math.round(n)
}

export function categoryRingAngle(index: number, total: number): number {
  if (total <= 0) return -Math.PI / 2
  return (index / total) * 2 * Math.PI - Math.PI / 2
}

export function positionOnRing(
  radius: number,
  angle: number,
  center = THESIS
): { x: number; y: number } {
  return {
    x: round(center.x + Math.cos(angle) * radius),
    y: round(center.y + Math.sin(angle) * radius),
  }
}

function categoryOrbitRadius(count: number): number {
  return Math.max(CATEGORY_RING_RADIUS, 300 + count * 14)
}

/** Minimum radius so source centers never sit on top of topic nodes */
function minSourceRadius(categoryCount: number): number {
  const topicRing = categoryOrbitRadius(categoryCount)
  return Math.max(
    SOURCE_RING_RADIUS,
    topicRing + TOPIC_NODE_RADIUS + SOURCE_NODE_RADIUS + TOPIC_SOURCE_GAP
  )
}

function sourceOrbitRadius(categoryCount: number, sourceCount: number, layer = 0): number {
  return (
    minSourceRadius(categoryCount) +
    layer * 60 +
    Math.max(0, Math.floor(sourceCount / 6) - 1) * 20
  )
}

function unassignedOrbitRadius(categoryCount: number, sourceCount: number, layer = 0): number {
  return sourceOrbitRadius(categoryCount, sourceCount, layer) + UNASSIGNED_EXTRA_RADIUS
}

function averageAngle(angles: number[]): number {
  if (angles.length === 0) return -Math.PI / 2
  const sin = angles.reduce((s, a) => s + Math.sin(a), 0)
  const cos = angles.reduce((s, a) => s + Math.cos(a), 0)
  return Math.atan2(sin, cos)
}

/** Pick the outer-ring angle with the most clearance from all topics */
function bestUnassignedAngle(categoryNodes: LayoutNode[], categoryCount: number): number {
  if (categoryNodes.length === 0) return Math.PI / 2

  const radius = unassignedOrbitRadius(categoryCount, 1)
  let bestAngle = Math.PI / 2
  let bestClearance = -Infinity

  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * 2 * Math.PI - Math.PI / 2
    const pos = positionOnRing(radius, angle)
    const clearance = Math.min(
      ...categoryNodes.map((topic) => {
        const dist = Math.hypot(pos.x - topic.x, pos.y - topic.y)
        return dist - topic.radius - SOURCE_NODE_RADIUS
      })
    )
    if (clearance > bestClearance) {
      bestClearance = clearance
      bestAngle = angle
    }
  }

  return bestAngle
}

function layoutCategoriesInRing(categories: Category[]): LayoutNode[] {
  const count = categories.length
  if (count === 0) return []

  const radius = categoryOrbitRadius(count)

  return categories.map((cat, i) => {
    const pos = positionOnRing(radius, categoryRingAngle(i, count))
    return { id: cat.id, x: pos.x, y: pos.y, radius: TOPIC_NODE_RADIUS }
  })
}

function sourcesAroundTopic(
  citations: Citation[],
  topicIndex: number,
  topicCount: number,
  categoryCount: number
): LayoutNode[] {
  const count = citations.length
  if (count === 0) return []

  const baseAngle = categoryRingAngle(topicIndex, topicCount)
  const spread = count === 1 ? 0 : Math.min(count * 0.14, 0.75)

  return citations.map((citation, i) => {
    const angleOffset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread
    const layer = Math.floor(i / 8)
    const pos = positionOnRing(
      sourceOrbitRadius(categoryCount, count, layer),
      baseAngle + angleOffset
    )
    return { id: citation.id, x: pos.x, y: pos.y, radius: SOURCE_NODE_RADIUS }
  })
}

function layoutCitationsOnOuterRing(
  citations: Citation[],
  categories: Category[],
  categoryNodes: LayoutNode[]
): LayoutNode[] {
  const topicCount = categories.length
  const categoryCount = topicCount
  const topicIndex = new Map(categories.map((c, i) => [c.id, i]))
  const nodes: LayoutNode[] = []
  const placed = new Set<string>()

  const singleTopic = citations.filter((c) => c.categoryIds.length === 1)
  const multiTopic = citations.filter((c) => c.categoryIds.length > 1)

  const byCategory = new Map<string, Citation[]>()
  singleTopic.forEach((c) => {
    const id = c.categoryIds[0]
    if (!byCategory.has(id)) byCategory.set(id, [])
    byCategory.get(id)!.push(c)
  })

  byCategory.forEach((group, categoryId) => {
    const idx = topicIndex.get(categoryId)
    if (idx === undefined) return
    sourcesAroundTopic(group, idx, topicCount, categoryCount).forEach((n) => {
      nodes.push(n)
      placed.add(n.id)
    })
  })

  const midpointGroups = new Map<string, Citation[]>()
  multiTopic.forEach((citation) => {
    const key = [...citation.categoryIds].sort().join('|')
    if (!midpointGroups.has(key)) midpointGroups.set(key, [])
    midpointGroups.get(key)!.push(citation)
  })

  midpointGroups.forEach((group) => {
    const angles = group[0].categoryIds
      .map((id) => topicIndex.get(id))
      .filter((idx): idx is number => idx !== undefined)
      .map((idx) => categoryRingAngle(idx, topicCount))

    const baseAngle = averageAngle(angles)
    const count = group.length
    const spread = count === 1 ? 0 : Math.min(count * 0.12, 0.55)

    group.forEach((citation, i) => {
      const angleOffset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread
      const layer = Math.floor(i / 6)
      const pos = positionOnRing(
        sourceOrbitRadius(categoryCount, count, layer),
        baseAngle + angleOffset
      )
      nodes.push({ id: citation.id, x: pos.x, y: pos.y, radius: SOURCE_NODE_RADIUS })
      placed.add(citation.id)
    })
  })

  const unassigned = citations.filter((c) => !placed.has(c.id))
  const unassignedCount = unassigned.length
  const baseAngle = bestUnassignedAngle(categoryNodes, categoryCount)
  const spread = unassignedCount === 1 ? 0 : Math.min(unassignedCount * 0.12, 0.85)

  unassigned.forEach((citation, i) => {
    const angleOffset =
      unassignedCount === 1 ? 0 : (i / (unassignedCount - 1) - 0.5) * spread
    const layer = Math.floor(i / 8)
    const pos = positionOnRing(
      unassignedOrbitRadius(categoryCount, unassignedCount, layer),
      baseAngle + angleOffset
    )
    nodes.push({ id: citation.id, x: pos.x, y: pos.y, radius: SOURCE_NODE_RADIUS })
  })

  return nodes
}

function repelFromRect(
  node: LayoutNode,
  rect: { cx: number; cy: number; halfW: number; halfH: number },
  padding = 20
) {
  const localX = node.x - rect.cx
  const localY = node.y - rect.cy
  const clampedX = Math.max(-rect.halfW, Math.min(rect.halfW, localX))
  const clampedY = Math.max(-rect.halfH, Math.min(rect.halfH, localY))
  const closestX = rect.cx + clampedX
  const closestY = rect.cy + clampedY
  const dx = node.x - closestX
  const dy = node.y - closestY
  const dist = Math.hypot(dx, dy) || 0.01
  const minDist = node.radius + padding

  if (dist < minDist) {
    const push = minDist - dist
    node.x = round(node.x + (dx / dist) * push)
    node.y = round(node.y + (dy / dist) * push)
  }
}

function repelFromCircle(
  node: LayoutNode,
  center: { x: number; y: number },
  radius: number,
  padding = 15
) {
  const dx = node.x - center.x
  const dy = node.y - center.y
  const dist = Math.hypot(dx, dy) || 0.01
  const minDist = radius + node.radius + padding

  if (dist < minDist) {
    const push = minDist - dist
    node.x = round(node.x + (dx / dist) * push)
    node.y = round(node.y + (dy / dist) * push)
  }
}

function repelFromProtectedZones(nodes: LayoutNode[]) {
  const protectedRects = [THESIS_BOX, HUD_PANEL_BOX]

  for (let pass = 0; pass < 30; pass++) {
    nodes.forEach((node) => {
      protectedRects.forEach((rect) => repelFromRect(node, rect, 24))
      repelFromCircle(node, THESIS, THESIS_KEEP_OUT, 24)
    })
  }
}

/** Push every source outside the topic ring band */
function pushOutsideTopicRing(
  citationNodes: LayoutNode[],
  categoryCount: number
) {
  const minRadius = minSourceRadius(categoryCount)

  citationNodes.forEach((node) => {
    const dx = node.x - THESIS.x
    const dy = node.y - THESIS.y
    const dist = Math.hypot(dx, dy) || 0.01

    if (dist < minRadius) {
      const scale = minRadius / dist
      node.x = round(THESIS.x + dx * scale)
      node.y = round(THESIS.y + dy * scale)
    }
  })
}

function repelCitationsFromTopics(
  citationNodes: LayoutNode[],
  categoryNodes: LayoutNode[]
) {
  for (let pass = 0; pass < 40; pass++) {
    citationNodes.forEach((node) => {
      categoryNodes.forEach((topic) => {
        const dx = node.x - topic.x
        const dy = node.y - topic.y
        const dist = Math.hypot(dx, dy) || 0.01
        const minDist = topic.radius + node.radius + TOPIC_SOURCE_GAP

        if (dist < minDist) {
          const push = minDist - dist + 4
          node.x = round(node.x + (dx / dist) * push)
          node.y = round(node.y + (dy / dist) * push)
        }
      })
    })
  }

  repelFromProtectedZones(citationNodes)
}

function resolveCitationCollisions(nodes: LayoutNode[], minGap: number, iterations = 60): LayoutNode[] {
  const result = nodes.map((n) => ({ ...n }))

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.01
        const minDist = a.radius + b.radius + minGap

        if (dist < minDist) {
          const push = (minDist - dist) / 2
          const nx = dx / dist
          const ny = dy / dist
          a.x = round(a.x - nx * push)
          a.y = round(a.y - ny * push)
          b.x = round(b.x + nx * push)
          b.y = round(b.y + ny * push)
        }
      }
    }
  }

  return result
}

export function organizeLayout(
  categories: Category[],
  citations: Citation[],
  _connections: MapConnection[] = []
): OrganizedLayout {
  const categoryNodes = layoutCategoriesInRing(categories)
  const categoryCount = categories.length

  let citationNodes = layoutCitationsOnOuterRing(citations, categories, categoryNodes)
  pushOutsideTopicRing(citationNodes, categoryCount)
  repelCitationsFromTopics(citationNodes, categoryNodes)
  citationNodes = resolveCitationCollisions(citationNodes, MIN_CITATION_GAP, 100)
  pushOutsideTopicRing(citationNodes, categoryCount)
  repelCitationsFromTopics(citationNodes, categoryNodes)
  citationNodes = resolveCitationCollisions(citationNodes, MIN_CITATION_GAP, 50)
  pushOutsideTopicRing(citationNodes, categoryCount)
  repelCitationsFromTopics(citationNodes, categoryNodes)

  const categoryPositions: Record<string, { x: number; y: number }> = {}
  const citationPositions: Record<string, { x: number; y: number }> = {}

  categoryNodes.forEach((n) => {
    categoryPositions[n.id] = { x: n.x, y: n.y }
  })

  citationNodes.forEach((n) => {
    citationPositions[n.id] = { x: n.x, y: n.y }
  })

  return { categoryPositions, citationPositions }
}

export function outerRingPosition(
  categoryCount: number,
  groupCount: number,
  angle: number,
  itemIndex = 0
): { x: number; y: number } {
  return positionOnRing(
    sourceOrbitRadius(categoryCount, groupCount, Math.floor(itemIndex / 6)),
    angle
  )
}

export function nextCategoryRingPosition(index: number, total: number): { x: number; y: number } {
  return positionOnRing(categoryOrbitRadius(total), categoryRingAngle(index, total))
}

export function nextSourceRingPosition(
  topicIndex: number,
  topicCount: number,
  sourceIndex: number,
  sourceCount: number
): { x: number; y: number } {
  const baseAngle = categoryRingAngle(topicIndex, topicCount)
  const spread = sourceCount === 1 ? 0 : Math.min(sourceCount * 0.14, 0.75)
  const angleOffset = sourceCount === 1 ? 0 : (sourceIndex / (sourceCount - 1) - 0.5) * spread
  return positionOnRing(sourceOrbitRadius(topicCount, sourceCount), baseAngle + angleOffset)
}

/** Unassigned source slot — uses angle with most topic clearance */
export function nextUnassignedRingPosition(
  sourceIndex: number,
  sourceCount: number,
  categories: Category[]
): { x: number; y: number } {
  const categoryNodes = layoutCategoriesInRing(categories)
  const baseAngle = bestUnassignedAngle(categoryNodes, categories.length)
  const spread = sourceCount === 1 ? 0 : Math.min(sourceCount * 0.12, 0.85)
  const angleOffset = sourceCount === 1 ? 0 : (sourceIndex / (sourceCount - 1) - 0.5) * spread
  return positionOnRing(
    unassignedOrbitRadius(categories.length, sourceCount, Math.floor(sourceIndex / 8)),
    baseAngle + angleOffset
  )
}
