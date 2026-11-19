import { CheckSquare, Square } from '@phosphor-icons/react'
import {
  parseMarkdownBlocks,
  type InlineToken
} from '@shared/markdown/parseMarkdown'

interface MarkdownPreviewProps {
  content: string
  onToggleChecklist?: (lineIndex: number) => void
}

function renderInlineTokens(tokens: InlineToken[]): React.ReactNode {
  return tokens.map((token, idx) => {
    switch (token.type) {
      case 'bold':
        return (
          <strong key={idx} className="font-semibold text-ink dark:text-obsidian-ink">
            {token.value}
          </strong>
        )
      case 'italic':
        return (
          <em key={idx} className="italic">
            {token.value}
          </em>
        )
      case 'code':
        return (
          <code
            key={idx}
            className="font-mono-tabular rounded-[2px] border border-hairline bg-paper-subtle px-1 py-0.5 text-[12px] text-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated"
          >
            {token.value}
          </code>
        )
      default:
        return <span key={idx}>{token.value}</span>
    }
  })
}

export function MarkdownPreview({
  content,
  onToggleChecklist
}: MarkdownPreviewProps): React.JSX.Element {
  const blocks = parseMarkdownBlocks(content)

  if (blocks.length === 0) {
    return (
      <div className="py-6 text-[13px] italic text-ink-muted dark:text-obsidian-muted">
        Chưa có nội dung ghi chú cho ngày này. Hỗ trợ tiêu đề (`#`), **in đậm**, *in nghiêng*,
        `code`, danh sách (`-`) và checklist (`- [ ]`).
      </div>
    )
  }

  return (
    <div className="space-y-2.5 text-[14px] leading-relaxed text-ink dark:text-obsidian-ink">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            if (block.level === 1) {
              return (
                <h1 key={idx} className="pt-1 text-[20px] font-bold tracking-tight">
                  {renderInlineTokens(block.tokens)}
                </h1>
              )
            }
            if (block.level === 2) {
              return (
                <h2 key={idx} className="pt-1 text-[16.5px] font-bold tracking-tight">
                  {renderInlineTokens(block.tokens)}
                </h2>
              )
            }
            return (
              <h3 key={idx} className="pt-0.5 text-[14.5px] font-semibold">
                {renderInlineTokens(block.tokens)}
              </h3>
            )
          case 'checklist':
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onToggleChecklist?.(block.lineIndex)}
                className="flex w-full items-start gap-2 rounded-[2px] py-0.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                {block.checked ? (
                  <CheckSquare size={17} weight="fill" className="mt-0.5 shrink-0 text-jade" />
                ) : (
                  <Square
                    size={17}
                    className="mt-0.5 shrink-0 text-ink-muted dark:text-obsidian-muted"
                  />
                )}
                <span
                  className={
                    block.checked
                      ? 'text-ink-muted line-through dark:text-obsidian-muted'
                      : undefined
                  }
                >
                  {renderInlineTokens(block.tokens)}
                </span>
              </button>
            )
          case 'bullet':
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vermilion" />
                <span>{renderInlineTokens(block.tokens)}</span>
              </div>
            )
          case 'quote':
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-vermilion bg-paper-subtle px-3 py-1.5 text-[13.5px] italic text-ink-muted dark:bg-obsidian-elevated dark:text-obsidian-muted"
              >
                {renderInlineTokens(block.tokens)}
              </blockquote>
            )
          case 'hr':
            return <hr key={idx} className="my-3 border-hairline dark:border-obsidian-border" />
          default:
            return <p key={idx}>{renderInlineTokens(block.tokens)}</p>
        }
      })}
    </div>
  )
}
