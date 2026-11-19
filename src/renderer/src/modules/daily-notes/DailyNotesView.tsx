import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  Check,
  CheckSquare,
  Code,
  ListBullets,
  MagnifyingGlass,
  Notebook,
  TextB,
  TextHTwo,
  TextItalic
} from '@phosphor-icons/react'
import { addDaysISO, formatISODate } from '@shared/calendar/recurrence'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { toggleChecklistLine } from '@shared/markdown/parseMarkdown'
import type { DailyNote } from '@shared/types'
import { useAppStore } from '@renderer/core/store/useAppStore'
import { MarkdownPreview } from './MarkdownPreview'
import { getMoodMeta, MOOD_OPTIONS, type MoodValue } from './moodMeta'

type EditorMode = 'write' | 'split' | 'preview'

export function DailyNotesView(): React.JSX.Element {
  const { selectedDateISO, setSelectedDate, dailyNotes, saveDailyNote } = useAppStore()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<EditorMode>('split')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<DailyNote['mood']>(null)
  const [saveState, setSaveState] = useState<'saved' | 'dirty'>('saved')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const existing = useAppStore
      .getState()
      .dailyNotes.find((n) => n.note_date === selectedDateISO)
    setContent(existing?.content ?? '')
    setMood(existing?.mood ?? null)
    setSaveState('saved')
  }, [selectedDateISO])

  const persistNow = async (nextContent: string, nextMood: DailyNote['mood']): Promise<void> => {
    await saveDailyNote({
      note_date: selectedDateISO,
      content: nextContent,
      mood: nextMood
    })
    setSaveState('saved')
  }

  const handleContentChange = (next: string): void => {
    setContent(next)
    setSaveState('dirty')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void persistNow(next, mood)
    }, 550)
  }

  const handleMoodPick = (picked: MoodValue): void => {
    const nextMood = mood === picked ? null : picked
    setMood(nextMood)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    void persistNow(content, nextMood)
  }

  const insertSnippet = (snippet: string): void => {
    const el = textareaRef.current
    if (!el) {
      handleContentChange(content ? `${content}\n${snippet}` : snippet)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = `${content.slice(0, start)}${snippet}${content.slice(end)}`
    handleContentChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + snippet.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handleChecklistToggle = (lineIndex: number): void => {
    const updated = toggleChecklistLine(content, lineIndex)
    setContent(updated)
    void persistNow(updated, mood)
  }

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...dailyNotes]
      .filter((n) => n.content.trim().length > 0 || n.mood !== null)
      .filter((n) => {
        if (!q) return true
        return n.note_date.includes(q) || n.content.toLowerCase().includes(q)
      })
      .sort((a, b) => b.note_date.localeCompare(a.note_date))
  }, [dailyNotes, search])

  const currentMonthPrefix = selectedDateISO.slice(0, 7)
  const monthMoodCounts = useMemo(() => {
    const counts: Record<MoodValue, number> = {
      great: 0,
      good: 0,
      neutral: 0,
      low: 0,
      stressed: 0
    }
    for (const n of dailyNotes) {
      if (n.mood && n.note_date.startsWith(currentMonthPrefix)) {
        counts[n.mood] += 1
      }
    }
    return counts
  }, [dailyNotes, currentMonthPrefix])

  const lunar = getLunarInfoFromISO(selectedDateISO)
  const todayISO = formatISODate(new Date())

  return (
    <div className="flex flex-1 overflow-hidden bg-paper-subtle dark:bg-obsidian">
      {/* Left History & Search Rail */}
      <aside className="flex w-[268px] shrink-0 flex-col border-r border-hairline bg-paper dark:border-obsidian-border dark:bg-obsidian-surface">
        <div className="border-b border-hairline p-3 dark:border-obsidian-border">
          <div className="flex items-center gap-2 text-[14px] font-bold text-ink dark:text-obsidian-ink">
            <Notebook size={17} weight="fill" className="text-vermilion" />
            <span>Nhật ký & Ghi chú</span>
          </div>
          <div className="relative mt-2.5">
            <MagnifyingGlass
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-obsidian-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nội dung hoặc ngày..."
              className="w-full rounded-[2px] border border-hairline bg-paper-subtle py-1.5 pr-2.5 pl-8 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
          </div>
        </div>

        {/* Monthly Mood Breakdown */}
        <div className="border-b border-hairline bg-paper-subtle px-3 py-2.5 dark:border-obsidian-border dark:bg-obsidian-elevated/60">
          <div className="font-mono-tabular text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
            Tâm trạng tháng {selectedDateISO.slice(5, 7)}/{selectedDateISO.slice(0, 4)}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-1">
            {MOOD_OPTIONS.map(({ value, label, color, Icon }) => (
              <div
                key={value}
                title={label}
                className="flex flex-col items-center rounded-[2px] px-1.5 py-1"
              >
                <Icon size={16} weight="fill" style={{ color }} />
                <span className="font-mono-tabular mt-0.5 text-[11px] font-semibold text-ink dark:text-obsidian-ink">
                  {monthMoodCounts[value]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredNotes.length === 0 ? (
            <p className="px-2 py-4 text-center text-[12px] text-ink-muted dark:text-obsidian-muted">
              Chưa có trang nhật ký nào.
            </p>
          ) : (
            <div className="space-y-1">
              {filteredNotes.map((note) => {
                const mMeta = getMoodMeta(note.mood)
                const isSelected = note.note_date === selectedDateISO
                const snippet = note.content.replace(/[#*`[\]-]/g, '').trim()
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedDate(note.note_date)}
                    className={`flex w-full flex-col rounded-[2px] border px-2.5 py-2 text-left transition-colors ${
                      isSelected
                        ? 'border-vermilion/50 bg-vermilion/10 dark:bg-vermilion/15'
                        : 'border-transparent hover:bg-paper-subtle dark:hover:bg-obsidian-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-[12px] font-semibold text-ink dark:text-obsidian-ink">
                        {note.note_date}
                      </span>
                      {mMeta && (
                        <mMeta.Icon size={14} weight="fill" style={{ color: mMeta.color }} />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                      {snippet || (mMeta ? `Tâm trạng: ${mMeta.label}` : 'Ghi chú trống')}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Main Editor + Preview Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-paper dark:bg-obsidian">
        {/* Top Date & Mode Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-5 dark:border-obsidian-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDate(addDaysISO(selectedDateISO, -1))}
                aria-label="Ngày trước"
                className="rounded-[2px] border border-hairline p-1.5 text-ink hover:bg-paper-subtle dark:border-obsidian-border dark:text-obsidian-ink dark:hover:bg-obsidian-elevated"
              >
                <CaretLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayISO)}
                className="rounded-[2px] border border-hairline px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-paper-subtle dark:border-obsidian-border dark:text-obsidian-ink dark:hover:bg-obsidian-elevated"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(addDaysISO(selectedDateISO, 1))}
                aria-label="Ngày sau"
                className="rounded-[2px] border border-hairline p-1.5 text-ink hover:bg-paper-subtle dark:border-obsidian-border dark:text-obsidian-ink dark:hover:bg-obsidian-elevated"
              >
                <CaretRight size={14} />
              </button>
            </div>

            <div>
              <span className="font-mono-tabular text-[15px] font-bold text-ink dark:text-obsidian-ink">
                {selectedDateISO}
              </span>
              <span className="font-mono-tabular ml-2 text-[11.5px] text-vermilion">
                ÂL {lunar.day}/{lunar.month} · {lunar.canChiDay}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-tabular flex items-center gap-1 text-[11px] text-ink-muted dark:text-obsidian-muted">
              {saveState === 'saved' ? (
                <>
                  <Check size={13} className="text-jade" />
                  <span>Đã lưu cục bộ</span>
                </>
              ) : (
                <span>Đang lưu...</span>
              )}
            </span>

            <div className="flex rounded-[2px] border border-hairline bg-paper-subtle p-0.5 dark:border-obsidian-border dark:bg-obsidian-surface">
              {(
                [
                  { id: 'write', label: 'Viết' },
                  { id: 'split', label: 'Song song' },
                  { id: 'preview', label: 'Xem trước' }
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-[2px] px-2.5 py-1 text-[12px] font-medium ${
                    mode === m.id
                      ? 'bg-paper text-ink shadow-xs dark:bg-obsidian-elevated dark:text-obsidian-ink'
                      : 'text-ink-muted hover:text-ink dark:text-obsidian-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Mood Picker + Markdown Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-paper-subtle px-5 py-2.5 dark:border-obsidian-border dark:bg-obsidian-surface">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[12px] font-semibold text-ink-muted dark:text-obsidian-muted">
              Tâm trạng:
            </span>
            {MOOD_OPTIONS.map(({ value, label, color, Icon }) => {
              const active = mood === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleMoodPick(value)}
                  className={`flex items-center gap-1 rounded-[2px] border px-2 py-1 text-[12px] font-medium transition-colors ${
                    active
                      ? 'border-ink bg-paper text-ink dark:border-obsidian-ink dark:bg-obsidian-elevated dark:text-obsidian-ink'
                      : 'border-transparent text-ink-muted hover:border-hairline hover:bg-paper dark:text-obsidian-muted dark:hover:border-obsidian-border'
                  }`}
                >
                  <Icon size={15} weight={active ? 'fill' : 'regular'} style={{ color }} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {mode !== 'preview' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Tiêu đề H2"
                onClick={() => insertSnippet('## Tiêu đề\n')}
                className="rounded-[2px] p-1.5 text-ink-muted hover:bg-black/[0.06] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.08]"
              >
                <TextHTwo size={15} />
              </button>
              <button
                type="button"
                title="In đậm"
                onClick={() => insertSnippet('**chữ đậm**')}
                className="rounded-[2px] p-1.5 text-ink-muted hover:bg-black/[0.06] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.08]"
              >
                <TextB size={15} />
              </button>
              <button
                type="button"
                title="In nghiêng"
                onClick={() => insertSnippet('*in nghiêng*')}
                className="rounded-[2px] p-1.5 text-ink-muted hover:bg-black/[0.06] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.08]"
              >
                <TextItalic size={15} />
              </button>
              <button
                type="button"
                title="Checklist"
                onClick={() => insertSnippet('- [ ] Việc cần làm\n')}
                className="rounded-[2px] p-1.5 text-ink-muted hover:bg-black/[0.06] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.08]"
              >
                <CheckSquare size={15} />
              </button>
              <button
                type="button"
                title="Gạch đầu dòng"
                onClick={() => insertSnippet('- Gạch đầu dòng\n')}
                className="rounded-[2px] p-1.5 text-ink-muted hover:bg-black/[0.06] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.08]"
              >
                <ListBullets size={15} />
              </button>
              <button
                type="button"
                title="Đoạn mã"
                onClick={() => insertSnippet('`code`')}
                className="rounded-[2px] p-1.5 text-ink-muted hover:bg-black/[0.06] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.08]"
              >
                <Code size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Editor / Preview Canvas */}
        <div
          className={`grid min-h-0 flex-1 ${
            mode === 'split'
              ? 'grid-cols-2 divide-x divide-hairline dark:divide-obsidian-border'
              : 'grid-cols-1'
          }`}
        >
          {mode !== 'preview' && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={`Viết nhật ký hoặc ghi chú cho ngày ${selectedDateISO}...\n\nGợi ý:\n## Hôm nay làm gì\n- [ ] Hoàn thành mục tiêu chính\n- Ghi lại điều đáng nhớ`}
              className="font-mono-tabular h-full w-full resize-none bg-paper p-5 text-[13.5px] leading-relaxed text-ink outline-none dark:bg-obsidian dark:text-obsidian-ink"
            />
          )}

          {mode !== 'write' && (
            <div className="h-full overflow-y-auto bg-paper p-5 dark:bg-obsidian">
              <MarkdownPreview content={content} onToggleChecklist={handleChecklistToggle} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
