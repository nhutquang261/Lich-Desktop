import type { CalendarEvent, EventOccurrence } from '../types'
import { getLunarInfoFromISO } from '../lunar/lunarCalendar'

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysISO(iso: string, days: number): string {
  const dt = parseISODate(iso)
  dt.setDate(dt.getDate() + days)
  return formatISODate(dt)
}

export function listDatesInRange(startISO: string, endISO: string): string[] {
  const dates: string[] = []
  let current = parseISODate(startISO)
  const end = parseISODate(endISO)
  while (current <= end) {
    dates.push(formatISODate(current))
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
  }
  return dates
}

function matchesEventOnDate(event: CalendarEvent, dateISO: string): boolean {
  if (event.deleted_at) return false

  if (event.recurrence === 'none') {
    return dateISO >= event.start_date && dateISO <= event.end_date
  }

  if (dateISO < event.start_date) return false

  const start = parseISODate(event.start_date)
  const target = parseISODate(dateISO)

  switch (event.recurrence) {
    case 'daily':
      return true
    case 'weekly':
      return start.getDay() === target.getDay()
    case 'monthly':
      return start.getDate() === target.getDate()
    case 'yearly':
      return start.getMonth() === target.getMonth() && start.getDate() === target.getDate()
    case 'lunar-monthly': {
      const lunar = getLunarInfoFromISO(dateISO)
      const anchorDay = event.lunar_day ?? getLunarInfoFromISO(event.start_date).day
      return !lunar.isLeapMonth && lunar.day === anchorDay
    }
    case 'lunar-yearly': {
      const lunar = getLunarInfoFromISO(dateISO)
      const anchor = getLunarInfoFromISO(event.start_date)
      const targetLunarDay = event.lunar_day ?? anchor.day
      const targetLunarMonth = event.lunar_month ?? anchor.month
      return (
        !lunar.isLeapMonth &&
        lunar.day === targetLunarDay &&
        lunar.month === targetLunarMonth
      )
    }
    default:
      return false
  }
}

export function expandEventsForRange(
  events: CalendarEvent[],
  startISO: string,
  endISO: string
): Map<string, EventOccurrence[]> {
  const result = new Map<string, EventOccurrence[]>()
  const dates = listDatesInRange(startISO, endISO)

  for (const dateISO of dates) {
    const dayOccurrences: EventOccurrence[] = []
    for (const event of events) {
      if (matchesEventOnDate(event, dateISO)) {
        dayOccurrences.push({
          occurrenceKey: `${event.id}_${dateISO}`,
          event,
          date: dateISO
        })
      }
    }
    dayOccurrences.sort((a, b) => {
      if (a.event.all_day && !b.event.all_day) return -1
      if (!a.event.all_day && b.event.all_day) return 1
      return (a.event.start_time ?? '').localeCompare(b.event.start_time ?? '')
    })
    if (dayOccurrences.length > 0) {
      result.set(dateISO, dayOccurrences)
    }
  }

  return result
}
