import { addDaysISO } from '@shared/calendar/recurrence'
import type { HabitLog } from '@shared/types'

export interface HabitStreakStats {
  currentStreak: number
  bestStreak: number
  completedLast7Days: number
  totalCompleted: number
}

export function computeHabitStats(
  logs: HabitLog[],
  todayISO: string
): HabitStreakStats {
  const completedDates = new Set(
    logs.filter((l) => !l.deleted_at && l.completed).map((l) => l.log_date)
  )

  if (completedDates.size === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      completedLast7Days: 0,
      totalCompleted: 0
    }
  }

  // Current streak: start from today if completed, otherwise allow yesterday so streak isn't prematurely broken mid-day
  let currentStreak = 0
  let cursor = completedDates.has(todayISO) ? todayISO : addDaysISO(todayISO, -1)
  while (completedDates.has(cursor)) {
    currentStreak += 1
    cursor = addDaysISO(cursor, -1)
  }

  // Best streak across sorted dates
  const sorted = Array.from(completedDates).sort()
  let bestStreak = 1
  let run = 1
  for (let i = 1; i < sorted.length; i += 1) {
    if (addDaysISO(sorted[i - 1], 1) === sorted[i]) {
      run += 1
      if (run > bestStreak) bestStreak = run
    } else {
      run = 1
    }
  }

  // Last 7 days count (inclusive of today)
  let completedLast7Days = 0
  for (let i = 0; i < 7; i += 1) {
    if (completedDates.has(addDaysISO(todayISO, -i))) {
      completedLast7Days += 1
    }
  }

  return {
    currentStreak,
    bestStreak,
    completedLast7Days,
    totalCompleted: completedDates.size
  }
}
