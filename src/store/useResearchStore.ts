import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Citation, ResearchProject, Category, MapConnection, OutlineSection } from '../types'
import type { CitationFormData } from '../lib/mlaParser'
import { createCitationFromForm } from '../lib/mlaParser'
import { createCategory, citationInCategory, assignUniqueCategoryColors } from '../lib/categories'
import { organizeLayout as computeOrganizeLayout } from '../lib/layoutGraph'
import { citationMatchesKeyword, categoryIdsFromKeywordMatch } from '../lib/categorySuggestions'
import {
  parseCategoryCitationLink,
  isStructuralConnection,
  connectionExists,
} from '../lib/graphUtils'
import { createDefaultOutline, sortOutlineSections } from '../lib/outline'

interface ResearchState {
  project: ResearchProject
  projects: ResearchProject[]
  activeProjectId: string
  selectedCitationId: string | null
  selectedCategoryId: string | null
  thesisSelected: boolean
  activePanel: 'citations' | 'outline' | 'works-cited' | 'export' | 'papers'
  sourceInputOpen: boolean
  selectedOutlineSectionId: string | null

  createPaper: (name?: string) => string
  switchPaper: (id: string) => void
  deletePaper: (id: string) => boolean
  renamePaper: (id: string, name: string) => void
  setThesis: (thesis: string) => void
  setProjectName: (name: string) => void
  toggleSourceInput: () => void
  setSourceInputOpen: (open: boolean) => void
  addCitation: (data: CitationFormData, categoryIds?: string[]) => void
  importBibliography: (entries: CitationFormData[]) => number
  updateCitation: (id: string, data: Partial<Citation>) => void
  removeCitation: (id: string) => void
  toggleCitationCategory: (citationId: string, categoryId: string) => void
  linkCitationToCategory: (citationId: string, categoryId: string) => void
  unlinkCitationFromCategory: (citationId: string, categoryId: string) => void
  selectCitation: (id: string | null) => void
  selectCategory: (id: string | null) => void
  selectThesis: () => void
  clearMapSelection: () => void
  setActivePanel: (panel: 'citations' | 'outline' | 'works-cited' | 'export' | 'papers') => void
  selectOutlineSection: (id: string | null) => void
  addOutlineSection: (title?: string) => OutlineSection
  removeOutlineSection: (id: string) => void
  updateOutlineSection: (id: string, data: Partial<Pick<OutlineSection, 'title' | 'content'>>) => void
  moveOutlineSection: (id: string, direction: 'up' | 'down') => void
  toggleOutlineCitation: (sectionId: string, citationId: string) => void
  linkCategoryToOutlineSection: (sectionId: string, categoryId: string) => void
  addCategory: (label: string, options?: { keywords?: string[]; isSuggested?: boolean; connectToThesis?: boolean }) => Category
  removeCategory: (id: string) => void
  updateCategory: (id: string, data: Partial<Category>) => void
  updateCategoryPosition: (id: string, position: { x: number; y: number }) => void
  updateCitationPosition: (id: string, position: { x: number; y: number }) => void
  organizeMap: () => void
  handleMapConnect: (source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null) => void
  handleMapDisconnect: (edgeId: string, source: string, target: string) => void
  removeConnection: (id: string) => void
  getCitationsByCategory: (categoryId: string) => Citation[]
  resetProject: () => void
}

function createDefaultProject(): ResearchProject {
  return {
    id: uuidv4(),
    name: 'Untitled Research',
    thesis: '',
    citations: [],
    categories: [],
    connections: [],
    outline: createDefaultOutline(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function migrateCitation(c: Record<string, unknown>): Citation {
  const raw = c as unknown as Citation & { categoryId?: string | null; sectionId?: string | null }
  let categoryIds = raw.categoryIds ?? []
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    const single = raw.categoryId ?? raw.sectionId
    categoryIds = single ? [single] : []
  }
  const { categoryId: _c, sectionId: _s, ...rest } = raw as Citation & { categoryId?: string; sectionId?: string }
  return { ...rest, categoryIds }
}

function syncProject(
  state: { project: ResearchProject; projects: ResearchProject[] },
  project: ResearchProject
): Pick<ResearchState, 'project' | 'projects'> {
  return {
    project,
    projects: state.projects.map((p) => (p.id === project.id ? project : p)),
  }
}

const clearMapUi = {
  selectedCitationId: null as string | null,
  selectedCategoryId: null as string | null,
  thesisSelected: false,
  selectedOutlineSectionId: null as string | null,
}

function migrateProject(raw: unknown): ResearchProject {
  const p = raw as Record<string, unknown>
  if (!p || typeof p !== 'object') return createDefaultProject()

  return {
    id: (p.id as string) ?? uuidv4(),
    name: (p.name as string) ?? 'Untitled Research',
    thesis: (p.thesis as string) ?? '',
    citations: ((p.citations as Record<string, unknown>[]) ?? []).map(migrateCitation),
    categories: assignUniqueCategoryColors((p.categories as Category[]) ?? []),
    connections: (p.connections as MapConnection[]) ?? [],
    outline:
      Array.isArray(p.outline) && (p.outline as OutlineSection[]).length > 0
        ? sortOutlineSections(p.outline as OutlineSection[])
        : createDefaultOutline(),
    createdAt: (p.createdAt as number) ?? Date.now(),
    updatedAt: (p.updatedAt as number) ?? Date.now(),
  }
}

const initialProject = createDefaultProject()

export const useResearchStore = create<ResearchState>()(
  persist(
    (set, get) => ({
      project: initialProject,
      projects: [initialProject],
      activeProjectId: initialProject.id,
      selectedCitationId: null,
      selectedCategoryId: null,
      thesisSelected: false,
      activePanel: 'citations',
      sourceInputOpen: false,
      selectedOutlineSectionId: null,

      createPaper: (name = 'Untitled Research') => {
        const paper = createDefaultProject()
        paper.name = name
        set({
          projects: [...get().projects, paper],
          activeProjectId: paper.id,
          project: paper,
          ...clearMapUi,
        })
        return paper.id
      },

      switchPaper: (id) => {
        const paper = get().projects.find((p) => p.id === id)
        if (!paper || paper.id === get().activeProjectId) return
        set({
          activeProjectId: id,
          project: paper,
          ...clearMapUi,
        })
      },

      deletePaper: (id) => {
        const { projects, activeProjectId } = get()
        if (projects.length <= 1) return false
        const remaining = projects.filter((p) => p.id !== id)
        if (remaining.length === projects.length) return false
        if (id === activeProjectId) {
          const next = remaining[0]
          set({
            projects: remaining,
            activeProjectId: next.id,
            project: next,
            ...clearMapUi,
          })
        } else {
          set({ projects: remaining })
        }
        return true
      },

      renamePaper: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => {
          const projects = state.projects.map((p) =>
            p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p
          )
          const project =
            state.project.id === id
              ? (projects.find((p) => p.id === id) ?? state.project)
              : state.project
          return { projects, project }
        })
      },

      setThesis: (thesis) =>
        set((state) =>
          syncProject(state, { ...state.project, thesis, updatedAt: Date.now() })
        ),

      setProjectName: (name) =>
        set((state) => {
          const project = { ...state.project, name, updatedAt: Date.now() }
          return syncProject(state, project)
        }),

      toggleSourceInput: () => set((s) => ({ sourceInputOpen: !s.sourceInputOpen })),
      setSourceInputOpen: (sourceInputOpen) => set({ sourceInputOpen }),

      addCitation: (data, categoryIds = []) =>
        set((state) => {
          const citation = createCitationFromForm(data, categoryIds)
          return {
            ...syncProject(state, {
              ...state.project,
              citations: [...state.project.citations, citation],
              updatedAt: Date.now(),
            }),
            selectedCitationId: citation.id,
            thesisSelected: false,
          }
        }),

      importBibliography: (entries) => {
        const citations = entries.map((data) => createCitationFromForm(data, []))
        set((state) => ({
          ...syncProject(state, {
            ...state.project,
            citations: [...state.project.citations, ...citations],
            updatedAt: Date.now(),
          }),
          selectedCitationId: citations[citations.length - 1]?.id ?? state.selectedCitationId,
          thesisSelected: false,
        }))
        return citations.length
      },

      updateCitation: (id, data) =>
        set((state) => {
          const categories = state.project.categories
          const citations = state.project.citations.map((c) => {
            if (c.id !== id) return c
            const updated = { ...c, ...data }
            if ('notes' in data) {
              return {
                ...updated,
                categoryIds: categoryIdsFromKeywordMatch(updated, categories),
              }
            }
            return updated
          })
          return syncProject(state, {
            ...state.project,
            citations,
            updatedAt: Date.now(),
          })
        }),

      removeCitation: (id) =>
        set((state) => ({
          ...syncProject(state, {
            ...state.project,
            citations: state.project.citations.filter((c) => c.id !== id),
            connections: state.project.connections.filter(
              (c) => c.source !== `citation-${id}` && c.target !== `citation-${id}`
            ),
            outline: state.project.outline.map((s) => ({
              ...s,
              citationIds: s.citationIds.filter((cid) => cid !== id),
            })),
            updatedAt: Date.now(),
          }),
          selectedCitationId:
            state.selectedCitationId === id ? null : state.selectedCitationId,
        })),

      linkCitationToCategory: (citationId, categoryId) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            citations: state.project.citations.map((c) =>
              c.id === citationId && !c.categoryIds.includes(categoryId)
                ? { ...c, categoryIds: [...c.categoryIds, categoryId] }
                : c
            ),
            updatedAt: Date.now(),
          })
        ),

      unlinkCitationFromCategory: (citationId, categoryId) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            citations: state.project.citations.map((c) =>
              c.id === citationId
                ? { ...c, categoryIds: c.categoryIds.filter((id) => id !== categoryId) }
                : c
            ),
            updatedAt: Date.now(),
          })
        ),

      toggleCitationCategory: (citationId, categoryId) => {
        const citation = get().project.citations.find((c) => c.id === citationId)
        if (!citation) return
        if (citation.categoryIds.includes(categoryId)) {
          get().unlinkCitationFromCategory(citationId, categoryId)
        } else {
          get().linkCitationToCategory(citationId, categoryId)
        }
      },

      selectCitation: (id) =>
        set({ selectedCitationId: id, selectedCategoryId: null, thesisSelected: false }),
      selectCategory: (id) =>
        set({ selectedCategoryId: id, selectedCitationId: null, thesisSelected: false }),
      selectThesis: () =>
        set({ thesisSelected: true, selectedCitationId: null, selectedCategoryId: null }),
      clearMapSelection: () =>
        set({ thesisSelected: false, selectedCitationId: null, selectedCategoryId: null }),

      setActivePanel: (panel) => set({ activePanel: panel }),

      selectOutlineSection: (id) => set({ selectedOutlineSectionId: id }),

      addOutlineSection: (title = 'New Section') => {
        const state = get()
        const maxOrder = state.project.outline.reduce((m, s) => Math.max(m, s.order), -1)
        const section: OutlineSection = {
          id: uuidv4(),
          title,
          content: '',
          citationIds: [],
          order: maxOrder + 1,
        }
        set((state) => ({
          ...syncProject(state, {
            ...state.project,
            outline: [...state.project.outline, section],
            updatedAt: Date.now(),
          }),
          selectedOutlineSectionId: section.id,
        }))
        return section
      },

      removeOutlineSection: (id) =>
        set((state) => {
          const remaining = state.project.outline.filter((s) => s.id !== id)
          const sorted = sortOutlineSections(remaining).map((s, i) => ({ ...s, order: i }))
          return {
            ...syncProject(state, {
              ...state.project,
              outline: sorted,
              updatedAt: Date.now(),
            }),
            selectedOutlineSectionId:
              state.selectedOutlineSectionId === id
                ? sorted[0]?.id ?? null
                : state.selectedOutlineSectionId,
          }
        }),

      updateOutlineSection: (id, data) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            outline: state.project.outline.map((s) =>
              s.id === id ? { ...s, ...data } : s
            ),
            updatedAt: Date.now(),
          })
        ),

      moveOutlineSection: (id, direction) =>
        set((state) => {
          const sorted = sortOutlineSections(state.project.outline)
          const idx = sorted.findIndex((s) => s.id === id)
          if (idx < 0) return state
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= sorted.length) return state

          const next = [...sorted]
          ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
          const reordered = next.map((s, i) => ({ ...s, order: i }))

          return syncProject(state, {
            ...state.project,
            outline: reordered,
            updatedAt: Date.now(),
          })
        }),

      toggleOutlineCitation: (sectionId, citationId) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            outline: state.project.outline.map((s) => {
              if (s.id !== sectionId) return s
              const has = s.citationIds.includes(citationId)
              return {
                ...s,
                citationIds: has
                  ? s.citationIds.filter((id) => id !== citationId)
                  : [...s.citationIds, citationId],
              }
            }),
            updatedAt: Date.now(),
          })
        ),

      linkCategoryToOutlineSection: (sectionId, categoryId) =>
        set((state) => {
          const categoryCitations = state.project.citations
            .filter((c) => c.categoryIds.includes(categoryId))
            .map((c) => c.id)

          return syncProject(state, {
            ...state.project,
            outline: state.project.outline.map((s) => {
              if (s.id !== sectionId) return s
              const merged = new Set([...s.citationIds, ...categoryCitations])
              return { ...s, citationIds: [...merged] }
            }),
            updatedAt: Date.now(),
          })
        }),

      addCategory: (label, options = {}) => {
        const state = get()
        const category = createCategory(
          label,
          state.project.categories.length,
          state.project.categories,
          {
            keywords: options.keywords ?? [label.toLowerCase()],
            isSuggested: options.isSuggested ?? false,
          }
        )

        const connections = [...state.project.connections]
        if (options.connectToThesis !== false) {
          connections.push({
            id: uuidv4(),
            source: 'thesis-center',
            target: `category-${category.id}`,
            sourceHandle: 'out',
            targetHandle: 'in',
          })
        }

        const citations = state.project.citations.map((c) => {
          const matches = category.keywords.some((kw) => citationMatchesKeyword(c, kw))
          if (!matches || citationInCategory(c, category.id)) return c
          return { ...c, categoryIds: [...c.categoryIds, category.id] }
        })

        set((state) => ({
          ...syncProject(state, {
            ...state.project,
            categories: [...state.project.categories, category],
            connections,
            citations,
            updatedAt: Date.now(),
          }),
          selectedCategoryId: category.id,
          thesisSelected: false,
        }))

        return category
      },

      removeCategory: (id) =>
        set((state) => ({
          ...syncProject(state, {
            ...state.project,
            categories: state.project.categories.filter((c) => c.id !== id),
            connections: state.project.connections.filter(
              (c) => c.source !== `category-${id}` && c.target !== `category-${id}`
            ),
            citations: state.project.citations.map((c) => ({
              ...c,
              categoryIds: c.categoryIds.filter((cid) => cid !== id),
            })),
            updatedAt: Date.now(),
          }),
          selectedCategoryId:
            state.selectedCategoryId === id ? null : state.selectedCategoryId,
        })),

      updateCategory: (id, data) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            categories: state.project.categories.map((c) =>
              c.id === id ? { ...c, ...data } : c
            ),
            updatedAt: Date.now(),
          })
        ),

      updateCategoryPosition: (id, position) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            categories: state.project.categories.map((c) =>
              c.id === id ? { ...c, position } : c
            ),
            updatedAt: Date.now(),
          })
        ),

      updateCitationPosition: (id, position) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            citations: state.project.citations.map((c) =>
              c.id === id ? { ...c, position } : c
            ),
            updatedAt: Date.now(),
          })
        ),

      organizeMap: () =>
        set((state) => {
          const { categoryPositions, citationPositions } = computeOrganizeLayout(
            state.project.categories,
            state.project.citations,
            state.project.connections
          )
          return syncProject(state, {
            ...state.project,
            categories: state.project.categories.map((c) => ({
              ...c,
              position: categoryPositions[c.id] ?? c.position,
            })),
            citations: state.project.citations.map((c) => ({
              ...c,
              position: citationPositions[c.id] ?? c.position,
            })),
            updatedAt: Date.now(),
          })
        }),

      handleMapConnect: (source, target, sourceHandle = null, targetHandle = null) => {
        if (source === target) return

        const assignment = parseCategoryCitationLink(source, target)
        if (assignment) {
          get().linkCitationToCategory(assignment.citationId, assignment.categoryId)
          return
        }

        if (!isStructuralConnection(source, target)) return

        set((state) => {
          if (connectionExists(state.project.connections, source, target)) return state
          return syncProject(state, {
            ...state.project,
            connections: [
              ...state.project.connections,
              { id: uuidv4(), source, target, sourceHandle, targetHandle },
            ],
            updatedAt: Date.now(),
          })
        })
      },

      handleMapDisconnect: (edgeId, source, target) => {
        if (edgeId.startsWith('edge-thesis-unassigned-')) return

        if (edgeId.startsWith('assign-')) {
          const assignment = parseCategoryCitationLink(source, target)
          if (assignment) {
            get().unlinkCitationFromCategory(assignment.citationId, assignment.categoryId)
          }
          return
        }
        get().removeConnection(edgeId)
      },

      removeConnection: (id) =>
        set((state) =>
          syncProject(state, {
            ...state.project,
            connections: state.project.connections.filter((c) => c.id !== id),
            updatedAt: Date.now(),
          })
        ),

      getCitationsByCategory: (categoryId) =>
        get().project.citations.filter((c) => citationInCategory(c, categoryId)),

      resetProject: () =>
        set((state) => ({
          ...syncProject(state, {
            ...createDefaultProject(),
            id: state.activeProjectId,
          }),
          ...clearMapUi,
        })),
    }),
    {
      name: 'arc-research-storage',
      version: 9,
      migrate: (persisted) => {
        const state = persisted as Partial<ResearchState> & { project?: unknown }

        if (Array.isArray(state.projects) && state.projects.length > 0 && state.activeProjectId) {
          const projects = state.projects.map(migrateProject)
          const active =
            projects.find((p) => p.id === state.activeProjectId) ?? projects[0]
          return {
            ...state,
            projects,
            activeProjectId: active.id,
            project: migrateProject(active),
          } as ResearchState
        }

        const project = migrateProject(state.project)
        return {
          ...state,
          projects: [project],
          activeProjectId: project.id,
          project,
        } as ResearchState
      },
    }
  )
)
