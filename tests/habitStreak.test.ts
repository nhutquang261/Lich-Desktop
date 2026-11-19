import { describe, expect, it } from 'vitest'
import { computeHabitStats } from '@shared/habits/streak'
import type { HabitLog } from '@shared/types'

function makeLog(date: string, completed = true, deleted = false): HabitLog {
  return {
    id: `log-${date}`,
    user_id: null,
    habit_id: 'habit-1',
    log_date: date,
    completed,
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    deleted_at: deleted ? '2026-11-02T00:00:00.000Z' : null,
    sync_status: 'pending'
  }
}

describe('Habit Streak Calculator', () => {
  it('returns zeroes when there are no completed logs', () => {
    expect(computeHabitStats([], '2026-11-19')).toEqual({
      currentStreak: 0,
      bestStreak: 0,
      completedLast7Days: 0,
      totalCompleted: 0
    })
  })

  it('computes active streak ending today and tracks best historical streak', () => {
    const logs = [
      // Historical 4-day streak
      makeLog('2026-11-01'),
      makeLog('2026-11-02'),
      makeLog('2026-11-03'),
      makeLog('2026-11-04'),
      // Active 3-day streak ending today (Nov 19)
      makeLog('2026-11-17'),
      makeLog('2026-11-18'),
      makeLog('2026-11-19')
    ]
    const stats = computeHabitStats(logs, '2026-11-19')
    expect(stats.currentStreak).toBe(3)
    expect(stats.bestStreak).toBe(4)
    expect(stats.completedLast7Days).toBe(3)
    expect(stats.totalCompleted).toBe(7)
  })

  it('preserves streak through yesterday if today is not checked in yet', () => {
    const logs = [makeLog('2026-11-17'), makeLog('2026-11-18')]
    const stats = computeHabitStats(logs, '2026-11-19')
    expect(stats.currentStreak).toBe(2)
    expect(stats.completedLast7Days).toBe(2)
  })

  it('ignores incomplete and soft-deleted logs', () => {
    const logs = [
      makeLog('2026-11-18', false),
      makeLog('2026-11-19', true, true)
    ]
    const stats = computeHabitStats(logs, '2026-11-19')
    expect(stats.currentStreak).toBe(0)
    expect(stats.totalCompleted).toBe(0)
  })
})
