import { formatISODate } from '@shared/calendar/recurrence'
import { convertLunarToSolar, getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import {
  backupFileSchema,
  countdownInputSchema,
  dailyNoteInputSchema,
  eventInputSchema,
  financeTransactionInputSchema,
  goalInputSchema,
  habitInputSchema,
  taskInputSchema,
  type CountdownInput,
  type DailyNoteInput,
  type EventInput,
  type FinanceTransactionInput,
  type GoalInput,
  type HabitInput,
  type TaskInput
} from '@shared/schemas'
import type {
  BackupDataPayload,
  CalendarEvent,
  CountdownItem,
  DailyNote,
  FinanceTransaction,
  GoalItem,
  HabitItem,
  HabitLog,
  TaskItem
} from '@shared/types'
import { db } from './dexieDb'

const SEED_FLAG_KEY = 'lich_desktop_seeded_v1'
const SEED_M2_FLAG_KEY = 'lich_desktop_seeded_m2_v1'
const SEED_M3_FLAG_KEY = 'lich_desktop_seeded_m3_v1'

function nowISO(): string {
  return new Date().toISOString()
}

export async function seedInitialDataIfNeeded(): Promise<void> {
  const todayISO = formatISODate(new Date())
  const todayLunar = getLunarInfoFromISO(todayISO)
  const timestamp = nowISO()

  if (typeof localStorage === 'undefined' || !localStorage.getItem(SEED_FLAG_KEY)) {
    const existingCount = await db.calendar_events.count()
    if (existingCount === 0) {
      const sampleEvents: CalendarEvent[] = [
        {
          id: crypto.randomUUID(),
          user_id: null,
          title: 'Lập kế hoạch tuần mới',
          description: 'Rà soát lịch họp, mục tiêu ưu tiên và thử tính năng Floating Widget.',
          start_date: todayISO,
          end_date: todayISO,
          start_time: '09:00',
          end_time: '10:00',
          all_day: false,
          category: 'work',
          color: '#334155',
          recurrence: 'none',
          lunar_day: null,
          lunar_month: null,
          reminder_minutes: 15,
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
          sync_status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          user_id: null,
          title: 'Thắp hương ngày Rằm hàng tháng',
          description: 'Sự kiện mẫu tự động lặp theo ngày 15 Âm lịch mỗi tháng.',
          start_date: todayISO,
          end_date: todayISO,
          start_time: '07:30',
          end_time: '08:00',
          all_day: false,
          category: 'family',
          color: '#D9381E',
          recurrence: 'lunar-monthly',
          lunar_day: 15,
          lunar_month: todayLunar.month,
          reminder_minutes: 60,
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
          sync_status: 'pending'
        }
      ]

      const sampleTasks: TaskItem[] = [
        {
          id: crypto.randomUUID(),
          user_id: null,
          title: 'Bật thử Floating Desktop Widget ở thanh bên trái',
          due_date: todayISO,
          completed: false,
          priority: 'high',
          notes: '',
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
          sync_status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          user_id: null,
          title: 'Tạo một sự kiện lặp theo ngày Âm lịch',
          due_date: todayISO,
          completed: false,
          priority: 'medium',
          notes: '',
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
          sync_status: 'pending'
        }
      ]

      await db.calendar_events.bulkAdd(sampleEvents)
      await db.tasks.bulkAdd(sampleTasks)
    }
    localStorage?.setItem(SEED_FLAG_KEY, '1')
  }

  if (typeof localStorage === 'undefined' || !localStorage.getItem(SEED_M2_FLAG_KEY)) {
    const habitCount = await db.habits.count()
    if (habitCount === 0) {
      await db.habits.bulkAdd([
        {
          id: crypto.randomUUID(),
          user_id: null,
          name: 'Đọc sách 20 phút',
          color: '#0D7A5F',
          target_days_per_week: 6,
          archived: false,
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
          sync_status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          user_id: null,
          name: 'Tập thể dục buổi sáng',
          color: '#D9381E',
          target_days_per_week: 5,
          archived: false,
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null,
          sync_status: 'pending'
        }
      ])
    }
    localStorage?.setItem(SEED_M2_FLAG_KEY, '1')
  }

  if (typeof localStorage === 'undefined' || !localStorage.getItem(SEED_M3_FLAG_KEY)) {
    const countdownCount = await db.countdowns.count()
    if (countdownCount === 0) {
      const nextTetSolar = convertLunarToSolar(1, 1, todayLunar.year + 1, false)
      const tetISO = nextTetSolar
        ? `${nextTetSolar.year}-${String(nextTetSolar.month).padStart(2, '0')}-${String(nextTetSolar.day).padStart(2, '0')}`
        : `${Number(todayISO.slice(0, 4)) + 1}-02-01`
      await db.countdowns.add({
        id: crypto.randomUUID(),
        user_id: null,
        title: 'Tết Nguyên Đán',
        target_date: tetISO,
        is_lunar: true,
        lunar_day: 1,
        lunar_month: 1,
        color: '#D9381E',
        pinned: true,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        sync_status: 'pending'
      })
    }
    localStorage?.setItem(SEED_M3_FLAG_KEY, '1')
  }
}

// --- Calendar Events ---

export async function listActiveEvents(): Promise<CalendarEvent[]> {
  const rows = await db.calendar_events.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function createEvent(
  input: EventInput,
  userId: string | null = null
): Promise<CalendarEvent> {
  const parsed = eventInputSchema.parse(input)
  const timestamp = nowISO()
  const lunarAnchor = getLunarInfoFromISO(parsed.start_date)

  const record: CalendarEvent = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...parsed,
    lunar_day:
      parsed.recurrence === 'lunar-monthly' || parsed.recurrence === 'lunar-yearly'
        ? (parsed.lunar_day ?? lunarAnchor.day)
        : null,
    lunar_month:
      parsed.recurrence === 'lunar-yearly'
        ? (parsed.lunar_month ?? lunarAnchor.month)
        : null,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }

  await db.calendar_events.add(record)
  return record
}

export async function updateEvent(
  id: string,
  input: EventInput
): Promise<CalendarEvent | null> {
  const existing = await db.calendar_events.get(id)
  if (!existing) return null

  const parsed = eventInputSchema.parse(input)
  const lunarAnchor = getLunarInfoFromISO(parsed.start_date)
  const updated: CalendarEvent = {
    ...existing,
    ...parsed,
    lunar_day:
      parsed.recurrence === 'lunar-monthly' || parsed.recurrence === 'lunar-yearly'
        ? (parsed.lunar_day ?? lunarAnchor.day)
        : null,
    lunar_month:
      parsed.recurrence === 'lunar-yearly'
        ? (parsed.lunar_month ?? lunarAnchor.month)
        : null,
    updated_at: nowISO(),
    sync_status: 'pending'
  }

  await db.calendar_events.put(updated)
  return updated
}

export async function softDeleteEvent(id: string): Promise<void> {
  const existing = await db.calendar_events.get(id)
  if (!existing) return
  const timestamp = nowISO()
  await db.calendar_events.put({
    ...existing,
    deleted_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending'
  })
}

// --- Tasks ---

export async function listActiveTasks(): Promise<TaskItem[]> {
  const rows = await db.tasks.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function createTask(
  input: TaskInput,
  userId: string | null = null
): Promise<TaskItem> {
  const parsed = taskInputSchema.parse(input)
  const timestamp = nowISO()
  const record: TaskItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...parsed,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.tasks.add(record)
  return record
}

export async function updateTask(id: string, input: TaskInput): Promise<TaskItem | null> {
  const existing = await db.tasks.get(id)
  if (!existing) return null
  const parsed = taskInputSchema.parse(input)
  const updated: TaskItem = {
    ...existing,
    ...parsed,
    updated_at: nowISO(),
    sync_status: 'pending'
  }
  await db.tasks.put(updated)
  return updated
}

export async function toggleTaskCompleted(id: string): Promise<TaskItem | null> {
  const existing = await db.tasks.get(id)
  if (!existing) return null
  const updated: TaskItem = {
    ...existing,
    completed: !existing.completed,
    updated_at: nowISO(),
    sync_status: 'pending'
  }
  await db.tasks.put(updated)
  return updated
}

export async function softDeleteTask(id: string): Promise<void> {
  const existing = await db.tasks.get(id)
  if (!existing) return
  const timestamp = nowISO()
  await db.tasks.put({
    ...existing,
    deleted_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending'
  })
}

// --- Habits & Habit Logs ---

export async function listActiveHabits(): Promise<HabitItem[]> {
  const rows = await db.habits.toArray()
  return rows.filter((row) => !row.deleted_at && !row.archived)
}

export async function listActiveHabitLogs(): Promise<HabitLog[]> {
  const rows = await db.habit_logs.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function createHabit(
  input: HabitInput,
  userId: string | null = null
): Promise<HabitItem> {
  const parsed = habitInputSchema.parse(input)
  const timestamp = nowISO()
  const record: HabitItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...parsed,
    archived: false,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.habits.add(record)
  return record
}

export async function softDeleteHabit(id: string): Promise<void> {
  const existing = await db.habits.get(id)
  if (!existing) return
  const timestamp = nowISO()
  await db.habits.put({
    ...existing,
    deleted_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending'
  })
}

export async function toggleHabitLogForDate(
  habitId: string,
  logDate: string,
  userId: string | null = null
): Promise<HabitLog> {
  const existing = await db.habit_logs
    .where('[habit_id+log_date]')
    .equals([habitId, logDate])
    .first()

  const timestamp = nowISO()
  if (existing) {
    const updated: HabitLog = {
      ...existing,
      completed: existing.deleted_at ? true : !existing.completed,
      deleted_at: null,
      updated_at: timestamp,
      sync_status: 'pending'
    }
    await db.habit_logs.put(updated)
    return updated
  }

  const created: HabitLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    habit_id: habitId,
    log_date: logDate,
    completed: true,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.habit_logs.add(created)
  return created
}

// --- Daily Notes & Mood ---

export async function listActiveDailyNotes(): Promise<DailyNote[]> {
  const rows = await db.daily_notes.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function upsertDailyNote(
  input: DailyNoteInput,
  userId: string | null = null
): Promise<DailyNote> {
  const parsed = dailyNoteInputSchema.parse(input)
  const existing = (await db.daily_notes.where('note_date').equals(parsed.note_date).toArray()).find(
    (n) => !n.deleted_at
  )
  const timestamp = nowISO()

  if (existing) {
    const updated: DailyNote = {
      ...existing,
      content: parsed.content,
      mood: parsed.mood,
      updated_at: timestamp,
      sync_status: 'pending'
    }
    await db.daily_notes.put(updated)
    return updated
  }

  const created: DailyNote = {
    id: crypto.randomUUID(),
    user_id: userId,
    note_date: parsed.note_date,
    content: parsed.content,
    mood: parsed.mood,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.daily_notes.add(created)
  return created
}

// --- Personal Finance Transactions ---

export async function listActiveTransactions(): Promise<FinanceTransaction[]> {
  const rows = await db.finance_transactions.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function createTransaction(
  input: FinanceTransactionInput,
  userId: string | null = null
): Promise<FinanceTransaction> {
  const parsed = financeTransactionInputSchema.parse(input)
  const timestamp = nowISO()
  const record: FinanceTransaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...parsed,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.finance_transactions.add(record)
  return record
}

export async function softDeleteTransaction(id: string): Promise<void> {
  const existing = await db.finance_transactions.get(id)
  if (!existing) return
  const timestamp = nowISO()
  await db.finance_transactions.put({
    ...existing,
    deleted_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending'
  })
}

// --- Personal Goals ---

export async function listActiveGoals(): Promise<GoalItem[]> {
  const rows = await db.goals.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function createGoal(
  input: GoalInput,
  userId: string | null = null
): Promise<GoalItem> {
  const parsed = goalInputSchema.parse(input)
  const timestamp = nowISO()
  const record: GoalItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...parsed,
    status: parsed.progress >= 100 ? 'completed' : parsed.status,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.goals.add(record)
  return record
}

export async function updateGoalProgress(
  id: string,
  progress: number,
  status?: GoalItem['status']
): Promise<GoalItem | null> {
  const existing = await db.goals.get(id)
  if (!existing) return null
  const clamped = Math.max(0, Math.min(100, Math.round(progress)))
  const nextStatus: GoalItem['status'] =
    status ?? (clamped >= 100 ? 'completed' : existing.status === 'completed' ? 'active' : existing.status)
  const updated: GoalItem = {
    ...existing,
    progress: clamped,
    status: nextStatus,
    updated_at: nowISO(),
    sync_status: 'pending'
  }
  await db.goals.put(updated)
  return updated
}

export async function softDeleteGoal(id: string): Promise<void> {
  const existing = await db.goals.get(id)
  if (!existing) return
  const timestamp = nowISO()
  await db.goals.put({
    ...existing,
    deleted_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending'
  })
}

// --- Countdowns (Solar & Lunar) ---

export async function listActiveCountdowns(): Promise<CountdownItem[]> {
  const rows = await db.countdowns.toArray()
  return rows.filter((row) => !row.deleted_at)
}

export async function createCountdown(
  input: CountdownInput,
  userId: string | null = null
): Promise<CountdownItem> {
  const parsed = countdownInputSchema.parse(input)
  const timestamp = nowISO()
  const record: CountdownItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...parsed,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending'
  }
  await db.countdowns.add(record)
  return record
}

export async function toggleCountdownPinned(id: string): Promise<CountdownItem | null> {
  const existing = await db.countdowns.get(id)
  if (!existing) return null
  const updated: CountdownItem = {
    ...existing,
    pinned: !existing.pinned,
    updated_at: nowISO(),
    sync_status: 'pending'
  }
  await db.countdowns.put(updated)
  return updated
}

export async function softDeleteCountdown(id: string): Promise<void> {
  const existing = await db.countdowns.get(id)
  if (!existing) return
  const timestamp = nowISO()
  await db.countdowns.put({
    ...existing,
    deleted_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending'
  })
}

// --- Backup JSON Export & Import ---

export async function exportFullBackupPayload(): Promise<BackupDataPayload> {
  const [
    calendar_events,
    tasks,
    habits,
    habit_logs,
    daily_notes,
    finance_transactions,
    goals,
    countdowns
  ] = await Promise.all([
    db.calendar_events.toArray(),
    db.tasks.toArray(),
    db.habits.toArray(),
    db.habit_logs.toArray(),
    db.daily_notes.toArray(),
    db.finance_transactions.toArray(),
    db.goals.toArray(),
    db.countdowns.toArray()
  ])

  return {
    schemaVersion: 1,
    exportedAt: nowISO(),
    data: {
      calendar_events,
      tasks,
      habits,
      habit_logs,
      daily_notes,
      finance_transactions,
      goals,
      countdowns
    }
  }
}

export async function importFullBackupPayload(rawJson: string): Promise<number> {
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawJson)
  } catch {
    throw new Error('File JSON không hợp lệ hoặc bị hỏng cấu trúc.')
  }

  const checked = backupFileSchema.safeParse(parsedJson)
  if (!checked.success) {
    throw new Error('File sao lưu không khớp định dạng Lịch Desktop v1.')
  }

  const d = checked.data.data
  const markPending = <T extends Record<string, unknown>>(rows: T[]): T[] =>
    rows
      .filter((r) => typeof r.id === 'string' && r.id.length > 0)
      .map((r) => ({ ...r, sync_status: 'pending' }))

  await db.transaction(
    'rw',
    [
      db.calendar_events,
      db.tasks,
      db.habits,
      db.habit_logs,
      db.daily_notes,
      db.finance_transactions,
      db.goals,
      db.countdowns
    ],
    async () => {
      if (d.calendar_events.length) {
        await db.calendar_events.bulkPut(markPending(d.calendar_events) as unknown as CalendarEvent[])
      }
      if (d.tasks.length) {
        await db.tasks.bulkPut(markPending(d.tasks) as unknown as TaskItem[])
      }
      if (d.habits.length) {
        await db.habits.bulkPut(markPending(d.habits) as unknown as HabitItem[])
      }
      if (d.habit_logs.length) {
        await db.habit_logs.bulkPut(markPending(d.habit_logs) as unknown as HabitLog[])
      }
      if (d.daily_notes.length) {
        await db.daily_notes.bulkPut(markPending(d.daily_notes) as unknown as DailyNote[])
      }
      if (d.finance_transactions.length) {
        await db.finance_transactions.bulkPut(
          markPending(d.finance_transactions) as unknown as FinanceTransaction[]
        )
      }
      if (d.goals.length) {
        await db.goals.bulkPut(markPending(d.goals) as unknown as GoalItem[])
      }
      if (d.countdowns.length) {
        await db.countdowns.bulkPut(markPending(d.countdowns) as unknown as CountdownItem[])
      }
    }
  )

  return (
    d.calendar_events.length +
    d.tasks.length +
    d.habits.length +
    d.habit_logs.length +
    d.daily_notes.length +
    d.finance_transactions.length +
    d.goals.length +
    d.countdowns.length
  )
}

export async function countPendingSyncRecords(): Promise<number> {
  const counts = await Promise.all([
    db.calendar_events.where('sync_status').equals('pending').count(),
    db.tasks.where('sync_status').equals('pending').count(),
    db.habits.where('sync_status').equals('pending').count(),
    db.habit_logs.where('sync_status').equals('pending').count(),
    db.daily_notes.where('sync_status').equals('pending').count(),
    db.finance_transactions.where('sync_status').equals('pending').count(),
    db.goals.where('sync_status').equals('pending').count(),
    db.countdowns.where('sync_status').equals('pending').count()
  ])
  return counts.reduce((sum, n) => sum + n, 0)
}
