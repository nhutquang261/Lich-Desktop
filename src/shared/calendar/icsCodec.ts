import { addDaysISO } from '@shared/calendar/recurrence'
import type { EventInput } from '@shared/schemas'
import type { CalendarEvent, RecurrenceRule } from '@shared/types'

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function toCompactDate(iso: string): string {
  return iso.replace(/-/g, '')
}

function toCompactDateTime(iso: string, time: string): string {
  return `${toCompactDate(iso)}T${time.replace(':', '')}00`
}

function toIcsRRule(recurrence: RecurrenceRule): string | null {
  switch (recurrence) {
    case 'daily':
      return 'FREQ=DAILY'
    case 'weekly':
      return 'FREQ=WEEKLY'
    case 'monthly':
      return 'FREQ=MONTHLY'
    case 'yearly':
      return 'FREQ=YEARLY'
    default:
      return null
  }
}

function fromIcsRRule(rruleValue: string): RecurrenceRule {
  const upper = rruleValue.toUpperCase()
  if (upper.includes('FREQ=DAILY')) return 'daily'
  if (upper.includes('FREQ=WEEKLY')) return 'weekly'
  if (upper.includes('FREQ=MONTHLY')) return 'monthly'
  if (upper.includes('FREQ=YEARLY')) return 'yearly'
  return 'none'
}

export function exportEventsToIcs(events: CalendarEvent[]): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lich Desktop Studio//VN Calendar 1.0//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  for (const ev of events) {
    if (ev.deleted_at) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.id}@lich-desktop.local`)
    lines.push(`DTSTAMP:${stamp}`)

    if (ev.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${toCompactDate(ev.start_date)}`)
      // RFC 5545 all-day DTEND is exclusive
      lines.push(`DTEND;VALUE=DATE:${toCompactDate(addDaysISO(ev.end_date, 1))}`)
    } else {
      lines.push(`DTSTART:${toCompactDateTime(ev.start_date, ev.start_time ?? '09:00')}`)
      lines.push(`DTEND:${toCompactDateTime(ev.end_date, ev.end_time ?? '10:00')}`)
    }

    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`)
    if (ev.description.trim()) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`)
    }
    const rrule = toIcsRRule(ev.recurrence)
    if (rrule) {
      lines.push(`RRULE:${rrule}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

function parseIcsDateField(raw: string): { dateISO: string; time: string | null } | null {
  const cleaned = raw.trim()
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(cleaned)
  if (dateOnly) {
    return {
      dateISO: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`,
      time: null
    }
  }
  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/.exec(cleaned)
  if (dateTime) {
    return {
      dateISO: `${dateTime[1]}-${dateTime[2]}-${dateTime[3]}`,
      time: `${dateTime[4]}:${dateTime[5]}`
    }
  }
  return null
}

export function parseIcsEvents(icsContent: string): EventInput[] {
  // Unfold RFC 5545 continuation lines (CRLF/LF followed by space or tab)
  const unfolded = icsContent.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const parsed: EventInput[] = []
  let inEvent = false
  let summary = ''
  let description = ''
  let dtStartRaw = ''
  let dtEndRaw = ''
  let rruleRaw = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true
      summary = ''
      description = ''
      dtStartRaw = ''
      dtEndRaw = ''
      rruleRaw = ''
      continue
    }

    if (trimmed === 'END:VEVENT' && inEvent) {
      inEvent = false
      const start = parseIcsDateField(dtStartRaw)
      if (summary.trim() && start) {
        const end = dtEndRaw ? parseIcsDateField(dtEndRaw) : null
        const allDay = start.time === null
        let endDate = end?.dateISO ?? start.dateISO
        if (allDay && end && end.dateISO > start.dateISO) {
          // Convert RFC 5545 exclusive DTEND back to inclusive end_date
          endDate = addDaysISO(end.dateISO, -1)
        }
        if (endDate < start.dateISO) endDate = start.dateISO

        parsed.push({
          title: unescapeIcsText(summary).slice(0, 140),
          description: unescapeIcsText(description).slice(0, 2000),
          start_date: start.dateISO,
          end_date: endDate,
          start_time: allDay ? null : start.time,
          end_time: allDay ? null : (end?.time ?? start.time),
          all_day: allDay,
          category: 'personal',
          color: '#0D7A5F',
          recurrence: rruleRaw ? fromIcsRRule(rruleRaw) : 'none',
          lunar_day: null,
          lunar_month: null,
          reminder_minutes: 15
        })
      }
      continue
    }

    if (!inEvent) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx <= 0) continue
    const keyPart = line.slice(0, colonIdx).toUpperCase()
    const valPart = line.slice(colonIdx + 1)
    const baseKey = keyPart.split(';')[0]

    if (baseKey === 'SUMMARY') summary = valPart
    else if (baseKey === 'DESCRIPTION') description = valPart
    else if (baseKey === 'DTSTART') dtStartRaw = valPart
    else if (baseKey === 'DTEND') dtEndRaw = valPart
    else if (baseKey === 'RRULE') rruleRaw = valPart
  }

  return parsed
}
