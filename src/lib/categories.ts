import { v4 as uuidv4 } from 'uuid'
import type { Category, Citation } from '../types'
import {
  categoryRingAngle,
  nextCategoryRingPosition,
  nextSourceRingPosition,
  nextUnassignedRingPosition,
  outerRingPosition,
} from './layoutGraph'

/** Reserved for the thesis / main-idea node — topics must not use this palette */
export const THESIS_COLOR = '#84a98c'

const THESIS_LIKE_COLORS = new Set([
  THESIS_COLOR.toLowerCase(),
  '#6b9080',
  '#a7c4a0',
  '#95b8a0',
])

export const CATEGORY_COLORS = [
  '#d4644a', '#5b8def', '#c9a227', '#9b7ed9',
  '#3d9a8b', '#d47ba8', '#7a9e7e', '#e0956f',
  '#6a8caf', '#b8846e', '#8b7ec8', '#4a9c8c',
]

export function isThesisColor(color: string): boolean {
  return THESIS_LIKE_COLORS.has(color.toLowerCase())
}

export function ensureDistinctCategoryColor(color: string, index: number): string {
  return isThesisColor(color) ? getCategoryColor(index) : color
}

export function pickUniqueCategoryColor(existing: Category[], preferred?: string): string {
  const used = new Set(existing.map((c) => c.color.toLowerCase()))

  if (preferred && !used.has(preferred.toLowerCase()) && !isThesisColor(preferred)) {
    return preferred
  }

  for (const color of CATEGORY_COLORS) {
    const lower = color.toLowerCase()
    if (!used.has(lower) && !isThesisColor(color)) return color
  }

  for (let attempt = 0; attempt < 360; attempt++) {
    const hue = Math.round((existing.length * 137.508 + attempt * 53) % 360)
    const color = `hsl(${hue}, 68%, 55%)`
    if (!used.has(color.toLowerCase())) return color
  }

  return CATEGORY_COLORS[existing.length % CATEGORY_COLORS.length]
}

/** Mix a color toward white so subtopics read lighter than their parent topic. */
export function lightenColor(color: string, amount = 0.38): string {
  const t = Math.min(1, Math.max(0, amount))

  const hsl = color.match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i)
  if (hsl) {
    const h = Number(hsl[1])
    const s = Number(hsl[2])
    const l = Number(hsl[3])
    const nextL = Math.min(92, l + (100 - l) * t)
    const nextS = Math.max(18, s * (1 - t * 0.35))
    return `hsl(${Math.round(h)}, ${Math.round(nextS)}%, ${Math.round(nextL)}%)`
  }

  const hex = color.replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * t)
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

/** Display color: top-level topics keep their color; subtopics are a lighter tint of the parent. */
export function categoryDisplayColor(category: Category, categories: Category[]): string {
  if (!category.parentId) return category.color
  const parent = categories.find((c) => c.id === category.parentId)
  if (!parent) return lightenColor(category.color)
  return lightenColor(categoryDisplayColor(parent, categories))
}

export function assignUniqueCategoryColors(categories: Category[]): Category[] {
  const tops: Category[] = []
  const colored = new Map<string, Category>()

  for (const cat of categories) {
    if (cat.parentId) continue
    const next = {
      ...cat,
      color: pickUniqueCategoryColor(tops, ensureDistinctCategoryColor(cat.color, tops.length)),
    }
    tops.push(next)
    colored.set(next.id, next)
  }

  for (const cat of categories) {
    if (!cat.parentId) continue
    const parent = colored.get(cat.parentId) ?? categories.find((c) => c.id === cat.parentId)
    const base = parent ? (colored.get(parent.id)?.color ?? parent.color) : cat.color
    colored.set(cat.id, { ...cat, color: lightenColor(base) })
  }

  return categories.map((cat) => colored.get(cat.id) ?? cat)
}

const CATEGORY_ICONS = ['◈', '◇', '▣', '△', '▽', '◎', '✦', '◆', '▲', '▼', '●', '■']

const MIN_CATEGORY_DISTANCE = 220

export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

export function getCategoryIcon(index: number): string {
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length]
}

export function findNonOverlappingPosition(
  index: number,
  existing: Category[]
): { x: number; y: number } {
  const total = existing.length + 1

  for (let attempt = 0; attempt < total; attempt++) {
    const slot = (index + attempt) % total
    const position = nextCategoryRingPosition(slot, total)

    const overlaps = existing.some(
      (c) =>
        Math.hypot(c.position.x - position.x, c.position.y - position.y) <
        MIN_CATEGORY_DISTANCE
    )

    if (!overlaps) return position
  }

  return nextCategoryRingPosition(index, total)
}

export function createCategory(
  label: string,
  index: number,
  existing: Category[],
  options?: Partial<Pick<Category, 'description' | 'keywords' | 'isSuggested' | 'position' | 'parentId'>>
): Category {
  let position = options?.position
  if (!position && options?.parentId) {
    const parent = existing.find((c) => c.id === options.parentId)
    if (parent) {
      const siblings = existing.filter((c) => c.parentId === options.parentId).length
      position = {
        x: parent.position.x + 40 + siblings * 30,
        y: parent.position.y + 200,
      }
    }
  }

  const parent = options?.parentId
    ? existing.find((c) => c.id === options.parentId)
    : undefined

  return {
    id: uuidv4(),
    label,
    description: options?.description ?? `Sources related to ${label}`,
    color: parent
      ? lightenColor(categoryDisplayColor(parent, existing))
      : pickUniqueCategoryColor(existing),
    icon: getCategoryIcon(index),
    position: position ?? findNonOverlappingPosition(index, existing),
    keywords: options?.keywords ?? [label.toLowerCase()],
    isSuggested: options?.isSuggested ?? false,
    parentId: options?.parentId ?? null,
  }
}

export function getSubcategories(categories: Category[], parentId: string): Category[] {
  return categories.filter(cat => cat.parentId === parentId)
}

export function getTopLevelCategories(categories: Category[]): Category[] {
  return categories.filter(cat => !cat.parentId)
}

export function getCategoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = []
  let current = categories.find(c => c.id === categoryId)
  
  while (current) {
    path.unshift(current)
    current = current.parentId ? categories.find(c => c.id === current!.parentId) : undefined
  }
  
  return path
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

export function citationInCategory(citation: Citation, categoryId: string): boolean {
  return citation.categoryIds.includes(categoryId)
}

export function countCitationsInCategory(citations: Citation[], categoryId: string): number {
  return citations.filter((c) => citationInCategory(c, categoryId)).length
}

export function computeCitationPosition(
  citation: Citation,
  categories: Category[],
  index: number,
  allCitations: Citation[]
): { x: number; y: number } {
  if (citation.position) return citation.position

  const topicCount = categories.length

  if (citation.categoryIds.length > 0 && topicCount > 0) {
    const topicIndex = new Map(categories.map((c, i) => [c.id, i]))
    const linkedIndexes = citation.categoryIds
      .map((id) => topicIndex.get(id))
      .filter((idx): idx is number => idx !== undefined)

    if (linkedIndexes.length === 1) {
      const categoryId = citation.categoryIds[0]
      const topicIdx = linkedIndexes[0]
      const siblings = allCitations.filter(
        (c) => c.categoryIds.length === 1 && c.categoryIds[0] === categoryId
      )
      const sibIdx = siblings.findIndex((c) => c.id === citation.id)
      return nextSourceRingPosition(
        topicIdx,
        topicCount,
        sibIdx >= 0 ? sibIdx : index,
        siblings.length || 1
      )
    }

    if (linkedIndexes.length > 1) {
      const angles = linkedIndexes.map((idx) => categoryRingAngle(idx, topicCount))
      const sin = angles.reduce((s, a) => s + Math.sin(a), 0)
      const cos = angles.reduce((s, a) => s + Math.cos(a), 0)
      const baseAngle = Math.atan2(sin, cos)
      const siblings = allCitations.filter((c) => {
        const key = [...c.categoryIds].sort().join('|')
        const mine = [...citation.categoryIds].sort().join('|')
        return key === mine
      })
      const sibIdx = siblings.findIndex((c) => c.id === citation.id)
      const count = siblings.length || 1
      const spread = count === 1 ? 0 : Math.min(count * 0.12, 0.55)
      const angleOffset = count === 1 ? 0 : (sibIdx / (count - 1) - 0.5) * spread
      return outerRingPosition(topicCount, count, baseAngle + angleOffset, sibIdx >= 0 ? sibIdx : index)
    }
  }

  const unassigned = allCitations.filter((c) => c.categoryIds.length === 0)
  const unassignedIdx = unassigned.findIndex((c) => c.id === citation.id)
  const idx = unassignedIdx >= 0 ? unassignedIdx : index
  const count = unassigned.length || 1

  return nextUnassignedRingPosition(idx, count, categories)
}

export function primaryCitationColor(citation: Citation, categories: Category[]): string {
  const first = categories.find((c) => citation.categoryIds.includes(c.id))
  return first ? categoryDisplayColor(first, categories) : '#64748b'
}
