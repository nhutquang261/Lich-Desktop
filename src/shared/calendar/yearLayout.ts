export interface YearMonthKey {
  key: string // YYYY-MM
  year: number
  month: number // 1..12
}

export const VIETNAMESE_MONTH_NAMES = [
  'THÁNG MỘT',
  'THÁNG HAI',
  'THÁNG BA',
  'THÁNG BỐN',
  'THÁNG NĂM',
  'THÁNG SÁU',
  'THÁNG BẢY',
  'THÁNG TÁM',
  'THÁNG CHÍN',
  'THÁNG MƯỜI',
  'THÁNG MƯỜI MỘT',
  'THÁNG MƯỜI HAI'
] as const

export const ENGLISH_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const

export function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthKey(key: string): YearMonthKey | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return { key, year, month }
}

export function buildRolling12Months(startYear: number, startMonth: number): string[] {
  const result: string[] = []
  for (let i = 0; i < 12; i += 1) {
    const zeroBased = startMonth - 1 + i
    const year = startYear + Math.floor(zeroBased / 12)
    const month = (zeroBased % 12) + 1
    result.push(formatMonthKey(year, month))
  }
  return result
}

export function reorderMonthList(
  list: string[],
  fromIndex: number,
  toIndex: number
): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return [...list]
  }
  const next = [...list]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function normalizeYearMonthOrder(
  startYear: number,
  startMonth: number,
  customOrder: string[]
): string[] {
  const canonical = buildRolling12Months(startYear, startMonth)
  if (customOrder.length !== 12) return canonical
  const canonicalSet = new Set(canonical)
  const uniqueValid = customOrder.filter((k, idx) => canonicalSet.has(k) && customOrder.indexOf(k) === idx)
  if (uniqueValid.length !== 12) return canonical
  return uniqueValid
}

export function isCustomMonthOrder(
  startYear: number,
  startMonth: number,
  order: string[]
): boolean {
  const canonical = buildRolling12Months(startYear, startMonth)
  if (order.length !== canonical.length) return false
  return canonical.some((key, idx) => order[idx] !== key)
}
