/**
 * Lightweight, 100% XSS-safe Markdown AST parser (produces structured blocks & inline tokens
 * rendered as native React elements without dangerouslySetInnerHTML).
 */

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; tokens: InlineToken[] }
  | { type: 'checklist'; checked: boolean; tokens: InlineToken[]; lineIndex: number }
  | { type: 'bullet'; tokens: InlineToken[] }
  | { type: 'quote'; tokens: InlineToken[] }
  | { type: 'hr' }
  | { type: 'paragraph'; tokens: InlineToken[] }

export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) })
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', value: raw.slice(1, -1) })
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) })
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }]
}

export function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      continue
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3
      blocks.push({
        type: 'heading',
        level,
        tokens: parseInlineMarkdown(headingMatch[2])
      })
      continue
    }

    const checklistMatch = /^[-*]\s+\[([ xX])\]\s+(.+)$/.exec(trimmed)
    if (checklistMatch) {
      blocks.push({
        type: 'checklist',
        checked: checklistMatch[1].toLowerCase() === 'x',
        tokens: parseInlineMarkdown(checklistMatch[2]),
        lineIndex: i
      })
      continue
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed)
    if (bulletMatch) {
      blocks.push({
        type: 'bullet',
        tokens: parseInlineMarkdown(bulletMatch[1])
      })
      continue
    }

    const quoteMatch = /^>\s+(.+)$/.exec(trimmed)
    if (quoteMatch) {
      blocks.push({
        type: 'quote',
        tokens: parseInlineMarkdown(quoteMatch[1])
      })
      continue
    }

    blocks.push({
      type: 'paragraph',
      tokens: parseInlineMarkdown(line)
    })
  }

  return blocks
}

export function toggleChecklistLine(source: string, lineIndex: number): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  if (lineIndex < 0 || lineIndex >= lines.length) return source
  lines[lineIndex] = lines[lineIndex].replace(
    /^(\s*[-*]\s+\[)([ xX])(\]\s+)/,
    (_m, pre: string, state: string, post: string) =>
      `${pre}${state.toLowerCase() === 'x' ? ' ' : 'x'}${post}`
  )
  return lines.join('\n')
}
