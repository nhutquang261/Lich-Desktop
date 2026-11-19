import { describe, expect, it } from 'vitest'
import { expandEventsForRange } from '@shared/calendar/recurrence'
import type { CalendarEvent } from '@shared/types'

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'ev-1',
    user_id: null,
    title: 'Test Event',
    description: '',
    start_date: '2026-02-01',
    end_date: '2026-02-01',
    start_time: '09:00',
    end_time: '10:00',
    all_day: false,
    category: 'personal',
    color: '#0D7A5F',
    recurrence: 'none',
    lunar_day: null,
    lunar_month: null,
    reminder_minutes: 15,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    sync_status: 'pending',
    ...overrides
  }
}

describe('Calendar Recurrence Engine', () => {
  it('expands multi-day non-recurring events across every included day', () => {
    const ev = makeEvent({ start_date: '2026-03-10', end_date: '2026-03-12', all_day: true })
    const map = expandEventsForRange([ev], '2026-03-01', '2026-03-31')
    expect(map.has('2026-03-10')).toBe(true)
    expect(map.has('2026-03-11')).toBe(true)
    expect(map.has('2026-03-12')).toBe(true)
    expect(map.has('2026-03-13')).toBe(false)
  })

  it('expands lunar-monthly recurrence accurately on 15th Lunar day', () => {
    const ramEvent = makeEvent({
      id: 'ram-15',
      title: 'Cúng Rằm',
      start_date: '2026-02-01',
      end_date: '2026-02-01',
      recurrence: 'lunar-monthly',
      lunar_day: 15
    })
    // 2026-03-03 is 15/1/2026 Lunar (Ram Thang Gieng Binh Ngo)
    const map = expandEventsForRange([ramEvent], '2026-02-17', '2026-03-15')
    expect(map.has('2026-03-03')).toBe(true)
    expect(map.size).toBe(1)
  })

  it('expands lunar-yearly recurrence on Hung Kings Commemoration (10/3 Lunar)', () => {
    const gioTo = makeEvent({
      id: 'gio-to',
      title: 'Giỗ Tổ',
      start_date: '2026-01-01',
      end_date: '2026-01-01',
      recurrence: 'lunar-yearly',
      lunar_day: 10,
      lunar_month: 3
    })
    // In 2026, 10/3 Lunar falls on 2026-04-26
    const map = expandEventsForRange([gioTo], '2026-04-01', '2026-04-30')
    expect(map.has('2026-04-26')).toBe(true)
    expect(map.size).toBe(1)
  })

  it('skips soft-deleted events', () => {
    const deleted = makeEvent({
      start_date: '2026-03-10',
      end_date: '2026-03-10',
      deleted_at: '2026-03-01T00:00:00.000Z'
    })
    const map = expandEventsForRange([deleted], '2026-03-01', '2026-03-31')
    expect(map.size).toBe(0)
  })
})
