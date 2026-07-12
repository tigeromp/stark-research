import type { MapConnection } from '../types'
import { parseNodeId } from '../types'

export function isAssignmentEdge(edgeId: string): boolean {
  return edgeId.startsWith('assign-')
}

export function assignmentEdgeId(categoryId: string, citationId: string): string {
  return `assign-${categoryId}-${citationId}`
}

export function parseCategoryCitationLink(
  source: string,
  target: string
): { categoryId: string; citationId: string } | null {
  const s = parseNodeId(source)
  const t = parseNodeId(target)
  if (!s || !t) return null

  if (s.kind === 'category' && t.kind === 'citation') {
    return { categoryId: s.id, citationId: t.id }
  }
  if (s.kind === 'citation' && t.kind === 'category') {
    return { categoryId: t.id, citationId: s.id }
  }
  return null
}

export function isStructuralConnection(source: string, target: string): boolean {
  const s = parseNodeId(source)
  const t = parseNodeId(target)
  if (!s || !t) return false
  return (
    (s.kind === 'thesis' && t.kind === 'category') ||
    (s.kind === 'category' && t.kind === 'thesis') ||
    (s.kind === 'category' && t.kind === 'category') ||
    (s.kind === 'citation' && t.kind === 'citation')
  )
}

export function connectionExists(
  connections: MapConnection[],
  source: string,
  target: string
): boolean {
  return connections.some(
    (c) =>
      (c.source === source && c.target === target) ||
      (c.source === target && c.target === source)
  )
}
