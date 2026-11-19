import { useEffect, useState } from 'react'
import {
  ArrowSquareOut,
  CheckCircle,
  Circle,
  HourglassHigh,
  MoonStars,
  Plus,
  PushPin,
  SunHorizon,
  X
} from '@phosphor-icons/react'
import { formatISODate } from '@shared/calendar/recurrence'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { getThemePreset } from '@shared/themes'
import type { WidgetSnapshot } from '@shared/types'

function createFallbackSnapshot(): WidgetSnapshot {
  const todayISO = formatISODate(new Date())
  const [yy, mm, dd] = todayISO.split('-').map(Number)
  const lunar = getLunarInfoFromISO(todayISO)
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return {
    dateISO: todayISO,
    solarLabel: `${dayNames[new Date(yy, mm - 1, dd).getDay()]}, ${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yy}`,
    lunarLabel: `Âm lịch ${lunar.day}/${lunar.month} · Năm ${lunar.canChiYear}`,
    canChiDay: `Ngày ${lunar.canChiDay}`,
    holidayName: null,
    events: [],
    tasks: [],
    pinnedCountdowns: [],
    theme: 'dark',
    themePreset: 'obsidian-dark',
    alwaysOnTop: true,
    opacity: 0.96
  }
}

export function WidgetApp(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<WidgetSnapshot>(createFallbackSnapshot)
  const [quickInput, setQuickInput] = useState('')

  useEffect(() => {
    void window.lichAPI?.getWidgetSnapshot().then((data) => {
      if (data) setSnapshot(data)
    })

    const unsubSnapshot = window.lichAPI?.onWidgetSnapshot((next) => {
      setSnapshot(next)
    })

    const unsubSettings = window.lichAPI?.onSettingsChanged((settings) => {
      const preset = getThemePreset(settings.themePreset)
      setSnapshot((prev) => ({
        ...prev,
        alwaysOnTop: settings.widgetAlwaysOnTop,
        opacity: settings.widgetOpacity,
        theme: preset.colorScheme,
        themePreset: preset.id,
        fontSizeScale: settings.fontSizeScale,
        buttonRadiusStyle: settings.buttonRadiusStyle,
        customAccent: settings.customAccent
      }))
    })

    return () => {
      unsubSnapshot?.()
      unsubSettings?.()
    }
  }, [])

  useEffect(() => {
    const preset = getThemePreset(snapshot.themePreset)
    document.documentElement.dataset.theme = preset.id
    document.documentElement.dataset.fontSize = snapshot.fontSizeScale || 'medium'
    document.documentElement.dataset.buttonRadius = snapshot.buttonRadiusStyle || 'rounded'
    document.documentElement.classList.toggle('dark', preset.colorScheme === 'dark')

    if (snapshot.customAccent) {
      document.documentElement.style.setProperty('--color-vermilion', snapshot.customAccent)
      document.documentElement.style.setProperty(
        '--color-vermilion-soft',
        `${snapshot.customAccent}1A`
      )
    } else {
      document.documentElement.style.removeProperty('--color-vermilion')
      document.documentElement.style.removeProperty('--color-vermilion-soft')
    }
  }, [
    snapshot.themePreset,
    snapshot.theme,
    snapshot.fontSizeScale,
    snapshot.buttonRadiusStyle,
    snapshot.customAccent
  ])

  const handleTogglePin = (): void => {
    void window.lichAPI?.setWidgetAlwaysOnTop(!snapshot.alwaysOnTop)
  }

  const handleCycleOpacity = (): void => {
    const levels = [0.75, 0.88, 0.98]
    const currentIdx = levels.findIndex((v) => Math.abs(v - snapshot.opacity) < 0.06)
    const nextOpacity = levels[(currentIdx + 1) % levels.length]
    void window.lichAPI?.setWidgetOpacity(nextOpacity)
  }

  const handleAddQuickTask = (e: React.FormEvent): void => {
    e.preventDefault()
    const title = quickInput.trim()
    if (!title) return
    void window.lichAPI?.sendWidgetAction({ type: 'add-quick-task', title })
    setQuickInput('')
  }

  return (
    <div className="flex h-full w-full p-1.5">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[10px] border border-hairline bg-paper text-ink shadow-[0_16px_40px_-12px_rgba(17,19,21,0.35)] dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink">
        {/* Draggable Header Bar */}
        <header className="widget-drag flex h-9 shrink-0 items-center justify-between border-b border-hairline bg-paper-subtle px-3 dark:border-obsidian-border dark:bg-obsidian-elevated">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-vermilion" />
            <span className="text-[11.5px] font-bold tracking-tight">Lịch Desktop</span>
          </div>
          <div className="widget-no-drag flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleTogglePin}
              title={snapshot.alwaysOnTop ? 'Bỏ ghim trên cùng' : 'Ghim nổi trên cùng'}
              className={`rounded-[2px] p-1 transition-colors ${
                snapshot.alwaysOnTop
                  ? 'text-vermilion'
                  : 'text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink'
              }`}
            >
              <PushPin size={14} weight={snapshot.alwaysOnTop ? 'fill' : 'regular'} />
            </button>
            <button
              type="button"
              onClick={handleCycleOpacity}
              title="Đổi độ trong suốt"
              className="rounded-[2px] p-1 text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink"
            >
              <SunHorizon size={14} />
            </button>
            <button
              type="button"
              onClick={() =>
                void window.lichAPI?.sendWidgetAction({
                  type: 'open-main',
                  dateISO: snapshot.dateISO
                })
              }
              title="Mở ứng dụng chính"
              className="rounded-[2px] p-1 text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink"
            >
              <ArrowSquareOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => void window.lichAPI?.toggleWidget(false)}
              title="Ẩn Widget"
              className="rounded-[2px] p-1 text-ink-muted hover:text-[#C81E1E] dark:text-obsidian-muted"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* Today Solar + Lunar Hero */}
        <div className="border-b border-hairline px-3.5 py-3 dark:border-obsidian-border">
          <div className="text-[14.5px] font-bold leading-snug text-ink dark:text-obsidian-ink">
            {snapshot.solarLabel}
          </div>
          <div className="font-mono-tabular mt-0.5 text-[11.5px] font-medium text-vermilion">
            {snapshot.lunarLabel}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted dark:text-obsidian-muted">
            {snapshot.canChiDay}
            {snapshot.holidayName ? ` · ${snapshot.holidayName}` : ''}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3">
          {/* Pinned Countdowns */}
          {snapshot.pinnedCountdowns && snapshot.pinnedCountdowns.length > 0 && (
            <section className="flex flex-wrap gap-1.5">
              {snapshot.pinnedCountdowns.map((cd) => (
                <div
                  key={cd.id}
                  className="flex flex-1 items-center justify-between gap-2 rounded-[2px] border border-hairline bg-paper-subtle px-2 py-1 text-[11px] dark:border-obsidian-border dark:bg-obsidian-elevated"
                  style={{ borderLeftWidth: '2.5px', borderLeftColor: cd.color }}
                >
                  <span className="flex items-center gap-1 truncate font-medium">
                    <HourglassHigh size={11} weight="fill" style={{ color: cd.color }} />
                    <span className="truncate">{cd.title}</span>
                  </span>
                  <span className="font-mono-tabular shrink-0 font-bold" style={{ color: cd.color }}>
                    {cd.daysRemaining === 0 ? 'Hôm nay' : `${cd.daysRemaining}d`}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* Today's Events */}
          <section>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
              Sự kiện hôm nay ({snapshot.events.length})
            </div>
            {snapshot.events.length === 0 ? (
              <div className="rounded-[2px] border border-dashed border-hairline px-2.5 py-2 text-[11.5px] text-ink-muted dark:border-obsidian-border dark:text-obsidian-muted">
                Không có sự kiện nào hôm nay.
              </div>
            ) : (
              <div className="space-y-1.5">
                {snapshot.events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() =>
                      void window.lichAPI?.sendWidgetAction({
                        type: 'open-main',
                        dateISO: snapshot.dateISO
                      })
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-[2px] bg-paper-subtle px-2 py-1.5 text-left text-[12px] hover:bg-black/[0.05] dark:bg-obsidian-elevated dark:hover:bg-white/[0.08]"
                    style={{ borderLeft: `2.5px solid ${ev.color}` }}
                  >
                    <span className="truncate font-medium">{ev.title}</span>
                    <span className="font-mono-tabular flex shrink-0 items-center gap-1 text-[10.5px] text-ink-muted dark:text-obsidian-muted">
                      {ev.isLunarRecurring && (
                        <MoonStars size={11} weight="fill" className="text-vermilion" />
                      )}
                      {ev.timeLabel}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Quick Tasks */}
          <section>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
              Việc cần làm ({snapshot.tasks.filter((t) => !t.completed).length})
            </div>
            {snapshot.tasks.length === 0 ? (
              <p className="text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                Chưa có việc cần làm.
              </p>
            ) : (
              <ul className="space-y-1">
                {snapshot.tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() =>
                        void window.lichAPI?.sendWidgetAction({
                          type: 'toggle-task',
                          taskId: task.id
                        })
                      }
                      className="flex w-full items-start gap-2 rounded-[2px] px-1 py-1 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      {task.completed ? (
                        <CheckCircle size={15} weight="fill" className="mt-0.5 shrink-0 text-jade" />
                      ) : (
                        <Circle
                          size={15}
                          className="mt-0.5 shrink-0 text-ink-muted dark:text-obsidian-muted"
                        />
                      )}
                      <span
                        className={`text-[12px] leading-snug ${
                          task.completed
                            ? 'text-ink-muted line-through dark:text-obsidian-muted'
                            : 'text-ink dark:text-obsidian-ink'
                        }`}
                      >
                        {task.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Inline Quick Task Input */}
        <form
          onSubmit={handleAddQuickTask}
          className="flex items-center gap-1.5 border-t border-hairline bg-paper-subtle px-2.5 py-2 dark:border-obsidian-border dark:bg-obsidian-elevated"
        >
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Thêm nhanh việc hôm nay..."
            className="flex-1 rounded-[2px] border border-hairline bg-paper px-2 py-1 text-[12px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
          />
          <button
            type="submit"
            aria-label="Thêm nhanh"
            className="rounded-[2px] bg-vermilion p-1.5 text-white hover:bg-vermilion-hover active:scale-[0.97]"
          >
            <Plus size={13} weight="bold" />
          </button>
        </form>
      </div>
    </div>
  )
}
