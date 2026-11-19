import { useMemo, useState } from 'react'
import {
  CheckCircle,
  CheckSquare,
  Circle,
  Flame,
  Plus,
  Timer,
  Trash
} from '@phosphor-icons/react'
import { formatISODate } from '@shared/calendar/recurrence'
import type { TaskPriority } from '@shared/types'
import { useAppStore } from '@renderer/core/store/useAppStore'
import { HabitTrackerPanel } from './HabitTrackerPanel'
import { PomodoroPanel } from './PomodoroPanel'

type WorkspaceTab = 'tasks' | 'habits' | 'pomodoro'
type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed'

const PRIORITY_META: Record<TaskPriority, { label: string; badgeClass: string }> = {
  high: {
    label: 'Cao',
    badgeClass: 'border-vermilion/40 bg-vermilion-soft text-vermilion dark:bg-vermilion/15 dark:text-[#F4725B]'
  },
  medium: {
    label: 'Trung bình',
    badgeClass: 'border-amber/40 bg-amber/10 text-amber'
  },
  low: {
    label: 'Thấp',
    badgeClass: 'border-hairline bg-paper-subtle text-ink-muted dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted'
  }
}

export function TasksHabitsView(): React.JSX.Element {
  const { tasks, addTask, toggleTask, removeTask } = useAppStore()
  const todayISO = formatISODate(new Date())

  const [tab, setTab] = useState<WorkspaceTab>('tasks')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayISO)
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const filteredTasks = useMemo(() => {
    const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
    return tasks
      .filter((t) => {
        if (filter === 'completed') return t.completed
        if (filter === 'today') return !t.completed && (!t.due_date || t.due_date <= todayISO)
        if (filter === 'upcoming') return !t.completed && Boolean(t.due_date && t.due_date > todayISO)
        return true
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed)
        if (priorityRank[a.priority] !== priorityRank[b.priority]) {
          return priorityRank[a.priority] - priorityRank[b.priority]
        }
        return (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31')
      })
  }, [tasks, filter, todayISO])

  const handleAddTask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await addTask({
      title: trimmed,
      due_date: dueDate || null,
      completed: false,
      priority,
      notes: ''
    })
    setTitle('')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-paper-subtle dark:bg-obsidian">
      {/* Module Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-paper px-6 dark:border-obsidian-border dark:bg-obsidian-surface">
        <div className="flex items-center gap-2.5">
          <CheckSquare size={20} weight="fill" className="text-vermilion" />
          <h1 className="text-[18px] font-bold tracking-tight text-ink dark:text-obsidian-ink">
            Công việc, Thói quen & Pomodoro
          </h1>
        </div>

        {/* Sub-module Tabs */}
        <div className="flex rounded-[2px] border border-hairline bg-paper-subtle p-0.5 dark:border-obsidian-border dark:bg-obsidian-elevated">
          {(
            [
              { id: 'tasks', label: 'Công việc', Icon: CheckSquare },
              { id: 'habits', label: 'Thói quen', Icon: Flame },
              { id: 'pomodoro', label: 'Pomodoro', Icon: Timer }
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-[12.5px] font-medium transition-colors ${
                tab === id
                  ? 'bg-paper text-ink shadow-xs dark:bg-obsidian-surface dark:text-obsidian-ink'
                  : 'text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink'
              }`}
            >
              <Icon size={14} weight={tab === id ? 'fill' : 'regular'} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          {tab === 'tasks' && (
            <div className="space-y-5">
              {/* Quick Create Task Bar */}
              <form
                onSubmit={(e) => void handleAddTask(e)}
                className="flex flex-wrap items-end gap-3 rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface"
              >
                <div className="min-w-[240px] flex-1">
                  <label
                    htmlFor="task-title"
                    className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Nội dung công việc
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Hoàn thiện báo cáo tuần, Gọi điện về nhà..."
                    className="w-full rounded-[2px] border border-hairline bg-paper-subtle px-3 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-due"
                    className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Hạn ngày
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="font-mono-tabular rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-priority"
                    className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Ưu tiên
                  </label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                  >
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-[2px] bg-vermilion px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-vermilion-hover active:scale-[0.98]"
                >
                  <Plus size={14} weight="bold" />
                  <span>Thêm việc</span>
                </button>
              </form>

              {/* Filter Strip */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 'all', label: `Tất cả (${tasks.length})` },
                      {
                        id: 'today',
                        label: `Hôm nay (${tasks.filter((t) => !t.completed && (!t.due_date || t.due_date <= todayISO)).length})`
                      },
                      {
                        id: 'upcoming',
                        label: `Sắp tới (${tasks.filter((t) => !t.completed && Boolean(t.due_date && t.due_date > todayISO)).length})`
                      },
                      {
                        id: 'completed',
                        label: `Đã xong (${tasks.filter((t) => t.completed).length})`
                      }
                    ] as Array<{ id: TaskFilter; label: string }>
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={`rounded-[2px] border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        filter === f.id
                          ? 'border-ink bg-ink text-white dark:border-obsidian-ink dark:bg-obsidian-ink dark:text-obsidian'
                          : 'border-hairline bg-paper text-ink-muted hover:text-ink dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-muted'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="font-mono-tabular text-[11px] text-jade">
                  Đồng bộ 2 chiều với Lịch & Widget
                </span>
              </div>

              {/* Tasks List */}
              <section className="rounded-[2px] border border-hairline bg-paper dark:border-obsidian-border dark:bg-obsidian-surface">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-ink-muted dark:text-obsidian-muted">
                    Không có công việc nào trong bộ lọc này.
                  </div>
                ) : (
                  <ul className="divide-y divide-hairline dark:divide-obsidian-border">
                    {filteredTasks.map((task) => {
                      const pMeta = PRIORITY_META[task.priority]
                      const isOverdue =
                        !task.completed && Boolean(task.due_date && task.due_date < todayISO)
                      return (
                        <li
                          key={task.id}
                          className="group flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper-subtle/60 dark:hover:bg-obsidian-elevated/40"
                        >
                          <button
                            type="button"
                            onClick={() => void toggleTask(task.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            {task.completed ? (
                              <CheckCircle size={19} weight="fill" className="shrink-0 text-jade" />
                            ) : (
                              <Circle
                                size={19}
                                className="shrink-0 text-ink-muted hover:text-jade dark:text-obsidian-muted"
                              />
                            )}
                            <span
                              className={`truncate text-[13.5px] font-medium ${
                                task.completed
                                  ? 'text-ink-muted line-through dark:text-obsidian-muted'
                                  : 'text-ink dark:text-obsidian-ink'
                              }`}
                            >
                              {task.title}
                            </span>
                          </button>

                          <div className="flex shrink-0 items-center gap-2.5">
                            <span
                              className={`rounded-[2px] border px-1.5 py-0.5 text-[10.5px] font-semibold ${pMeta.badgeClass}`}
                            >
                              {pMeta.label}
                            </span>
                            {task.due_date && (
                              <span
                                className={`font-mono-tabular text-[11.5px] ${
                                  isOverdue
                                    ? 'font-semibold text-vermilion'
                                    : 'text-ink-muted dark:text-obsidian-muted'
                                }`}
                              >
                                {task.due_date}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => void removeTask(task.id)}
                              aria-label="Xóa công việc"
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-ink-muted hover:text-[#C81E1E]"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}

          {tab === 'habits' && <HabitTrackerPanel />}
          {tab === 'pomodoro' && <PomodoroPanel />}
        </div>
      </div>
    </div>
  )
}
