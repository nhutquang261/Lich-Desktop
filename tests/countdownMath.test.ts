import { describe, expect, it } from 'vitest'
import { resolveCountdown } from '@shared/countdown/countdownMath'
import type { CountdownItem } from '@shared/types'

function makeCountdown(overrides: Partial<CountdownItem>): CountdownItem {
  return {
    id: 'cd-1',
    user_id: null,
    title: 'Test Countdown',
    target_date: '2026-12-31',
    is_lunar: false,
    lunar_day: null,
    lunar_month: null,
    color: '#D9381E',
    pinned: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    sync_status: 'pending',
    ...overrides
  }
}

describe('Countdown Math (Solar & Lunar)', () => {
  it('calculates exact remaining days for a Solar countdown', () => {
    const cd = makeCountdown({ target_date: '2026-11-29' })
    const res = resolveCountdown(cd, '2026-11-19')
    expect(res.daysRemaining).toBe(10)
    expect(res.resolvedSolarISO).toBe('2026-11-29')
    expect(res.isPast).toBe(false)
  })

  it('flags past Solar countdowns cleanly', () => {
    const cd = makeCountdown({ target_date: '2026-11-10' })
    const res = resolveCountdown(cd, '2026-11-19')
    expect(res.daysRemaining).toBe(-9)
    expect(res.isPast).toBe(true)
  })

  it('rolls over a Lunar countdown to the next Lunar year if already passed', () => {
    const tet = makeCountdown({
      title: 'Tết Nguyên Đán',
      is_lunar: true,
      lunar_day: 1,
      lunar_month: 1,
      target_date: '2026-02-17'
    })
    // On 2026-11-19 (after Tet 2026), next Tet (1/1/2027 Lunar) is 2027-02-06
    const res = resolveCountdown(tet, '2026-11-19')
    expect(res.resolvedSolarISO).toBe('2027-02-06')
    expect(res.daysRemaining).toBe(79)
    expect(res.isPast).toBe(false)
  })
})
