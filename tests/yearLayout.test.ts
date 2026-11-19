import { describe, expect, it } from 'vitest'
import {
  buildRolling12Months,
  isCustomMonthOrder,
  normalizeYearMonthOrder,
  reorderMonthList
} from '@shared/calendar/yearLayout'

describe('Year 12-Month Custom Layout Helpers', () => {
  it('builds 12 rolling months crossing calendar year boundary (Sep 2026 -> Aug 2027)', () => {
    const list = buildRolling12Months(2026, 9)
    expect(list).toHaveLength(12)
    expect(list[0]).toBe('2026-09')
    expect(list[3]).toBe('2026-12')
    expect(list[4]).toBe('2027-01')
    expect(list[11]).toBe('2027-08')
  })

  it('reorders months immutably and detects custom order', () => {
    const base = buildRolling12Months(2026, 9)
    const reordered = reorderMonthList(base, 0, 3)
    expect(reordered[0]).toBe('2026-10')
    expect(reordered[3]).toBe('2026-09')
    expect(base[0]).toBe('2026-09') // original untouched
    expect(isCustomMonthOrder(2026, 9, reordered)).toBe(true)
    expect(isCustomMonthOrder(2026, 9, base)).toBe(false)
  })

  it('falls back to canonical sequence when custom order is empty or mismatched', () => {
    expect(normalizeYearMonthOrder(2026, 9, [])).toEqual(buildRolling12Months(2026, 9))
    expect(normalizeYearMonthOrder(2026, 9, ['2025-01'])).toEqual(buildRolling12Months(2026, 9))
  })
})
