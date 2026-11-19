import Dexie, { type EntityTable } from 'dexie'
import type {
  CalendarEvent,
  CountdownItem,
  DailyNote,
  FinanceTransaction,
  GoalItem,
  HabitItem,
  HabitLog,
  TaskItem
} from '@shared/types'

export class LichDesktopDatabase extends Dexie {
  calendar_events!: EntityTable<CalendarEvent, 'id'>
  tasks!: EntityTable<TaskItem, 'id'>
  habits!: EntityTable<HabitItem, 'id'>
  habit_logs!: EntityTable<HabitLog, 'id'>
  daily_notes!: EntityTable<DailyNote, 'id'>
  finance_transactions!: EntityTable<FinanceTransaction, 'id'>
  goals!: EntityTable<GoalItem, 'id'>
  countdowns!: EntityTable<CountdownItem, 'id'>

  constructor() {
    super('LichDesktopDB')

    this.version(1).stores({
      calendar_events: 'id, start_date, end_date, category, recurrence, updated_at, sync_status',
      tasks: 'id, due_date, completed, priority, updated_at, sync_status',
      habits: 'id, archived, updated_at, sync_status',
      habit_logs: 'id, habit_id, log_date, [habit_id+log_date], updated_at, sync_status',
      daily_notes: 'id, note_date, mood, updated_at, sync_status',
      finance_transactions: 'id, tx_date, kind, category, updated_at, sync_status',
      goals: 'id, status, target_date, updated_at, sync_status',
      countdowns: 'id, target_date, pinned, updated_at, sync_status'
    })
  }
}

export const db = new LichDesktopDatabase()
