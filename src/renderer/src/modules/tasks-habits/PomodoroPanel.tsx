import { useEffect, useState } from 'react'
import {
  ArrowCounterClockwise,
  CheckCircle,
  Pause,
  Play,
  SkipForward,
  Timer
} from '@phosphor-icons/react'
import { useAppStore } from '@renderer/core/store/useAppStore'

type PomodoroPhase = 'focus' | 'short-break' | 'long-break'

const PHASE_CONFIG: Record<PomodoroPhase, { label: string; minutes: number; accent: string }> = {
  focus: { label: 'Tập trung', minutes: 25, accent: '#D9381E' },
  'short-break': { label: 'Nghỉ ngắn', minutes: 5, accent: '#0D7A5F' },
  'long-break': { label: 'Nghỉ dài', minutes: 15, accent: '#0F766E' }
}

function formatClock(totalSeconds: number): string {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function PomodoroPanel(): React.JSX.Element {
  const { tasks, toggleTask } = useAppStore()
  const activeTasks = tasks.filter((t) => !t.completed)

  const [phase, setPhase] = useState<PomodoroPhase>('focus')
  const [secondsLeft, setSecondsLeft] = useState(PHASE_CONFIG.focus.minutes * 60)
  const [running, setRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [linkedTaskId, setLinkedTaskId] = useState<string>('')

  const totalSeconds = PHASE_CONFIG[phase].minutes * 60
  const progressPct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)
  const linkedTask = tasks.find((t) => t.id === linkedTaskId) ?? null

  const switchPhase = (nextPhase: PomodoroPhase, autoStart = false): void => {
    setPhase(nextPhase)
    setSecondsLeft(PHASE_CONFIG[nextPhase].minutes * 60)
    setRunning(autoStart)
  }

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false)
          if (phase === 'focus') {
            setCompletedSessions((c) => c + 1)
            void window.lichAPI?.notifyNow(
              'Hoàn thành phiên Pomodoro!',
              linkedTask
                ? `Bạn vừa tập trung 25 phút cho "${linkedTask.title}". Nghỉ ngơi 5 phút nhé.`
                : 'Bạn vừa hoàn thành 1 phiên tập trung 25 phút. Hãy nghỉ ngắn 5 phút.'
            )
          } else {
            void window.lichAPI?.notifyNow(
              'Hết giờ nghỉ Pomodoro',
              'Sẵn sàng quay lại phiên tập trung tiếp theo!'
            )
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [running, phase, linkedTask])

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Phase Selector */}
      <div className="grid grid-cols-3 gap-1.5 rounded-[2px] border border-hairline bg-paper p-1 dark:border-obsidian-border dark:bg-obsidian-surface">
        {(['focus', 'short-break', 'long-break'] as PomodoroPhase[]).map((p) => {
          const active = phase === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => switchPhase(p, false)}
              className={`rounded-[2px] py-2 text-[12.5px] font-semibold transition-colors ${
                active
                  ? 'bg-ink text-white dark:bg-obsidian-ink dark:text-obsidian'
                  : 'text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink'
              }`}
            >
              {PHASE_CONFIG[p].label} ({PHASE_CONFIG[p].minutes}p)
            </button>
          )
        })}
      </div>

      {/* Timer Card */}
      <section className="rounded-[2px] border border-hairline bg-paper p-8 text-center dark:border-obsidian-border dark:bg-obsidian-surface">
        <div className="flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
          <Timer size={16} weight="fill" style={{ color: PHASE_CONFIG[phase].accent }} />
          <span>{PHASE_CONFIG[phase].label}</span>
        </div>

        <div className="font-mono-tabular mt-4 text-[68px] font-bold leading-none tracking-tight text-ink dark:text-obsidian-ink">
          {formatClock(secondsLeft)}
        </div>

        {/* Crisp Progress Track */}
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-obsidian-border">
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${progressPct}%`,
              backgroundColor: PHASE_CONFIG[phase].accent
            }}
          />
        </div>

        {/* Controls */}
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRunning(false)
              setSecondsLeft(totalSeconds)
            }}
            aria-label="Đặt lại bộ đếm"
            className="rounded-[2px] border border-hairline bg-paper-subtle p-2.5 text-ink hover:border-ink/40 dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          >
            <ArrowCounterClockwise size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (secondsLeft === 0) setSecondsLeft(totalSeconds)
              setRunning((r) => !r)
            }}
            className="flex min-w-[144px] items-center justify-center gap-2 rounded-[2px] px-6 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: PHASE_CONFIG[phase].accent }}
          >
            {running ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
            <span>{running ? 'Tạm dừng' : secondsLeft === 0 ? 'Bắt đầu lại' : 'Bắt đầu'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next: PomodoroPhase = phase === 'focus' ? 'short-break' : 'focus'
              switchPhase(next, false)
            }}
            aria-label="Chuyển phiên tiếp theo"
            className="rounded-[2px] border border-hairline bg-paper-subtle p-2.5 text-ink hover:border-ink/40 dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          >
            <SkipForward size={18} />
          </button>
        </div>

        <div className="font-mono-tabular mt-6 text-[12px] text-ink-muted dark:text-obsidian-muted">
          Đã hoàn thành trong phiên mở app:{' '}
          <strong className="text-ink dark:text-obsidian-ink">{completedSessions}</strong> phiên tập
          trung
        </div>
      </section>

      {/* Link to Active Task */}
      <section className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
        <label
          htmlFor="pomo-task"
          className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
        >
          Gắn với công việc đang làm (Tùy chọn)
        </label>
        <div className="flex items-center gap-2">
          <select
            id="pomo-task"
            value={linkedTaskId}
            onChange={(e) => setLinkedTaskId(e.target.value)}
            className="flex-1 rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          >
            <option value="">— Không gắn công việc cụ thể —</option>
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          {linkedTask && !linkedTask.completed && (
            <button
              type="button"
              onClick={() => {
                void toggleTask(linkedTask.id)
                setLinkedTaskId('')
              }}
              className="flex items-center gap-1.5 rounded-[2px] bg-jade px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90"
            >
              <CheckCircle size={15} weight="fill" />
              <span>Hoàn thành</span>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
