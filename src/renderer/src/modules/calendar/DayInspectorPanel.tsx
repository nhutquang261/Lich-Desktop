import { useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle,
  Circle,
  Clock,
  Coins,
  MoonStars,
  Notebook,
  Plus,
  Trash
} from '@phosphor-icons/react'
import { expandEventsForRange } from '@shared/calendar/recurrence'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { getVietnameseHolidays } from '@shared/lunar/vnHolidays'
import { EVENT_CATEGORY_META, type CalendarEvent } from '@shared/types'
import { useAppStore } from '@renderer/core/store/useAppStore'
import { getMoodMeta } from '@renderer/modules/daily-notes/moodMeta'
import { formatVnd } from '@renderer/modules/finance-goals/formatVnd'

const WEEKDAYS_VI = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

interface DayInspectorPanelProps {
  onCreateEvent: (dateISO: string) => void
  onEditEvent: (event: CalendarEvent) => void
}

export function DayInspectorPanel({
  onCreateEvent,
  onEditEvent
}: DayInspectorPanelProps): React.JSX.Element {
  const {
    selectedDateISO,
    events,
    tasks,
    habits,
    habitLogs,
    dailyNotes,
    transactions,
    settings,
    setActiveView,
    addTask,
    toggleTask,
    removeTask,
    toggleHabitOnDate
  } = useAppStore()
  const [quickTaskTitle, setQuickTaskTitle] = useState('')

  const [yy, mm, dd] = selectedDateISO.split('-').map(Number)
  const weekday = WEEKDAYS_VI[new Date(yy, mm - 1, dd).getDay()]
  const lunar = getLunarInfoFromISO(selectedDateISO)
  const holidays = getVietnameseHolidays(dd, mm, lunar)
  const dayOccurrences =
    expandEventsForRange(events, selectedDateISO, selectedDateISO).get(selectedDateISO) ?? []

  const dayTasks = tasks.filter(
    (t) => t.due_date === selectedDateISO || (!t.due_date && !t.completed)
  )

  const completedHabitIds = new Set(
    habitLogs
      .filter((l) => l.log_date === selectedDateISO && l.completed && !l.deleted_at)
      .map((l) => l.habit_id)
  )

  const dayNote = dailyNotes.find((n) => n.note_date === selectedDateISO) ?? null
  const dayMood = getMoodMeta(dayNote?.mood ?? null)
  const dayTransactions = transactions.filter((tx) => tx.tx_date === selectedDateISO)
  const dayIncome = dayTransactions
    .filter((tx) => tx.kind === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const dayExpense = dayTransactions
    .filter((tx) => tx.kind === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const handleQuickAddTask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = quickTaskTitle.trim()
    if (!trimmed) return
    await addTask({
      title: trimmed,
      due_date: selectedDateISO,
      completed: false,
      priority: 'medium',
      notes: ''
    })
    setQuickTaskTitle('')
  }

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-hairline bg-paper dark:border-obsidian-border dark:bg-obsidian-surface">
      {/* Solar + Lunar Hero Header */}
      <div className="border-b border-hairline px-4 py-4 dark:border-obsidian-border">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-vermilion">
              {weekday}
            </div>
            <div className="font-mono-tabular mt-0.5 text-[28px] font-bold leading-none text-ink dark:text-obsidian-ink">
              {String(dd).padStart(2, '0')}
              <span className="text-[16px] font-medium text-ink-muted dark:text-obsidian-muted">
                /{String(mm).padStart(2, '0')}/{yy}
              </span>
            </div>
          </div>

          {settings.enabledModules['lunar-countdown'] && (
            <div className="text-right">
              <div className="font-mono-tabular text-[13px] font-semibold text-vermilion">
                {lunar.day}/{lunar.month}
                {lunar.isLeapMonth ? ' Nhuận' : ''} ÂL
              </div>
              <div className="text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                Năm {lunar.canChiYear}
              </div>
            </div>
          )}
        </div>

        {settings.enabledModules['lunar-countdown'] && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-ink-muted dark:text-obsidian-muted">
            <span className="rounded-[2px] border border-hairline bg-paper-subtle px-2 py-0.5 dark:border-obsidian-border dark:bg-obsidian-elevated">
              Ngày {lunar.canChiDay}
            </span>
            <span className="rounded-[2px] border border-hairline bg-paper-subtle px-2 py-0.5 dark:border-obsidian-border dark:bg-obsidian-elevated">
              Tháng {lunar.canChiMonth}
            </span>
          </div>
        )}

        {holidays.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {holidays.map((h) => (
              <div
                key={h.name}
                className="rounded-[2px] border border-vermilion/30 bg-vermilion-soft px-2.5 py-1 text-[12px] font-medium text-vermilion dark:bg-vermilion/15 dark:text-[#F4725B]"
              >
                {h.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Events Section */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
              Sự kiện ({dayOccurrences.length})
            </h3>
            <button
              type="button"
              onClick={() => onCreateEvent(selectedDateISO)}
              className="flex items-center gap-1 rounded-[2px] bg-vermilion px-2 py-1 text-[11.5px] font-semibold text-white transition-colors hover:bg-vermilion-hover active:scale-[0.98]"
            >
              <Plus size={13} weight="bold" />
              <span>Thêm</span>
            </button>
          </div>

          {dayOccurrences.length === 0 ? (
            <div className="rounded-[2px] border border-dashed border-hairline px-3 py-4 text-center text-[12.5px] text-ink-muted dark:border-obsidian-border dark:text-obsidian-muted">
              Chưa có sự kiện nào trong ngày này.
            </div>
          ) : (
            <div className="space-y-2">
              {dayOccurrences.map(({ occurrenceKey, event }) => {
                const isLunarRec =
                  event.recurrence === 'lunar-monthly' || event.recurrence === 'lunar-yearly'
                return (
                  <button
                    key={occurrenceKey}
                    type="button"
                    onClick={() => onEditEvent(event)}
                    className="group flex w-full flex-col rounded-[2px] border border-hairline bg-paper-subtle p-2.5 text-left transition-colors hover:border-ink/30 dark:border-obsidian-border dark:bg-obsidian-elevated dark:hover:border-obsidian-muted"
                    style={{ borderLeftWidth: '3px', borderLeftColor: event.color }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                        {event.title}
                      </span>
                      {isLunarRec && (
                        <span title="Sự kiện lặp theo Âm lịch" className="mt-0.5 shrink-0">
                          <MoonStars size={14} weight="fill" className="text-vermilion" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                      <span className="font-mono-tabular flex items-center gap-1">
                        <Clock size={12} />
                        {event.all_day
                          ? 'Cả ngày'
                          : `${event.start_time ?? ''}${event.end_time ? ` - ${event.end_time}` : ''}`}
                      </span>
                      <span>·</span>
                      <span>{EVENT_CATEGORY_META[event.category].label}</span>
                    </div>
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-ink-muted dark:text-obsidian-muted">
                        {event.description}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Quick Tasks Slot */}
        {settings.enabledModules['tasks-habits'] && (
          <section className="border-t border-hairline pt-4 dark:border-obsidian-border">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                Việc cần làm ({dayTasks.filter((t) => !t.completed).length})
              </h3>
              <span className="font-mono-tabular text-[10px] text-jade">Sync Widget</span>
            </div>

            <form onSubmit={(e) => void handleQuickAddTask(e)} className="mb-2.5 flex gap-1.5">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Thêm nhanh công việc..."
                className="flex-1 rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              />
              <button
                type="submit"
                aria-label="Thêm công việc"
                className="rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-ink hover:border-vermilion hover:text-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              >
                <Plus size={14} weight="bold" />
              </button>
            </form>

            {dayTasks.length === 0 ? (
              <p className="text-[12px] text-ink-muted dark:text-obsidian-muted">
                Không có việc cần làm cho ngày này.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {dayTasks.map((task) => (
                  <li
                    key={task.id}
                    className="group flex items-start gap-2 rounded-[2px] px-1.5 py-1 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleTask(task.id)}
                      aria-label={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      className="mt-0.5 shrink-0 text-ink-muted hover:text-jade dark:text-obsidian-muted"
                    >
                      {task.completed ? (
                        <CheckCircle size={16} weight="fill" className="text-jade" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-[12.5px] leading-snug ${
                        task.completed
                          ? 'text-ink-muted line-through dark:text-obsidian-muted'
                          : 'text-ink dark:text-obsidian-ink'
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeTask(task.id)}
                      aria-label="Xóa công việc"
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-ink-muted hover:text-[#C81E1E]"
                    >
                      <Trash size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Daily Habits Check-in Slot */}
        {settings.enabledModules['tasks-habits'] && habits.length > 0 && (
          <section className="border-t border-hairline pt-4 dark:border-obsidian-border">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                Thói quen ({completedHabitIds.size}/{habits.length})
              </h3>
              <button
                type="button"
                onClick={() => setActiveView('tasks-habits')}
                className="flex items-center gap-0.5 text-[11px] font-medium text-ink-muted hover:text-vermilion dark:text-obsidian-muted"
              >
                <span>Chi tiết</span>
                <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-1.5">
              {habits.map((habit) => {
                const done = completedHabitIds.has(habit.id)
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => void toggleHabitOnDate(habit.id, selectedDateISO)}
                    className="flex w-full items-center gap-2.5 rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-left transition-colors hover:border-ink/30 dark:border-obsidian-border dark:bg-obsidian-elevated"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
                        done ? 'border-transparent text-white' : 'border-hairline dark:border-obsidian-border'
                      }`}
                      style={done ? { backgroundColor: habit.color } : undefined}
                    >
                      {done && <Check size={11} weight="bold" />}
                    </span>
                    <span
                      className={`truncate text-[12.5px] font-medium ${
                        done
                          ? 'text-ink-muted line-through dark:text-obsidian-muted'
                          : 'text-ink dark:text-obsidian-ink'
                      }`}
                    >
                      {habit.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Daily Note & Mood Preview Slot */}
        {settings.enabledModules['daily-notes'] && (
          <section className="border-t border-hairline pt-4 dark:border-obsidian-border">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                <Notebook size={13} />
                <span>Nhật ký ngày</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveView('daily-notes')}
                className="flex items-center gap-0.5 text-[11px] font-semibold text-vermilion hover:underline"
              >
                <span>{dayNote ? 'Mở & sửa' : 'Viết ngay'}</span>
                <ArrowRight size={11} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('daily-notes')}
              className="w-full rounded-[2px] border border-hairline bg-paper-subtle p-2.5 text-left transition-colors hover:border-vermilion/50 dark:border-obsidian-border dark:bg-obsidian-elevated"
            >
              {dayMood && (
                <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <dayMood.Icon size={14} weight="fill" style={{ color: dayMood.color }} />
                  <span style={{ color: dayMood.color }}>{dayMood.label}</span>
                </div>
              )}
              <p className="line-clamp-3 text-[12px] text-ink-muted dark:text-obsidian-muted">
                {dayNote?.content.trim()
                  ? dayNote.content.trim()
                  : 'Nhấn để viết ghi chú Markdown hoặc lưu tâm trạng cho ngày này...'}
              </p>
            </button>
          </section>
        )}

        {/* Daily Finance Summary Slot */}
        {settings.enabledModules['finance-goals'] && (
          <section className="border-t border-hairline pt-4 dark:border-obsidian-border">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                <Coins size={13} />
                <span>Thu chi ngày này</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveView('finance-goals')}
                className="flex items-center gap-0.5 text-[11px] font-semibold text-vermilion hover:underline"
              >
                <span>Ghi sổ</span>
                <ArrowRight size={11} />
              </button>
            </div>
            {dayTransactions.length === 0 ? (
              <p className="text-[12px] text-ink-muted dark:text-obsidian-muted">
                Chưa có khoản thu/chi nào trong ngày này.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-2 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div className="text-[10.5px] text-ink-muted dark:text-obsidian-muted">Thu</div>
                  <div className="font-mono-tabular text-[12.5px] font-bold text-jade">
                    +{formatVnd(dayIncome)}
                  </div>
                </div>
                <div className="rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-2 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div className="text-[10.5px] text-ink-muted dark:text-obsidian-muted">Chi</div>
                  <div className="font-mono-tabular text-[12.5px] font-bold text-vermilion">
                    -{formatVnd(dayExpense)}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  )
}
