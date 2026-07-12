import { v4 as uuidv4 } from 'uuid'
import type { Citation, OutlineSection, ResearchProject } from '../types'
import { formatMLAInText } from './mla'

export function createDefaultOutline(): OutlineSection[] {
  const titles = [
    'Introduction',
    'Literature Review',
    'Methods / Approach',
    'Analysis & Argument',
    'Discussion',
    'Conclusion',
  ]
  return titles.map((title, order) => ({
    id: uuidv4(),
    title,
    content: '',
    citationIds: [],
    order,
  }))
}

export function sortOutlineSections(sections: OutlineSection[]): OutlineSection[] {
  return [...sections].sort((a, b) => a.order - b.order)
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function outlineWordCount(sections: OutlineSection[]): number {
  return sections.reduce((sum, s) => sum + countWords(s.content), 0)
}

export function buildOutlineExport(project: ResearchProject): string {
  const sections = sortOutlineSections(project.outline)
  const citeMap = new Map(project.citations.map((c) => [c.id, c]))
  const lines: string[] = [
    `# ${project.name}`,
    '',
    `## Thesis / Research Question`,
    project.thesis || '(not defined)',
    '',
  ]

  for (const section of sections) {
    lines.push(`## ${section.title}`)
    if (section.content.trim()) {
      lines.push(section.content.trim())
      lines.push('')
    }
    if (section.citationIds.length > 0) {
      lines.push('### Sources for this section')
      section.citationIds.forEach((id) => {
        const c = citeMap.get(id)
        if (!c) return
        lines.push(`- **${c.author}** — ${c.title}`)
        if (c.quote) lines.push(`  > "${c.quote}"`)
        if (c.notes) lines.push(`  _Notes: ${c.notes.slice(0, 500)}${c.notes.length > 500 ? '…' : ''}_`)
        lines.push(`  _In-text: ${formatMLAInText(c)}_`)
      })
      lines.push('')
    }
  }

  lines.push('## Works Cited')
  project.citations.forEach((c) => lines.push(`- ${c.author}. ${c.title}.`))

  return lines.join('\n')
}

export function buildDraftPreview(
  project: ResearchProject,
  sections: OutlineSection[]
): string {
  const citeMap = new Map(project.citations.map((c) => [c.id, c]))
  const parts: string[] = []

  if (project.thesis.trim()) {
    parts.push(project.thesis.trim())
    parts.push('')
  }

  for (const section of sections) {
    if (!section.content.trim() && section.citationIds.length === 0) continue
    parts.push(`[${section.title.toUpperCase()}]`)
    if (section.content.trim()) parts.push(section.content.trim())
    if (section.citationIds.length > 0) {
      const refs = section.citationIds
        .map((id) => citeMap.get(id))
        .filter(Boolean) as Citation[]
      if (refs.length) {
        parts.push('')
        parts.push(
          refs.map((c) => `(${formatMLAInText(c)})`).join(' ')
        )
      }
    }
    parts.push('')
  }

  return parts.join('\n').trim()
}
