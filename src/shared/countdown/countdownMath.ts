import { convertLunarToSolar, getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import type { CountdownItem } from '@shared/types'

export interface ResolvedCountdown {
  item: CountdownItem
  resolvedSolarISO: string
  daysRemaining: number
  isPast: boolean
}

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function diffDaysISO(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number)
  const [ty, tm, td] = toISO.split('-').map(Number)
  const fromUtc = Date.UTC(fy, fm - 1, fd)
  const toUtc = Date.UTC(ty, tm - 1, td)
  return Math.round((toUtc - fromUtc) / 86_400_000)
}

/**
 * Resolves exact days remaining for both Solar and Lunar countdowns.
 * For Lunar countdowns (annual recurring traditional/family dates), automatically
 * finds the next upcoming Lunar occurrence on or after `todayISO`.
 */
export function resolveCountdown(item: CountdownItem, todayISO: string): ResolvedCountdown {
  if (item.is_lunar && item.lunar_day && item.lunar_month) {
    const todayLunar = getLunarInfoFromISO(todayISO)
    let candidate = convertLunarToSolar(item.lunar_day, item.lunar_month, todayLunar.year, false)
    let resolvedISO = candidate
      ? toISODate(candidate.year, candidate.month, candidate.day)
      : item.target_date

    if (resolvedISO < todayISO) {
      candidate = convertLunarToSolar(item.lunar_day, item.lunar_month, todayLunar.year + 1, false)
      if (candidate) {
        resolvedISO = toISODate(candidate.year, candidate.month, candidate.day)
      }
    }

    const daysRemaining = diffDaysISO(todayISO, resolvedISO)
    return {
      item,
      resolvedSolarISO: resolvedISO,
      daysRemaining,
      isPast: daysRemaining < 0
    }
  }

  const daysRemaining = diffDaysISO(todayISO, item.target_date)
  return {
    item,
    resolvedSolarISO: item.target_date,
    daysRemaining,
    isPast: daysRemaining < 0
  }
}
