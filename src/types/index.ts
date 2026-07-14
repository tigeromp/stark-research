export interface OutlineSection {
  id: string
  title: string
  content: string
  citationIds: string[]
  order: number
}

export interface Category {
  id: string
  label: string
  description: string
  color: string
  icon: string
  position: { x: number; y: number }
  keywords: string[]
  isSuggested: boolean
  parentId?: string | null  // For nested subcategories
}

export interface MapConnection {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export interface Citation {
  id: string
  author: string
  title: string
  containerTitle?: string
  publisher?: string
  publicationDate?: string
  volume?: string
  issue?: string
  pages?: string
  url?: string
  accessDate?: string
  sourceType: 'book' | 'article' | 'website' | 'journal' | 'other'
  notes?: string
  categoryIds: string[]
  position?: { x: number; y: number }
  quote?: string
  createdAt: number
}

export interface ResearchProject {
  id: string
  name: string
  thesis: string
  citations: Citation[]
  categories: Category[]
  connections: MapConnection[]
  outline: OutlineSection[]
  createdAt: number
  updatedAt: number
}

export interface CitationNodeData {
  citation: Citation
  label: string
  color: string
}

export interface CategoryNodeData {
  category: Category
  citationCount: number
}

export interface ThesisNodeData {
  thesis: string
  projectName: string
}

export type NodeKind = 'thesis' | 'category' | 'citation'

export function parseNodeId(nodeId: string): { kind: NodeKind; id: string } | null {
  if (nodeId === 'thesis-center') return { kind: 'thesis', id: 'thesis-center' }
  if (nodeId.startsWith('category-')) return { kind: 'category', id: nodeId.slice(9) }
  if (nodeId.startsWith('citation-')) return { kind: 'citation', id: nodeId.slice(9) }
  return null
}
