import { useMemo, useState } from 'react'
import { Check, Flame, Plus, Trash, Trophy } from '@phosphor-icons/react'
import { addDaysISO, formatISODate } from '@shared/calendar/recurrence'
import { computeHabitStats } from '@shared/habits/streak'
import { useAppStore } from '@renderer/core/store/useAppStore'

const HABIT_COLORS = ['#0D7A5F', '#D9381E', '#C67D08', '#334155', '#0F766E', '#C2410C'] as const
const SHORT_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function HabitTrackerPanel(): React.JSX.Element {
  const { habits, habitLogs, addHabit, removeHabit, toggleHabitOnDate } = useAppStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(HABIT_COLORS[0])
  const [targetDays, setTargetDays] = useState(5)

  const todayISO = formatISODate(new Date())

  const last14Days = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => {
      const iso = addDaysISO(todayISO, idx - 13)
      const [y, m, d] = iso.split('-').map(Number)
      const dow = new Date(y, m - 1, d).getDay()
      return {
        iso,
        dayNum: d,
        dayLabel: SHORT_DAYS[dow],
        isToday: iso === todayISO
      }
    })
  }, [todayISO])

  const logLookup = useMemo(() => {
    const set = new Set<string>()
    for (const log of habitLogs) {
      if (log.completed && !log.deleted_at) {
        set.add(`${log.habit_id}::${log.log_date}`)
      }
    }
    return set
  }, [habitLogs])

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    await addHabit({
      name: trimmed,
      color,
      target_days_per_week: targetDays
    })
    setName('')
  }

  return (
    <div className="space-y-5">
      {/* Add Habit Bar */}
      <form
        onSubmit={(e) => void handleCreate(e)}
        className="flex flex-wrap items-end gap-3 rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface"
      >
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="habit-name"
            className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
          >
            Thêm thói quen mới
          </label>
          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Uống 2L nước, Học tiếng Anh 30 phút..."
            className="w-full rounded-[2px] border border-hairline bg-paper-subtle px-3 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          />
        </div>

        <div>
          <label
            htmlFor="habit-target"
            className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
          >
            Mục tiêu/tuần
          </label>
          <select
            id="habit-target"
            value={targetDays}
            onChange={(e) => setTargetDays(Number(e.target.value))}
            className="font-mono-tabular rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d} ngày/tuần
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink">
            Màu
          </span>
          <div className="flex items-center gap-1.5 py-1">
            {HABIT_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Chọn màu ${swatch}`}
                onClick={() => setColor(swatch)}
                className={`h-5 w-5 rounded-[2px] transition-transform ${
                  color === swatch
                    ? 'scale-110 ring-2 ring-ink ring-offset-1 dark:ring-obsidian-ink'
                    : ''
                }`}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-[2px] bg-vermilion px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-vermilion-hover active:scale-[0.98]"
        >
          <Plus size={14} weight="bold" />
          <span>Thêm</span>
        </button>
      </form>

      {/* 14-Day Habit Matrix */}
      <section className="overflow-x-auto rounded-[2px] border border-hairline bg-paper dark:border-obsidian-border dark:bg-obsidian-surface">
        {habits.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-ink-muted dark:text-obsidian-muted">
            Chưa có thói quen nào. Hãy thêm một thói quen ở trên để bắt đầu theo dõi chuỗi ngày!
          </div>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline bg-paper-subtle dark:border-obsidian-border dark:bg-obsidian-elevated">
                <th className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                  Thói quen
                </th>
                {last14Days.map((d) => (
                  <th key={d.iso} className="w-9 px-1 py-2 text-center">
                    <div
                      className={`text-[10px] font-medium ${
                        d.isToday ? 'text-vermilion' : 'text-ink-muted dark:text-obsidian-muted'
                      }`}
                    >
                      {d.dayLabel}
                    </div>
                    <div
                      className={`font-mono-tabular text-[11px] font-semibold ${
                        d.isToday ? 'text-vermilion' : 'text-ink dark:text-obsidian-ink'
                      }`}
                    >
                      {d.dayNum}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                  Chuỗi / Tuần
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline dark:divide-obsidian-border">
              {habits.map((habit) => {
                const logsForHabit = habitLogs.filter((l) => l.habit_id === habit.id)
                const stats = computeHabitStats(logsForHabit, todayISO)
                return (
                  <tr
                    key={habit.id}
                    className="group hover:bg-paper-subtle/60 dark:hover:bg-obsidian-elevated/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="text-[13.5px] font-semibold text-ink dark:text-obsidian-ink">
                          {habit.name}
                        </span>
                      </div>
                    </td>

                    {last14Days.map((d) => {
                      const done = logLookup.has(`${habit.id}::${d.iso}`)
                      return (
                        <td key={d.iso} className="px-1 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => void toggleHabitOnDate(habit.id, d.iso)}
                            aria-label={`${habit.name} ngày ${d.iso}`}
                            className={`mx-auto flex h-6 w-6 items-center justify-center rounded-[2px] border transition-transform active:scale-90 ${
                              done
                                ? 'border-transparent text-white'
                                : d.isToday
                                  ? 'border-vermilion/60 bg-paper-subtle hover:border-vermilion dark:bg-obsidian-elevated'
                                  : 'border-hairline bg-paper-subtle hover:border-ink/40 dark:border-obsidian-border dark:bg-obsidian-elevated'
                            }`}
                            style={done ? { backgroundColor: habit.color } : undefined}
                          >
                            {done && <Check size={13} weight="bold" />}
                          </button>
                        </td>
                      )
                    })}

                    <td className="px-3 py-2 text-right">
                      <div className="font-mono-tabular flex items-center justify-end gap-2.5 text-[12px]">
                        <span
                          title="Chuỗi liên tiếp hiện tại"
                          className="flex items-center gap-1 font-bold text-vermilion"
                        >
                          <Flame size={14} weight="fill" />
                          {stats.currentStreak}
                        </span>
                        <span
                          title="Kỷ lục chuỗi dài nhất"
                          className="flex items-center gap-1 text-amber"
                        >
                          <Trophy size={13} weight="fill" />
                          {stats.bestStreak}
                        </span>
                        <span className="text-ink-muted dark:text-obsidian-muted">
                          {stats.completedLast7Days}/{habit.target_days_per_week}
                        </span>
                      </div>
                    </td>

                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void removeHabit(habit.id)}
                        aria-label="Xóa thói quen"
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-ink-muted hover:text-[#C81E1E]"
                      >
                        <Trash size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
