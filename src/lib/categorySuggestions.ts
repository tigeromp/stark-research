import type { Citation } from '../types'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'for', 'to', 'with', 'by', 'from',
  'as', 'at', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'into', 'through', 'during', 'before', 'after', 'between', 'under',
  'over', 'again', 'further', 'then', 'once', 'when', 'where', 'why', 'how', 'all',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'against', 'study',
  'studies', 'research', 'analysis', 'review', 'introduction', 'conclusion', 'chapter',
  'volume', 'edition', 'press', 'university', 'journal', 'abstract', 'using', 'based',
  'new', 'approach', 'effects', 'impact', 'role', 'case', 'toward', 'towards', 'among',
  'within', 'without', 'through', 'across', 'between', 'their', 'this', 'that', 'these',
  'those', 'its', 'his', 'her', 'our', 'your', 'they', 'them', 'what', 'which', 'who',
  'also', 'however', 'therefore', 'because', 'although', 'while', 'note', 'notes',
  'source', 'sources', 'paper', 'article', 'book', 'chapter', 'section', 'page', 'pages',
])

export interface CategorySuggestion {
  keyword: string
  label: string
  count: number
  /** Sources where keyword appears in title or private notes */
  matchingSources: number
}

/** Text used for keyword matching and category suggestions */
export function citationSearchText(citation: Citation): string {
  return [citation.title, citation.author, citation.notes ?? ''].filter(Boolean).join(' ')
}

export function citationMatchesKeyword(citation: Citation, keyword: string): boolean {
  const needle = keyword.toLowerCase().trim()
  if (!needle) return false
  return citationSearchText(citation).toLowerCase().includes(needle)
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function suggestCategoriesFromCitations(
  citations: Citation[],
  existingLabels: string[]
): CategorySuggestion[] {
  if (citations.length === 0) return []

  const existing = new Set(existingLabels.map((l) => l.toLowerCase()))
  const wordCounts = new Map<string, number>()
  const wordSources = new Map<string, number>()

  for (const citation of citations) {
    const text = citationSearchText(citation)
    const words = extractWords(text)
    const seenInSource = new Set<string>()

    for (const word of words) {
      if (word.length < 4 || STOP_WORDS.has(word) || seenInSource.has(word)) continue
      seenInSource.add(word)
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1)
      if (text.toLowerCase().includes(word)) {
        wordSources.set(word, (wordSources.get(word) ?? 0) + 1)
      }
    }
  }

  const minCount = citations.length >= 4 ? 2 : 1

  return [...wordCounts.entries()]
    .filter(([word, count]) => count >= minCount && !existing.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword, count]) => ({
      keyword,
      label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
      count,
      matchingSources: wordSources.get(keyword) ?? count,
    }))
}

/** @deprecated Use suggestCategoriesFromCitations */
export function suggestCategoriesFromTitles(
  titles: string[],
  existingLabels: string[]
): CategorySuggestion[] {
  const citations = titles.map((title) => ({
    id: '',
    author: '',
    title,
    sourceType: 'other' as const,
    categoryIds: [],
    createdAt: 0,
  }))
  return suggestCategoriesFromCitations(citations, existingLabels)
}

/** @deprecated Use citationMatchesKeyword */
export function titleMatchesKeyword(title: string, keyword: string): boolean {
  return title.toLowerCase().includes(keyword.toLowerCase())
}

/** Add category links when title or private notes match category keywords */
export function categoryIdsFromKeywordMatch(
  citation: Citation,
  categories: { id: string; keywords: string[] }[]
): string[] {
  const matched = new Set(citation.categoryIds)

  categories.forEach((category) => {
    if (category.keywords.some((kw) => citationMatchesKeyword(citation, kw))) {
      matched.add(category.id)
    }
  })

  return [...matched]
}
