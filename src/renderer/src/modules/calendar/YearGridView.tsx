import { useMemo, useState } from 'react'
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  DotsSixVertical
} from '@phosphor-icons/react'
import { expandEventsForRange, formatISODate } from '@shared/calendar/recurrence'
import {
  buildRolling12Months,
  ENGLISH_MONTH_NAMES,
  isCustomMonthOrder,
  normalizeYearMonthOrder,
  parseMonthKey,
  reorderMonthList,
  VIETNAMESE_MONTH_NAMES
} from '@shared/calendar/yearLayout'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { getVietnameseHolidays } from '@shared/lunar/vnHolidays'
import type { EventOccurrence, YearLayoutSettings } from '@shared/types'
import { useAppStore } from '@renderer/core/store/useAppStore'

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

interface YearGridViewProps {
  onSelectDate: (dateISO: string) => void
  onCreateEvent: (dateISO: string) => void
  onJumpToMonth: (monthStartISO: string) => void
}

function buildMonthCells(year: number, month: number): Array<string | null> {
  const firstDate = new Date(year, month - 1, 1)
  const firstDow = firstDate.getDay() // 0 Sun .. 6 Sat
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: Array<string | null> = Array.from({ length: leadingBlanks }, () => null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }
  return cells
}

export function YearGridView({
  onSelectDate,
  onCreateEvent,
  onJumpToMonth
}: YearGridViewProps): React.JSX.Element {
  const { events, settings, selectedDateISO, updateSettings } = useAppStore()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const todayISO = formatISODate(new Date())
  const todayMonthKey = todayISO.slice(0, 7)

  const layout = settings.yearLayout
  const showLunar = settings.showLunarInGrid && settings.enabledModules['lunar-countdown']

  const orderedKeys = useMemo(
    () => normalizeYearMonthOrder(layout.startYear, layout.startMonth, layout.customOrder),
    [layout.startYear, layout.startMonth, layout.customOrder]
  )

  const hasCustomOrder = useMemo(
    () => isCustomMonthOrder(layout.startYear, layout.startMonth, orderedKeys),
    [layout.startYear, layout.startMonth, orderedKeys]
  )

  // Compute full date bounds across the 12 displayed months to expand events once
  const occurrencesByDate = useMemo(() => {
    const sorted = [...orderedKeys].sort()
    const first = parseMonthKey(sorted[0])
    const last = parseMonthKey(sorted[sorted.length - 1])
    if (!first || !last) return new Map<string, EventOccurrence[]>()
    const lastDay = new Date(last.year, last.month, 0).getDate()
    const startISO = `${first.key}-01`
    const endISO = `${last.key}-${String(lastDay).padStart(2, '0')}`
    return expandEventsForRange(events, startISO, endISO)
  }, [events, orderedKeys])

  const patchYearLayout = (patch: Partial<YearLayoutSettings>): void => {
    const next: YearLayoutSettings = { ...layout, ...patch }
    void updateSettings({ yearLayout: next })
  }

  const applyStart = (startYear: number, startMonth: number): void => {
    patchYearLayout({
      startYear,
      startMonth,
      customOrder: buildRolling12Months(startYear, startMonth)
    })
  }

  const handleReorder = (fromIdx: number, toIdx: number): void => {
    if (fromIdx === toIdx) return
    const nextOrder = reorderMonthList(orderedKeys, fromIdx, toIdx)
    patchYearLayout({ customOrder: nextOrder })
  }

  const gridColsClass =
    layout.columns === 4
      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
      : layout.columns === 3
        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2'

  const currentYear = Number(todayISO.slice(0, 4))
  const currentMonth = Number(todayISO.slice(5, 7))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-paper-subtle dark:bg-obsidian">
      {/* Year Arrangement Sub-toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-paper px-5 py-2 dark:border-obsidian-border dark:bg-obsidian-surface">
        {/* Start Month + Year Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-muted dark:text-obsidian-muted">
            Bắt đầu từ:
          </span>
          <select
            aria-label="Tháng bắt đầu"
            value={layout.startMonth}
            onChange={(e) => applyStart(layout.startYear, Number(e.target.value))}
            className="rounded-[2px] border border-hairline bg-paper-subtle px-2 py-1 text-[12px] font-medium text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
          >
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-[2px] border border-hairline bg-paper-subtle dark:border-obsidian-border dark:bg-obsidian-elevated">
            <button
              type="button"
              onClick={() => applyStart(layout.startYear - 1, layout.startMonth)}
              aria-label="Năm trước"
              className="p-1 text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink"
            >
              <CaretLeft size={13} />
            </button>
            <span className="font-mono-tabular px-2 text-[12px] font-bold text-ink dark:text-obsidian-ink">
              {layout.startYear}
            </span>
            <button
              type="button"
              onClick={() => applyStart(layout.startYear + 1, layout.startMonth)}
              aria-label="Năm sau"
              className="p-1 text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink"
            >
              <CaretRight size={13} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="ml-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyStart(layout.startYear, 1)}
              className={`rounded-[2px] border px-2 py-1 text-[11.5px] font-medium transition-colors ${
                layout.startMonth === 1 && !hasCustomOrder
                  ? 'border-ink bg-ink text-white dark:border-obsidian-ink dark:bg-obsidian-ink dark:text-obsidian'
                  : 'border-hairline bg-paper text-ink-muted hover:border-ink/40 hover:text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted'
              }`}
            >
              T1 → T12
            </button>
            <button
              type="button"
              onClick={() => applyStart(currentYear, currentMonth)}
              className={`rounded-[2px] border px-2 py-1 text-[11.5px] font-medium transition-colors ${
                layout.startYear === currentYear &&
                layout.startMonth === currentMonth &&
                !hasCustomOrder
                  ? 'border-ink bg-ink text-white dark:border-obsidian-ink dark:bg-obsidian-ink dark:text-obsidian'
                  : 'border-hairline bg-paper text-ink-muted hover:border-ink/40 hover:text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted'
              }`}
            >
              Từ tháng này
            </button>
            <button
              type="button"
              onClick={() => applyStart(layout.startYear, 9)}
              className={`rounded-[2px] border px-2 py-1 text-[11.5px] font-medium transition-colors ${
                layout.startMonth === 9 && !hasCustomOrder
                  ? 'border-ink bg-ink text-white dark:border-obsidian-ink dark:bg-obsidian-ink dark:text-obsidian'
                  : 'border-hairline bg-paper text-ink-muted hover:border-ink/40 hover:text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted'
              }`}
            >
              T9 → T8
            </button>
          </div>
        </div>

        {/* Columns & Reset Order Controls */}
        <div className="flex items-center gap-2">
          {hasCustomOrder && (
            <button
              type="button"
              onClick={() =>
                patchYearLayout({
                  customOrder: buildRolling12Months(layout.startYear, layout.startMonth)
                })
              }
              className="flex items-center gap-1 rounded-[2px] border border-vermilion/40 bg-vermilion-soft px-2 py-1 text-[11.5px] font-semibold text-vermilion hover:bg-vermilion hover:text-white dark:bg-vermilion/15 dark:text-[#F4725B]"
            >
              <ArrowCounterClockwise size={13} />
              <span>Đặt lại thứ tự</span>
            </button>
          )}

          <div className="flex rounded-[2px] border border-hairline bg-paper-subtle p-0.5 dark:border-obsidian-border dark:bg-obsidian-elevated">
            {([4, 3, 2] as const).map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => patchYearLayout({ columns: cols })}
                className={`font-mono-tabular rounded-[2px] px-2 py-0.5 text-[11.5px] font-medium ${
                  layout.columns === cols
                    ? 'bg-paper text-ink shadow-xs dark:bg-obsidian-surface dark:text-obsidian-ink'
                    : 'text-ink-muted hover:text-ink dark:text-obsidian-muted'
                }`}
              >
                {cols} cột
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 12-Month Draggable Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-2.5 flex items-center justify-between text-[11.5px] text-ink-muted dark:text-obsidian-muted">
          <span>
            Kéo thả bất kỳ thẻ tháng nào để tự sắp xếp vị trí · Bấm tên tháng để phóng to · Nháy
            đúp ngày để thêm sự kiện
          </span>
          {hasCustomOrder && (
            <span className="font-mono-tabular font-semibold text-vermilion">
              Đang dùng thứ tự tự sắp xếp
            </span>
          )}
        </div>

        <div className={`grid gap-3.5 ${gridColsClass}`}>
          {orderedKeys.map((monthKey, idx) => {
            const parsed = parseMonthKey(monthKey)
            if (!parsed) return null
            const { year, month } = parsed
            const cells = buildMonthCells(year, month)
            const isCurrentMonthCard = monthKey === todayMonthKey
            const isDragging = dragIndex === idx
            const isDragTarget = dragOverIndex === idx && dragIndex !== idx

            return (
              <article
                key={monthKey}
                draggable
                onDragStart={(e) => {
                  setDragIndex(idx)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', String(idx))
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (dragOverIndex !== idx) setDragOverIndex(idx)
                }}
                onDragLeave={() => {
                  if (dragOverIndex === idx) setDragOverIndex(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const fromIdx =
                    dragIndex !== null ? dragIndex : Number(e.dataTransfer.getData('text/plain'))
                  if (Number.isInteger(fromIdx)) {
                    handleReorder(fromIdx, idx)
                  }
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                className={`group flex flex-col rounded-[2px] border bg-paper p-3 transition-all dark:bg-obsidian-surface ${
                  isDragTarget
                    ? 'border-vermilion ring-2 ring-vermilion/40'
                    : isCurrentMonthCard
                      ? 'border-vermilion/50 dark:border-vermilion/60'
                      : 'border-hairline dark:border-obsidian-border'
                } ${isDragging ? 'opacity-45' : 'opacity-100'}`}
              >
                {/* Wall-Calendar Month Header (inspired by reference image) */}
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-hairline pb-2 dark:border-obsidian-border">
                  <button
                    type="button"
                    onClick={() => onJumpToMonth(`${monthKey}-01`)}
                    title={`Mở chi tiết Tháng ${month}/${year}`}
                    className="flex items-baseline gap-2 text-left transition-opacity hover:opacity-80"
                  >
                    <span
                      className={`font-mono-tabular text-[26px] font-bold leading-none ${
                        isCurrentMonthCard
                          ? 'text-vermilion'
                          : 'text-[#0E7490] dark:text-[#38BDF8]'
                      }`}
                    >
                      {month}
                    </span>
                    <div className="leading-tight">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-bold tracking-wide text-amber">
                          {VIETNAMESE_MONTH_NAMES[month - 1]}
                        </span>
                        <span className="font-mono-tabular text-[11px] font-semibold text-amber">
                          · {year}
                        </span>
                      </div>
                      <div className="text-[11px] italic text-[#0E7490] dark:text-[#38BDF8]">
                        {ENGLISH_MONTH_NAMES[month - 1]}
                      </div>
                    </div>
                  </button>

                  {/* Drag Grip + Quick Swap Controls */}
                  <div className="flex items-center gap-0.5 text-ink-muted dark:text-obsidian-muted">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleReorder(idx, idx - 1)}
                      title="Đẩy lên trước"
                      className="rounded-[2px] p-0.5 opacity-0 transition-opacity hover:bg-black/[0.06] hover:text-ink disabled:opacity-0 group-hover:opacity-100 dark:hover:bg-white/[0.08] dark:hover:text-obsidian-ink"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedKeys.length - 1}
                      onClick={() => handleReorder(idx, idx + 1)}
                      title="Đẩy ra sau"
                      className="rounded-[2px] p-0.5 opacity-0 transition-opacity hover:bg-black/[0.06] hover:text-ink disabled:opacity-0 group-hover:opacity-100 dark:hover:bg-white/[0.08] dark:hover:text-obsidian-ink"
                    >
                      <ArrowRight size={12} />
                    </button>
                    <span
                      title="Kéo thả để sắp xếp tháng"
                      className="cursor-grab rounded-[2px] p-0.5 active:cursor-grabbing"
                    >
                      <DotsSixVertical size={15} weight="bold" />
                    </span>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="mb-1 grid grid-cols-7 text-center">
                  {WEEKDAY_SHORT.map((label, colIdx) => (
                    <div
                      key={label}
                      className={`py-0.5 text-[10px] font-bold tracking-wider ${
                        colIdx === 6
                          ? 'text-vermilion'
                          : colIdx === 5
                            ? 'text-[#0E7490] dark:text-[#38BDF8]'
                            : 'text-ink-muted dark:text-obsidian-muted'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Compact Day Matrix */}
                <div className="grid grid-cols-7 gap-y-0.5 text-center">
                  {cells.map((dateISO, cellIdx) => {
                    if (!dateISO) {
                      return <div key={`empty-${cellIdx}`} className="h-[34px]" />
                    }
                    const [, mm, dd] = dateISO.split('-').map(Number)
                    const colIdx = cellIdx % 7 // 5 = Sat, 6 = Sun
                    const isToday = dateISO === todayISO
                    const isSelected = dateISO === selectedDateISO
                    const lunar = showLunar ? getLunarInfoFromISO(dateISO) : null
                    const holidays = lunar ? getVietnameseHolidays(dd, mm, lunar) : []
                    const isPublicHoliday = holidays.some((h) => h.isPublicHoliday)
                    const dayEvents = occurrencesByDate.get(dateISO) ?? []

                    const lunarText = lunar
                      ? dd === 1 || lunar.day === 1
                        ? `${lunar.day}/${lunar.month}${lunar.isLeapMonth ? 'N' : ''}`
                        : `${lunar.day}`
                      : null

                    const tooltipLines = [
                      dateISO,
                      lunar ? `Âm lịch: ${lunar.fullLabel}` : '',
                      ...holidays.map((h) => h.name),
                      ...dayEvents.map((e) => `• ${e.event.title}`)
                    ].filter(Boolean)

                    return (
                      <button
                        key={dateISO}
                        type="button"
                        title={tooltipLines.join('\n')}
                        onClick={() => onSelectDate(dateISO)}
                        onDoubleClick={() => onCreateEvent(dateISO)}
                        className={`relative flex h-[34px] flex-col items-center justify-center rounded-[2px] transition-colors ${
                          isToday
                            ? 'bg-vermilion text-white'
                            : isSelected
                              ? 'bg-vermilion/10 ring-1 ring-inset ring-vermilion dark:bg-vermilion/20'
                              : 'hover:bg-paper-subtle dark:hover:bg-obsidian-elevated'
                        }`}
                      >
                        <span
                          className={`font-mono-tabular text-[12.5px] font-bold leading-none ${
                            isToday
                              ? 'text-white'
                              : colIdx === 6 || isPublicHoliday
                                ? 'text-vermilion'
                                : colIdx === 5
                                  ? 'text-[#0E7490] dark:text-[#38BDF8]'
                                  : 'text-ink dark:text-obsidian-ink'
                          }`}
                        >
                          {dd}
                        </span>

                        {lunarText && (
                          <span
                            className={`font-mono-tabular mt-0.5 text-[9px] leading-none ${
                              isToday
                                ? 'text-white/90'
                                : lunar?.isAuspiciousMarker
                                  ? 'font-semibold text-vermilion'
                                  : 'text-ink-muted dark:text-obsidian-muted'
                            }`}
                          >
                            {lunarText}
                          </span>
                        )}

                        {dayEvents.length > 0 && (
                          <span className="mt-0.5 flex items-center gap-0.5">
                            {dayEvents.slice(0, 3).map((occ) => (
                              <span
                                key={occ.occurrenceKey}
                                className="h-[3.5px] w-[3.5px] rounded-full"
                                style={{
                                  backgroundColor: isToday ? '#FFFFFF' : occ.event.color
                                }}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
