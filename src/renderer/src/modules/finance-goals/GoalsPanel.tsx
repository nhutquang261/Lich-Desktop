import { useState } from 'react'
import { CheckCircle, Flag, Plus, Trash } from '@phosphor-icons/react'
import type { GoalItem } from '@shared/types'
import { useAppStore } from '@renderer/core/store/useAppStore'

const STATUS_META: Record<GoalItem['status'], { label: string; badgeClass: string }> = {
  active: {
    label: 'Đang thực hiện',
    badgeClass: 'border-vermilion/40 bg-vermilion-soft text-vermilion dark:bg-vermilion/15 dark:text-[#F4725B]'
  },
  completed: {
    label: 'Hoàn thành',
    badgeClass: 'border-jade/40 bg-jade/10 text-jade'
  },
  paused: {
    label: 'Tạm dừng',
    badgeClass: 'border-hairline bg-paper-subtle text-ink-muted dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted'
  }
}

export function GoalsPanel(): React.JSX.Element {
  const { goals, addGoal, setGoalProgress, removeGoal } = useAppStore()
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const handleAddGoal = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await addGoal({
      title: trimmed,
      target_date: targetDate || null,
      progress: 0,
      status: 'active'
    })
    setTitle('')
    setTargetDate('')
  }

  return (
    <div className="space-y-5">
      {/* Add Goal Bar */}
      <form
        onSubmit={(e) => void handleAddGoal(e)}
        className="flex flex-wrap items-end gap-3 rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface"
      >
        <div className="min-w-[240px] flex-1">
          <label
            htmlFor="goal-title"
            className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
          >
            Mục tiêu cá nhân mới
          </label>
          <input
            id="goal-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Tiết kiệm quỹ dự phòng, Đọc xong 12 cuốn sách năm nay..."
            className="w-full rounded-[2px] border border-hairline bg-paper-subtle px-3 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          />
        </div>

        <div>
          <label
            htmlFor="goal-date"
            className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
          >
            Hạn mục tiêu (Tùy chọn)
          </label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="font-mono-tabular rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-[2px] bg-vermilion px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-vermilion-hover active:scale-[0.98]"
        >
          <Plus size={14} weight="bold" />
          <span>Thêm mục tiêu</span>
        </button>
      </form>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="rounded-[2px] border border-dashed border-hairline bg-paper p-8 text-center text-[13px] text-ink-muted dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-muted">
          Chưa có mục tiêu cá nhân nào. Hãy đặt mục tiêu đầu tiên của bạn ở trên!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const meta = STATUS_META[goal.status]
            return (
              <article
                key={goal.id}
                className="flex flex-col justify-between rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Flag
                        size={16}
                        weight="fill"
                        className={goal.status === 'completed' ? 'text-jade' : 'text-vermilion'}
                      />
                      <h3 className="text-[14px] font-bold text-ink dark:text-obsidian-ink">
                        {goal.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeGoal(goal.id)}
                      aria-label="Xóa mục tiêu"
                      className="text-ink-muted hover:text-[#C81E1E]"
                    >
                      <Trash size={14} />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-[2px] border px-1.5 py-0.5 text-[10.5px] font-semibold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    {goal.target_date && (
                      <span className="font-mono-tabular text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                        Hạn: {goal.target_date}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-muted dark:text-obsidian-muted">Tiến độ</span>
                    <span className="font-mono-tabular font-bold text-ink dark:text-obsidian-ink">
                      {goal.progress}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    aria-label={`Tiến độ ${goal.title}`}
                    value={goal.progress}
                    onChange={(e) => void setGoalProgress(goal.id, Number(e.target.value))}
                    className="w-full accent-vermilion"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        void setGoalProgress(goal.id, Math.min(100, goal.progress + 10))
                      }
                      disabled={goal.progress >= 100}
                      className="font-mono-tabular rounded-[2px] border border-hairline px-2 py-1 text-[11px] font-medium text-ink hover:border-vermilion disabled:opacity-40 dark:border-obsidian-border dark:text-obsidian-ink"
                    >
                      +10%
                    </button>

                    {goal.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => void setGoalProgress(goal.id, 100, 'completed')}
                        className="flex items-center gap-1 rounded-[2px] bg-jade px-2.5 py-1 text-[11.5px] font-semibold text-white hover:opacity-90"
                      >
                        <CheckCircle size={13} weight="fill" />
                        <span>Đánh dấu xong</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
