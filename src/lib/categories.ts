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

export function assignUniqueCategoryColors(categories: Category[]): Category[] {
  const result: Category[] = []
  for (const cat of categories) {
    result.push({
      ...cat,
      color: pickUniqueCategoryColor(result, ensureDistinctCategoryColor(cat.color, result.length)),
    })
  }
  return result
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

  return {
    id: uuidv4(),
    label,
    description: options?.description ?? `Sources related to ${label}`,
    color: pickUniqueCategoryColor(existing),
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
  return first?.color ?? '#64748b'
}
