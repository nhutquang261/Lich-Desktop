import { describe, expect, it } from 'vitest'
import { exportEventsToIcs, parseIcsEvents } from '@shared/calendar/icsCodec'
import type { CalendarEvent } from '@shared/types'

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'ev-ics-1',
    user_id: null,
    title: 'Họp định kỳ, Quý 4',
    description: 'Dòng 1\nDòng 2',
    start_date: '2026-11-20',
    end_date: '2026-11-20',
    start_time: '09:30',
    end_time: '10:30',
    all_day: false,
    category: 'work',
    color: '#334155',
    recurrence: 'weekly',
    lunar_day: null,
    lunar_month: null,
    reminder_minutes: 15,
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    deleted_at: null,
    sync_status: 'pending',
    ...overrides
  }
}

describe('iCalendar (.ics) Export & Import Codec', () => {
  it('round-trips timed recurring events and unescapes punctuation/newlines', () => {
    const ics = exportEventsToIcs([makeEvent({})])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('RRULE:FREQ=WEEKLY')

    const imported = parseIcsEvents(ics)
    expect(imported).toHaveLength(1)
    expect(imported[0].title).toBe('Họp định kỳ, Quý 4')
    expect(imported[0].description).toBe('Dòng 1\nDòng 2')
    expect(imported[0].start_date).toBe('2026-11-20')
    expect(imported[0].start_time).toBe('09:30')
    expect(imported[0].end_time).toBe('10:30')
    expect(imported[0].all_day).toBe(false)
    expect(imported[0].recurrence).toBe('weekly')
  })

  it('round-trips all-day multi-day events converting exclusive DTEND properly', () => {
    const allDayEv = makeEvent({
      id: 'ev-allday',
      title: 'Nghỉ phép',
      start_date: '2026-12-24',
      end_date: '2026-12-26',
      all_day: true,
      start_time: null,
      end_time: null,
      recurrence: 'none'
    })
    const ics = exportEventsToIcs([allDayEv])
    expect(ics).toContain('DTSTART;VALUE=DATE:20261224')
    expect(ics).toContain('DTEND;VALUE=DATE:20261227')

    const imported = parseIcsEvents(ics)
    expect(imported).toHaveLength(1)
    expect(imported[0].all_day).toBe(true)
    expect(imported[0].start_date).toBe('2026-12-24')
    expect(imported[0].end_date).toBe('2026-12-26')
  })
})
