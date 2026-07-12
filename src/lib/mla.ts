import type { Citation } from '../types'

function formatAuthor(author: string): string {
  if (!author.trim()) return ''
  const parts = author.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return `${last}, ${first}`
}

function formatAuthorsForWorksCited(author: string): string {
  if (!author.trim()) return 'Unknown Author'
  if (author.includes(' and ')) {
    const authors = author.split(' and ')
    if (authors.length === 2) {
      return `${formatAuthor(authors[0].trim())}, and ${authors[1].trim()}`
    }
  }
  if (author.includes(',')) return author
  return formatAuthor(author)
}

export function formatMLAWorksCited(citation: Citation): string {
  const parts: string[] = []

  const author = formatAuthorsForWorksCited(citation.author)
  parts.push(`${author}.`)

  const title = citation.title
  if (citation.sourceType === 'book') {
    parts.push(`*${title}*.`)
  } else if (citation.sourceType === 'article' || citation.sourceType === 'journal') {
    parts.push(`"${title}."`)
  } else if (citation.sourceType === 'website') {
    parts.push(`"${title}."`)
  } else {
    parts.push(`"${title}."`)
  }

  if (citation.containerTitle) {
    if (citation.sourceType === 'book') {
      // no container for books typically
    } else {
      parts.push(`*${citation.containerTitle}*,`)
    }
  }

  if (citation.volume) {
    let volIssue = `vol. ${citation.volume}`
    if (citation.issue) volIssue += `, no. ${citation.issue}`
    parts.push(volIssue + ',')
  }

  if (citation.publicationDate) {
    parts.push(`${citation.publicationDate},`)
  }

  if (citation.publisher && citation.sourceType === 'book') {
    parts.push(`${citation.publisher},`)
  }

  if (citation.pages) {
    parts.push(`pp. ${citation.pages}.`)
  } else if (!citation.url) {
    const last = parts[parts.length - 1]
    if (last && !last.endsWith('.')) {
      parts[parts.length - 1] = last.replace(/,$/, '.')
    }
  }

  if (citation.url) {
    parts.push(`${citation.url}.`)
    if (citation.accessDate) {
      parts.push(`Accessed ${citation.accessDate}.`)
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function formatMLAInText(citation: Citation, page?: string): string {
  const author = citation.author.trim()
  if (!author) return '(Unknown)'

  let lastName = author
  if (author.includes(',')) {
    lastName = author.split(',')[0].trim()
  } else {
    const parts = author.split(/\s+/)
    lastName = parts[parts.length - 1]
  }

  if (page) return `(${lastName} ${page})`
  return `(${lastName})`
}

export function formatMLAWorksCitedPlain(citation: Citation): string {
  return formatMLAWorksCited(citation)
    .replace(/\*/g, '')
}

export function sortCitationsAlphabetically(citations: Citation[]): Citation[] {
  return [...citations].sort((a, b) => {
    const authorA = a.author.toLowerCase()
    const authorB = b.author.toLowerCase()
    return authorA.localeCompare(authorB)
  })
}

export function generateWorksCitedPage(citations: Citation[]): string {
  const sorted = sortCitationsAlphabetically(citations)
  const lines = sorted.map((c, i) => `${i + 1}. ${formatMLAWorksCitedPlain(c)}`)
  return ['Works Cited', '', ...lines].join('\n')
}
