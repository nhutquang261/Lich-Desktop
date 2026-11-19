import { describe, expect, it } from 'vitest'
import {
  parseInlineMarkdown,
  parseMarkdownBlocks,
  toggleChecklistLine
} from '@shared/markdown/parseMarkdown'

describe('Safe Markdown Parser', () => {
  it('parses headings, checklists, bullets, quotes, and inline tokens', () => {
    const src = [
      '## Kế hoạch hôm nay',
      '- [ ] Đọc **Clean Code** và `vitest`',
      '- [x] Chạy bộ *buổi sáng*',
      '> Tập trung làm từng việc một',
      '---',
      '- Gạch đầu dòng thường'
    ].join('\n')

    const blocks = parseMarkdownBlocks(src)
    expect(blocks).toHaveLength(6)
    expect(blocks[0].type).toBe('heading')
    expect(blocks[1]).toMatchObject({ type: 'checklist', checked: false, lineIndex: 1 })
    expect(blocks[2]).toMatchObject({ type: 'checklist', checked: true, lineIndex: 2 })
    expect(blocks[3].type).toBe('quote')
    expect(blocks[4].type).toBe('hr')
    expect(blocks[5].type).toBe('bullet')
  })

  it('toggles checklist item state cleanly on a specific line', () => {
    const src = '## Tasks\n- [ ] Item A\n- [x] Item B'
    const toggled1 = toggleChecklistLine(src, 1)
    expect(toggled1).toBe('## Tasks\n- [x] Item A\n- [x] Item B')

    const toggled2 = toggleChecklistLine(toggled1, 2)
    expect(toggled2).toBe('## Tasks\n- [x] Item A\n- [ ] Item B')
  })

  it('keeps raw HTML as inert plain text tokens (XSS-safe)', () => {
    const tokens = parseInlineMarkdown('<script>alert(1)</script> **ok**')
    expect(tokens[0]).toEqual({ type: 'text', value: '<script>alert(1)</script> ' })
    expect(tokens[1]).toEqual({ type: 'bold', value: 'ok' })
  })
})
