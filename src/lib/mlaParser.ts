import { v4 as uuidv4 } from 'uuid'
import type { Citation } from '../types'

export interface CitationFormData {
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
  sourceType: Citation['sourceType']
  notes?: string
  quote?: string
}

export function createCitationFromForm(
  data: CitationFormData,
  categoryIds: string[] = []
): Citation {
  return {
    id: uuidv4(),
    ...data,
    categoryIds,
    createdAt: Date.now(),
  }
}

/** Attempt to parse a pasted MLA works-cited line into structured fields */
export function parseMLAString(raw: string): Partial<CitationFormData> {
  const text = raw.trim()
  if (!text) return {}

  const result: Partial<CitationFormData> = {
    sourceType: 'other',
  }

  // Website with URL
  const urlMatch = text.match(/(https?:\/\/[^\s.]+(?:\.[^\s.]+)*)/i)
  if (urlMatch) {
    result.url = urlMatch[1].replace(/\.$/, '')
    result.sourceType = 'website'
    const accessMatch = text.match(/Accessed\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i)
    if (accessMatch) result.accessDate = accessMatch[1]
  }

  // Author: everything before first period followed by quote or italic title
  const authorMatch = text.match(/^([^."*]+?)\.\s+/)
  if (authorMatch) {
    result.author = authorMatch[1].trim()
  }

  // Quoted title (articles, web pages)
  const quotedTitle = text.match(/"([^"]+)"/)
  if (quotedTitle) {
    result.title = quotedTitle[1]
    result.sourceType = result.sourceType === 'website' ? 'website' : 'article'
  }

  // Italic title (books, journals) — represented without markdown in plain text
  if (!result.title) {
    const italicMatch = text.match(/\*([^*]+)\*/)
    if (italicMatch) {
      result.title = italicMatch[1]
      result.sourceType = 'book'
    }
  }

  // Container title after quoted title
  const containerMatch = text.match(/"\s*[^"]+"\s*[*]?([^*,.]+)[*]?,/)
  if (containerMatch) {
    result.containerTitle = containerMatch[1].trim()
    result.sourceType = 'journal'
  }

  const volMatch = text.match(/vol\.\s*(\d+)/i)
  if (volMatch) result.volume = volMatch[1]

  const issueMatch = text.match(/no\.\s*(\d+)/i)
  if (issueMatch) result.issue = issueMatch[1]

  const pagesMatch = text.match(/pp?\.\s*([\d–\-]+)/i)
  if (pagesMatch) result.pages = pagesMatch[1]

  const yearMatch = text.match(/(?:,\s*)(\d{4})(?:,|\.)/)
  if (yearMatch) result.publicationDate = yearMatch[1]

  const publisherMatch = text.match(/\d{4},\s*([^,]+),/)
  if (publisherMatch && result.sourceType === 'book') {
    result.publisher = publisherMatch[1].trim()
  }

  return result
}

export function detectSourceType(data: Partial<CitationFormData>): Citation['sourceType'] {
  if (data.url) return 'website'
  if (data.containerTitle && data.volume) return 'journal'
  if (data.containerTitle) return 'article'
  if (data.publisher && !data.containerTitle) return 'book'
  return data.sourceType ?? 'other'
}

function bibField(entry: string, field: string): string | undefined {
  const regex = new RegExp(`${field}\\s*=\\s*(?:\\{([^}]*)\\}|"([^"]*)")`, 'i')
  const match = entry.match(regex)
  return (match?.[1] ?? match?.[2])?.trim()
}

function parseBibTeXEntry(entry: string): Partial<CitationFormData> {
  const type = entry.match(/@(\w+)/)?.[1]?.toLowerCase()
  const author = bibField(entry, 'author')?.replace(/\s+and\s+/gi, ' and ')
  const title = bibField(entry, 'title')
  const journal = bibField(entry, 'journal')
  const publisher = bibField(entry, 'publisher')
  const year = bibField(entry, 'year')
  const volume = bibField(entry, 'volume')
  const number = bibField(entry, 'number')
  const pages = bibField(entry, 'pages')
  const url = bibField(entry, 'url')

  let sourceType: Citation['sourceType'] = 'other'
  if (type === 'book') sourceType = 'book'
  else if (type === 'article' && journal) sourceType = 'journal'
  else if (type === 'article') sourceType = 'article'
  else if (type === 'online' || type === 'misc' || url) sourceType = 'website'

  return {
    author: author ?? '',
    title: title ?? '',
    containerTitle: journal,
    publisher,
    publicationDate: year,
    volume,
    issue: number,
    pages,
    url,
    sourceType,
  }
}

function parseRIS(content: string): Partial<CitationFormData>[] {
  const entries: Partial<CitationFormData>[] = []
  const blocks = content.split(/\n(?=TY\s+-)/).filter((b) => b.trim().startsWith('TY'))

  for (const block of blocks) {
    const field = (tag: string) => {
      const match = block.match(new RegExp(`^${tag}\\s+-\\s+(.+)$`, 'im'))
      return match?.[1]?.trim()
    }

    const authors = [...block.matchAll(/^AU\s+-\s+(.+)$/gim)].map((m) => m[1].trim())
    const type = field('TY')?.toLowerCase()

    let sourceType: Citation['sourceType'] = 'other'
    if (type === 'book') sourceType = 'book'
    else if (type === 'jour') sourceType = 'journal'
    else if (type === 'web') sourceType = 'website'
    else if (type === 'mgz' || type === 'news') sourceType = 'article'

    entries.push({
      author: authors.join(' and ') || field('A1') || '',
      title: field('TI') || field('T1') || '',
      containerTitle: field('JO') || field('JF') || field('T2') || '',
      publisher: field('PB') || '',
      publicationDate: field('PY') || field('Y1') || '',
      volume: field('VL') || '',
      issue: field('IS') || '',
      pages: field('SP') ? `${field('SP')}${field('EP') ? `-${field('EP')}` : ''}` : '',
      url: field('UR') || field('DO') || '',
      sourceType,
    })
  }

  return entries
}

function parseCSV(content: string): Partial<CitationFormData>[] {
  const lines = content.replace(/\r\n/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
  const col = (row: string[], names: string[]) => {
    for (const name of names) {
      const idx = headers.indexOf(name)
      if (idx >= 0) return row[idx]?.replace(/^"|"$/g, '').trim()
    }
    return undefined
  }

  return lines.slice(1).map((line) => {
    const row = line.match(/("([^"]|"")*"|[^,]+)/g)?.map((c) => c.replace(/""/g, '"').replace(/^"|"$/g, '')) ?? []
    const author = col(row, ['author', 'authors', 'creator']) ?? ''
    const title = col(row, ['title', 'name']) ?? ''
    const url = col(row, ['url', 'link', 'uri'])

    return {
      author,
      title,
      containerTitle: col(row, ['journal', 'container', 'publication']),
      publisher: col(row, ['publisher']),
      publicationDate: col(row, ['year', 'date', 'publication date']),
      volume: col(row, ['volume', 'vol']),
      issue: col(row, ['issue', 'number']),
      pages: col(row, ['pages', 'page']),
      url,
      sourceType: url ? 'website' as const : 'article' as const,
    }
  }).filter((e) => e.author || e.title)
}

function normalizeEntry(data: Partial<CitationFormData>): CitationFormData {
  const sourceType = detectSourceType(data)
  return {
    author: data.author?.trim() || 'Unknown Author',
    title: data.title?.trim() || 'Untitled Source',
    containerTitle: data.containerTitle ?? '',
    publisher: data.publisher ?? '',
    publicationDate: data.publicationDate ?? '',
    volume: data.volume ?? '',
    issue: data.issue ?? '',
    pages: data.pages ?? '',
    url: data.url ?? '',
    accessDate: data.accessDate ?? '',
    sourceType,
    notes: data.notes ?? '',
    quote: data.quote ?? '',
  }
}

function splitBibliographyEntries(text: string, format: 'mla' | 'bib'): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  if (format === 'bib') {
    return normalized
      .split(/(?=@\w+\s*\{)/)
      .map((e) => e.trim())
      .filter((e) => e.startsWith('@'))
  }

  // MLA hanging indent: new entry starts with author pattern (Capital letter, not indented)
  const hanging = normalized.split(/\n(?=[A-Z][^\n]{2,}?\.\s)/)
  if (hanging.length > 1) {
    return hanging.map((e) => e.replace(/^\s*\d+\.\s*/, '').replace(/\n\s+/g, ' ').trim()).filter(Boolean)
  }

  const byParagraph = normalized
    .split(/\n\s*\n+/)
    .map((e) => e.replace(/^\s*\d+\.\s*/, '').replace(/\n\s+/g, ' ').trim())
    .filter(Boolean)

  if (byParagraph.length > 1) return byParagraph

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)
  const numbered = lines.filter((l) => /^\d+\.\s+/.test(l))
  if (numbered.length > 1) {
    return numbered.map((l) => l.replace(/^\d+\.\s*/, '').trim())
  }

  return [normalized.replace(/^\d+\.\s*/, '').replace(/\n\s+/g, ' ').trim()]
}

export function parseBibliography(content: string, filename = ''): CitationFormData[] {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))

  if (ext === '.ris' || content.trim().startsWith('TY  -')) {
    return parseRIS(content).map(normalizeEntry).filter(isValidEntry)
  }

  if (ext === '.csv') {
    return parseCSV(content).map(normalizeEntry).filter(isValidEntry)
  }

  const isBibTeX = ext === '.bib' || content.trim().startsWith('@')
  const entries = splitBibliographyEntries(content, isBibTeX ? 'bib' : 'mla')

  return entries
    .map((raw) => {
      const parsed = isBibTeX ? parseBibTeXEntry(raw) : parseMLAString(raw)
      return normalizeEntry(parsed)
    })
    .filter(isValidEntry)
}

function isValidEntry(c: CitationFormData): boolean {
  return c.author !== 'Unknown Author' || c.title !== 'Untitled Source'
}

export function deduplicateEntries(entries: CitationFormData[]): CitationFormData[] {
  const seen = new Set<string>()
  return entries.filter((e) => {
    const key = `${e.author.toLowerCase()}|${e.title.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function parseBibliographyFiles(files: File[]): Promise<{
  entries: CitationFormData[]
  fileResults: { name: string; count: number }[]
}> {
  const fileResults: { name: string; count: number }[] = []
  const allEntries: CitationFormData[] = []

  for (const file of files) {
    const content = await file.text()
    const parsed = parseBibliography(content, file.name)
    fileResults.push({ name: file.name, count: parsed.length })
    allEntries.push(...parsed)
  }

  return { entries: deduplicateEntries(allEntries), fileResults }
}

