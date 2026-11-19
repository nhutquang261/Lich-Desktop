import { describe, expect, it } from 'vitest'
import {
  convertLunarToSolar,
  convertSolarToLunar,
  getLunarInfoFromISO
} from '@shared/lunar/lunarCalendar'
import { getVietnameseHolidays } from '@shared/lunar/vnHolidays'

describe('Vietnamese Lunar Calendar Engine (Ho Ngoc Duc, UTC+7)', () => {
  it('converts Tet Giap Thin 2024 (2024-02-10) accurately', () => {
    const info = convertSolarToLunar(10, 2, 2024)
    expect(info.day).toBe(1)
    expect(info.month).toBe(1)
    expect(info.year).toBe(2024)
    expect(info.isLeapMonth).toBe(false)
    expect(info.canChiYear).toBe('Giáp Thìn')
    expect(info.isAuspiciousMarker).toBe(true)
  })

  it('converts Tet At Ty 2025 (2025-01-29) and detects Mid-Autumn 2025 (2025-10-06)', () => {
    const tet2025 = getLunarInfoFromISO('2025-01-29')
    expect(tet2025.day).toBe(1)
    expect(tet2025.month).toBe(1)
    expect(tet2025.year).toBe(2025)
    expect(tet2025.canChiYear).toBe('Ất Tỵ')

    const midAutumn2025 = getLunarInfoFromISO('2025-10-06')
    expect(midAutumn2025.day).toBe(15)
    expect(midAutumn2025.month).toBe(8)
    expect(midAutumn2025.isAuspiciousMarker).toBe(true)

    const holidays = getVietnameseHolidays(6, 10, midAutumn2025)
    expect(holidays.some((h) => h.name === 'Tết Trung Thu')).toBe(true)
  })

  it('converts Tet Binh Ngo 2026 (2026-02-17) bidirectionally', () => {
    const lunar = getLunarInfoFromISO('2026-02-17')
    expect(lunar.day).toBe(1)
    expect(lunar.month).toBe(1)
    expect(lunar.year).toBe(2026)
    expect(lunar.canChiYear).toBe('Bính Ngọ')

    const solar = convertLunarToSolar(1, 1, 2026, false)
    expect(solar).toEqual({ day: 17, month: 2, year: 2026 })
  })

  it('detects leap month 6 in lunar year 2025 (2025-07-25)', () => {
    const leapStart = getLunarInfoFromISO('2025-07-25')
    expect(leapStart.day).toBe(1)
    expect(leapStart.month).toBe(6)
    expect(leapStart.isLeapMonth).toBe(true)
  })
})
