import { useMemo, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  HourglassHigh,
  MoonStars,
  Plus,
  SidebarSimple
} from '@phosphor-icons/react'
import {
  addDaysISO,
  expandEventsForRange,
  formatISODate,
  parseISODate
} from '@shared/calendar/recurrence'
import { buildRolling12Months } from '@shared/calendar/yearLayout'
import { resolveCountdown } from '@shared/countdown/countdownMath'
import { getCanChiYear, getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { getVietnameseHolidays } from '@shared/lunar/vnHolidays'
import type { EventInput } from '@shared/schemas'
import type { CalendarEvent, EventOccurrence } from '@shared/types'
import { useAppStore, type CalendarViewMode } from '@renderer/core/store/useAppStore'
import { getMoodMeta } from '@renderer/modules/daily-notes/moodMeta'
import { DayInspectorPanel } from './DayInspectorPanel'
import { EventModal } from './EventModal'
import { YearGridView } from './YearGridView'

const DAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const VIEW_MODES: Array<{ id: CalendarViewMode; label: string }> = [
  { id: 'year', label: 'Năm (12T)' },
  { id: 'month', label: 'Tháng' },
  { id: 'week', label: 'Tuần' },
  { id: 'day', label: 'Ngày' },
  { id: 'agenda', label: 'Lịch biểu' }
]

function getMondayOfWeek(dateISO: string): string {
  const dt = parseISODate(dateISO)
  const day = dt.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  return formatISODate(dt)
}

function buildMonthGridDates(visibleMonthISO: string): string[] {
  const firstDay = parseISODate(visibleMonthISO)
  const startISO = getMondayOfWeek(formatISODate(firstDay))
  return Array.from({ length: 42 }, (_, idx) => addDaysISO(startISO, idx))
}

export function CalendarWorkspace(): React.JSX.Element {
  const {
    events,
    tasks,
    dailyNotes,
    countdowns,
    settings,
    calendarView,
    selectedDateISO,
    visibleMonthISO,
    setActiveView,
    setCalendarView,
    setSelectedDate,
    setVisibleMonth,
    jumpToToday,
    updateSettings,
    addEvent,
    editEvent,
    removeEvent
  } = useAppStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalDateISO, setModalDateISO] = useState(selectedDateISO)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showInspectorInYear, setShowInspectorInYear] = useState(false)

  const todayISO = formatISODate(new Date())
  const [visYear, visMonth] = visibleMonthISO.split('-').map(Number)

  const gridDates = useMemo(() => buildMonthGridDates(visibleMonthISO), [visibleMonthISO])

  const weekDates = useMemo(() => {
    const monday = getMondayOfWeek(selectedDateISO)
    return Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i))
  }, [selectedDateISO])

  const rangeStart =
    calendarView === 'month'
      ? gridDates[0]
      : calendarView === 'week'
        ? weekDates[0]
        : calendarView === 'day'
          ? selectedDateISO
          : todayISO

  const rangeEnd =
    calendarView === 'month'
      ? gridDates[gridDates.length - 1]
      : calendarView === 'week'
        ? weekDates[6]
        : calendarView === 'day'
          ? selectedDateISO
          : addDaysISO(todayISO, 30)

  const occurrencesByDate = useMemo(
    () => expandEventsForRange(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd]
  )

  const notesByDate = useMemo(() => {
    const map = new Map<string, (typeof dailyNotes)[number]>()
    for (const note of dailyNotes) {
      map.set(note.note_date, note)
    }
    return map
  }, [dailyNotes])

  const openTaskCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (!t.completed && t.due_date) {
        map.set(t.due_date, (map.get(t.due_date) ?? 0) + 1)
      }
    }
    return map
  }, [tasks])

  const pinnedCountdowns = useMemo(() => {
    if (!settings.enabledModules['lunar-countdown']) return []
    return countdowns
      .filter((c) => c.pinned)
      .map((c) => resolveCountdown(c, todayISO))
      .filter((r) => !r.isPast)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 4)
  }, [countdowns, settings.enabledModules, todayISO])

  const navigateStep = (direction: -1 | 1): void => {
    if (calendarView === 'year') {
      const nextStartYear = settings.yearLayout.startYear + direction
      void updateSettings({
        yearLayout: {
          ...settings.yearLayout,
          startYear: nextStartYear,
          customOrder: buildRolling12Months(nextStartYear, settings.yearLayout.startMonth)
        }
      })
      return
    }
    if (calendarView === 'month') {
      const dt = new Date(visYear, visMonth - 1 + direction, 1)
      setVisibleMonth(formatISODate(dt))
    } else if (calendarView === 'week') {
      setSelectedDate(addDaysISO(selectedDateISO, direction * 7))
    } else {
      setSelectedDate(addDaysISO(selectedDateISO, direction))
    }
  }

  const openCreateModal = (dateISO: string): void => {
    setEditingEvent(null)
    setModalDateISO(dateISO)
    setModalOpen(true)
  }

  const openEditModal = (ev: CalendarEvent): void => {
    setEditingEvent(ev)
    setModalDateISO(ev.start_date)
    setModalOpen(true)
  }

  const handleSaveEvent = async (input: EventInput, editingId?: string): Promise<void> => {
    if (editingId) {
      await editEvent(editingId, input)
    } else {
      await addEvent(input)
    }
  }

  const showLunar = settings.showLunarInGrid && settings.enabledModules['lunar-countdown']

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Main Calendar Stage */}
      <div className="flex min-w-0 flex-1 flex-col bg-paper dark:bg-obsidian">
        {/* Top Toolbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-5 dark:border-obsidian-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigateStep(-1)}
                aria-label="Khoảng trước"
                className="rounded-[2px] border border-hairline p-1.5 text-ink hover:bg-paper-subtle dark:border-obsidian-border dark:text-obsidian-ink dark:hover:bg-obsidian-elevated"
              >
                <CaretLeft size={15} />
              </button>
              <button
                type="button"
                onClick={jumpToToday}
                className="rounded-[2px] border border-hairline px-2.5 py-1 text-[12.5px] font-medium text-ink hover:bg-paper-subtle active:scale-[0.98] dark:border-obsidian-border dark:text-obsidian-ink dark:hover:bg-obsidian-elevated"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => navigateStep(1)}
                aria-label="Khoảng sau"
                className="rounded-[2px] border border-hairline p-1.5 text-ink hover:bg-paper-subtle dark:border-obsidian-border dark:text-obsidian-ink dark:hover:bg-obsidian-elevated"
              >
                <CaretRight size={15} />
              </button>
            </div>

            <div className="flex items-baseline gap-2.5">
              <h1 className="text-[19px] font-bold tracking-tight text-ink dark:text-obsidian-ink">
                {calendarView === 'year'
                  ? settings.yearLayout.startMonth === 1
                    ? `Năm ${settings.yearLayout.startYear}`
                    : `T${settings.yearLayout.startMonth}/${settings.yearLayout.startYear} – T${settings.yearLayout.startMonth - 1}/${settings.yearLayout.startYear + 1}`
                  : `Tháng ${visMonth}, ${visYear}`}
              </h1>
              {showLunar && (
                <span className="font-mono-tabular text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                  Năm{' '}
                  {getCanChiYear(
                    calendarView === 'year' ? settings.yearLayout.startYear : visYear
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Segmented View Switcher */}
            <div className="flex rounded-[2px] border border-hairline bg-paper-subtle p-0.5 dark:border-obsidian-border dark:bg-obsidian-surface">
              {VIEW_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCalendarView(m.id)}
                  className={`rounded-[2px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    calendarView === m.id
                      ? 'bg-paper text-ink shadow-xs dark:bg-obsidian-elevated dark:text-obsidian-ink'
                      : 'text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {calendarView === 'year' && (
              <button
                type="button"
                onClick={() => setShowInspectorInYear((prev) => !prev)}
                title={showInspectorInYear ? 'Ẩn thanh Chi tiết ngày' : 'Hiện thanh Chi tiết ngày'}
                className={`flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  showInspectorInYear
                    ? 'border-vermilion/50 bg-vermilion/10 text-vermilion dark:text-[#F05A42]'
                    : 'border-hairline bg-paper-subtle text-ink hover:border-ink/40 dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink'
                }`}
              >
                <SidebarSimple size={15} weight={showInspectorInYear ? 'fill' : 'regular'} />
                <span>Chi tiết</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => openCreateModal(selectedDateISO)}
              className="flex items-center gap-1.5 rounded-[2px] bg-vermilion px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-vermilion-hover active:scale-[0.98]"
            >
              <Plus size={14} weight="bold" />
              <span>Sự kiện</span>
            </button>
          </div>
        </header>

        {/* Pinned Countdowns Ribbon */}
        {pinnedCountdowns.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-hairline bg-paper-subtle px-5 py-1.5 dark:border-obsidian-border dark:bg-obsidian-surface">
            <HourglassHigh size={13} weight="fill" className="shrink-0 text-vermilion" />
            {pinnedCountdowns.map(({ item, resolvedSolarISO, daysRemaining }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDate(resolvedSolarISO)}
                className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-hairline bg-paper px-2 py-0.5 text-[11.5px] transition-colors hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated"
                style={{ borderLeftWidth: '2.5px', borderLeftColor: item.color }}
              >
                <span className="font-medium text-ink dark:text-obsidian-ink">{item.title}</span>
                <span
                  className="font-mono-tabular font-bold"
                  style={{ color: item.color }}
                >
                  {daysRemaining === 0 ? 'Hôm nay' : `-${daysRemaining}d`}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActiveView('lunar-countdown')}
              className="ml-auto shrink-0 text-[11px] font-medium text-ink-muted hover:text-vermilion dark:text-obsidian-muted"
            >
              Quản lý →
            </button>
          </div>
        )}

        {/* Calendar Body */}
        {calendarView === 'year' && (
          <YearGridView
            onSelectDate={(dateISO) => {
              setSelectedDate(dateISO)
            }}
            onCreateEvent={openCreateModal}
            onJumpToMonth={(monthStartISO) => {
              setVisibleMonth(monthStartISO)
              setSelectedDate(monthStartISO)
              setCalendarView('month')
            }}
          />
        )}

        {calendarView === 'month' && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Weekday Strip */}
            <div className="grid grid-cols-7 border-b border-hairline bg-paper-subtle dark:border-obsidian-border dark:bg-obsidian-surface">
              {DAY_HEADERS.map((label, idx) => (
                <div
                  key={label}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                    idx === 6
                      ? 'text-vermilion'
                      : 'text-ink-muted dark:text-obsidian-muted'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 6x7 Architectural Grid */}
            <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
              {gridDates.map((dateISO) => {
                const [, mm, dd] = dateISO.split('-').map(Number)
                const isCurrentMonth = mm === visMonth
                const isToday = dateISO === todayISO
                const isSelected = dateISO === selectedDateISO
                const lunar = showLunar ? getLunarInfoFromISO(dateISO) : null
                const holidays = lunar ? getVietnameseHolidays(dd, mm, lunar) : []
                const dayEvents: EventOccurrence[] = occurrencesByDate.get(dateISO) ?? []
                const dayNote = settings.enabledModules['daily-notes']
                  ? notesByDate.get(dateISO)
                  : undefined
                const moodMeta = dayNote ? getMoodMeta(dayNote.mood) : null
                const openTaskCount = settings.enabledModules['tasks-habits']
                  ? (openTaskCountByDate.get(dateISO) ?? 0)
                  : 0

                return (
                  <div
                    key={dateISO}
                    onClick={() => setSelectedDate(dateISO)}
                    onDoubleClick={() => openCreateModal(dateISO)}
                    className={`flex min-h-0 cursor-pointer flex-col border-r border-b border-hairline p-1.5 transition-colors dark:border-obsidian-border ${
                      !isCurrentMonth
                        ? 'bg-paper-subtle/60 opacity-55 dark:bg-obsidian-surface/40'
                        : 'bg-paper hover:bg-paper-subtle/70 dark:bg-obsidian dark:hover:bg-obsidian-surface/70'
                    } ${
                      isSelected
                        ? 'ring-1 ring-inset ring-vermilion bg-vermilion/[0.03] dark:bg-vermilion/[0.08]'
                        : ''
                    }`}
                  >
                    {/* Date Top Row */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-mono-tabular flex h-6 w-6 items-center justify-center text-[12.5px] font-semibold ${
                            isToday
                              ? 'rounded-full bg-vermilion text-white'
                              : 'text-ink dark:text-obsidian-ink'
                          }`}
                        >
                          {dd}
                        </span>
                        {moodMeta && (
                          <span
                            title={`Tâm trạng: ${moodMeta.label}`}
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: moodMeta.color }}
                          />
                        )}
                        {openTaskCount > 0 && (
                          <span
                            title={`${openTaskCount} công việc chưa xong`}
                            className="font-mono-tabular rounded-[2px] bg-jade/15 px-1 text-[9.5px] font-semibold text-jade"
                          >
                            {openTaskCount}
                          </span>
                        )}
                      </div>

                      {lunar && (
                        <span
                          className={`font-mono-tabular text-[10.5px] ${
                            lunar.isAuspiciousMarker
                              ? 'font-semibold text-vermilion'
                              : 'text-ink-muted dark:text-obsidian-muted'
                          }`}
                        >
                          {lunar.shortLabel}
                        </span>
                      )}
                    </div>

                    {/* Holiday Tag */}
                    {holidays[0] && (
                      <div className="mt-0.5 truncate rounded-[2px] bg-vermilion-soft px-1 py-0.5 text-[10px] font-medium text-vermilion dark:bg-vermilion/20 dark:text-[#F4725B]">
                        {holidays[0].name}
                      </div>
                    )}

                    {/* Events Stack */}
                    <div className="mt-1 flex-1 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, holidays[0] ? 2 : 3).map(({ occurrenceKey, event }) => (
                        <button
                          key={occurrenceKey}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(event)
                          }}
                          className="flex w-full items-center gap-1 truncate rounded-[2px] bg-black/[0.04] px-1.5 py-0.5 text-left text-[11px] font-medium text-ink transition-colors hover:bg-black/[0.08] dark:bg-white/[0.07] dark:text-obsidian-ink dark:hover:bg-white/[0.12]"
                          style={{ borderLeft: `2.5px solid ${event.color}` }}
                        >
                          {!event.all_day && event.start_time && (
                            <span className="font-mono-tabular shrink-0 text-[10px] text-ink-muted dark:text-obsidian-muted">
                              {event.start_time}
                            </span>
                          )}
                          <span className="truncate">{event.title}</span>
                        </button>
                      ))}
                      {dayEvents.length > (holidays[0] ? 2 : 3) && (
                        <div className="font-mono-tabular px-1 text-[10px] font-medium text-ink-muted dark:text-obsidian-muted">
                          +{dayEvents.length - (holidays[0] ? 2 : 3)} nữa
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {calendarView === 'week' && (
          <div className="grid min-h-0 flex-1 grid-cols-7 divide-x divide-hairline overflow-y-auto dark:divide-obsidian-border">
            {weekDates.map((dateISO, idx) => {
              const [, mm, dd] = dateISO.split('-').map(Number)
              const lunar = showLunar ? getLunarInfoFromISO(dateISO) : null
              const isToday = dateISO === todayISO
              const isSelected = dateISO === selectedDateISO
              const dayEvents = occurrencesByDate.get(dateISO) ?? []

              return (
                <div
                  key={dateISO}
                  onClick={() => setSelectedDate(dateISO)}
                  className={`flex flex-col p-2.5 ${
                    isSelected ? 'bg-vermilion/[0.03] dark:bg-vermilion/[0.06]' : ''
                  }`}
                >
                  <div className="mb-3 border-b border-hairline pb-2 dark:border-obsidian-border">
                    <div className="text-[11px] font-semibold text-ink-muted dark:text-obsidian-muted">
                      {DAY_HEADERS[idx]}
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                      <span
                        className={`font-mono-tabular text-[18px] font-bold ${
                          isToday ? 'text-vermilion' : 'text-ink dark:text-obsidian-ink'
                        }`}
                      >
                        {dd}/{mm}
                      </span>
                      {lunar && (
                        <span className="font-mono-tabular text-[11px] text-ink-muted dark:text-obsidian-muted">
                          {lunar.day}/{lunar.month}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map(({ occurrenceKey, event }) => (
                      <button
                        key={occurrenceKey}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(event)
                        }}
                        className="w-full rounded-[2px] border border-hairline bg-paper-subtle p-2 text-left text-[12px] hover:border-ink/30 dark:border-obsidian-border dark:bg-obsidian-surface"
                        style={{ borderLeftWidth: '3px', borderLeftColor: event.color }}
                      >
                        <div className="font-mono-tabular text-[10.5px] text-ink-muted dark:text-obsidian-muted">
                          {event.all_day ? 'Cả ngày' : (event.start_time ?? '')}
                        </div>
                        <div className="mt-0.5 font-semibold text-ink dark:text-obsidian-ink">
                          {event.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Day & Agenda Views */}
        {(calendarView === 'day' || calendarView === 'agenda') && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3 dark:border-obsidian-border">
                <h2 className="text-[15px] font-semibold text-ink dark:text-obsidian-ink">
                  {calendarView === 'day'
                    ? `Lịch trình ngày ${selectedDateISO}`
                    : 'Sự kiện trong 30 ngày tới'}
                </h2>
              </div>

              {occurrencesByDate.size === 0 ? (
                <div className="rounded-[2px] border border-dashed border-hairline p-8 text-center text-[13px] text-ink-muted dark:border-obsidian-border dark:text-obsidian-muted">
                  Chưa có sự kiện nào trong khoảng thời gian này.
                </div>
              ) : (
                Array.from(occurrencesByDate.entries()).map(([dateISO, list]) => {
                  const lunar = getLunarInfoFromISO(dateISO)
                  return (
                    <div
                      key={dateISO}
                      className="rounded-[2px] border border-hairline bg-paper-subtle p-3.5 dark:border-obsidian-border dark:bg-obsidian-surface"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(dateISO)}
                          className="font-mono-tabular text-[13px] font-bold text-ink hover:text-vermilion dark:text-obsidian-ink"
                        >
                          {dateISO}
                        </button>
                        {showLunar && (
                          <span className="font-mono-tabular text-[11.5px] text-vermilion">
                            ÂL {lunar.day}/{lunar.month} · {lunar.canChiDay}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {list.map(({ occurrenceKey, event }) => (
                          <button
                            key={occurrenceKey}
                            type="button"
                            onClick={() => openEditModal(event)}
                            className="flex w-full items-center justify-between rounded-[2px] bg-paper px-3 py-2 text-left transition-colors hover:bg-black/[0.03] dark:bg-obsidian-elevated dark:hover:bg-white/[0.05]"
                            style={{ borderLeft: `3px solid ${event.color}` }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono-tabular w-16 text-[12px] text-ink-muted dark:text-obsidian-muted">
                                {event.all_day ? 'Cả ngày' : (event.start_time ?? '—')}
                              </span>
                              <span className="text-[13px] font-medium text-ink dark:text-obsidian-ink">
                                {event.title}
                              </span>
                            </div>
                            {(event.recurrence === 'lunar-monthly' ||
                              event.recurrence === 'lunar-yearly') && (
                              <MoonStars size={14} weight="fill" className="text-vermilion" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Contextual Day Inspector (collapsible in 12-Month Year view) */}
      {(calendarView !== 'year' || showInspectorInYear) && (
        <DayInspectorPanel onCreateEvent={openCreateModal} onEditEvent={openEditModal} />
      )}

      {/* Event Creation / Edit Modal */}
      <EventModal
        open={modalOpen}
        initialDateISO={modalDateISO}
        editingEvent={editingEvent}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={removeEvent}
      />
    </div>
  )
}
