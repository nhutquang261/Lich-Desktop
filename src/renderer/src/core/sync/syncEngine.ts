import type { SupabaseClient } from '@supabase/supabase-js'
import type { EntityTable } from 'dexie'
import type {
  CalendarEvent,
  CountdownItem,
  DailyNote,
  FinanceTransaction,
  GoalItem,
  HabitItem,
  HabitLog,
  SyncableRecord,
  TaskItem
} from '@shared/types'
import { db } from '../db/dexieDb'

export interface SyncResult {
  pushed: number
  pulled: number
  syncedAt: string
}

type SyncTableName =
  | 'calendar_events'
  | 'tasks'
  | 'habits'
  | 'habit_logs'
  | 'daily_notes'
  | 'finance_transactions'
  | 'goals'
  | 'countdowns'

/**
 * Last-Write-Wins deterministic conflict resolver.
 * Pure helper exported for unit testing.
 */
export function mergeByLastWriteWins<T extends SyncableRecord>(
  local: T | undefined,
  remote: Omit<T, 'sync_status'>
): { winner: 'local' | 'remote'; record: T } {
  const remoteNormalized: T = { ...remote, sync_status: 'synced' } as T
  if (!local) {
    return { winner: 'remote', record: remoteNormalized }
  }
  const localTs = Date.parse(local.updated_at)
  const remoteTs = Date.parse(remote.updated_at)
  if (remoteTs >= localTs) {
    return { winner: 'remote', record: remoteNormalized }
  }
  return { winner: 'local', record: local }
}

function stripSyncStatus<T extends SyncableRecord>(
  row: T,
  userId: string
): Record<string, unknown> {
  const { sync_status: _ignored, ...rest } = { ...row, user_id: userId }
  return rest as Record<string, unknown>
}

async function syncTable<T extends SyncableRecord>(
  client: SupabaseClient,
  tableName: SyncTableName,
  localTable: EntityTable<T, 'id'>,
  userId: string
): Promise<{ pushed: number; pulled: number }> {
  const pendingRows = (await localTable
    .where('sync_status')
    .equals('pending')
    .toArray()) as T[]

  let pushed = 0
  if (pendingRows.length > 0) {
    const upsertPayload = pendingRows.map((row) => stripSyncStatus(row, userId))
    const { error: pushError } = await client
      .from(tableName)
      .upsert(upsertPayload, { onConflict: 'id' })
    if (pushError) {
      throw new Error(`Không thể đẩy bảng ${tableName}: ${pushError.message}`)
    }
    for (const row of pendingRows) {
      const syncedRow: T = { ...row, user_id: userId, sync_status: 'synced' }
      await localTable.put(syncedRow as never)
    }
    pushed = pendingRows.length
  }

  const { data: remoteRows, error: pullError } = await client
    .from(tableName)
    .select('*')
    .eq('user_id', userId)

  if (pullError) {
    throw new Error(`Không thể tải bảng ${tableName}: ${pullError.message}`)
  }

  let pulled = 0
  if (remoteRows && remoteRows.length > 0) {
    for (const remote of remoteRows as Array<Omit<T, 'sync_status'>>) {
      const local = (await localTable.get(remote.id as never)) as T | undefined
      const { winner, record } = mergeByLastWriteWins(local, remote)
      if (winner === 'remote') {
        await localTable.put(record as never)
        pulled += 1
      }
    }
  }

  return { pushed, pulled }
}

export async function runCloudSync(client: SupabaseClient): Promise<SyncResult> {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    throw new Error('Bạn chưa đăng nhập tài khoản Cloud Sync.')
  }

  const userId = data.user.id
  const results = [
    await syncTable<CalendarEvent>(client, 'calendar_events', db.calendar_events, userId),
    await syncTable<TaskItem>(client, 'tasks', db.tasks, userId),
    await syncTable<HabitItem>(client, 'habits', db.habits, userId),
    await syncTable<HabitLog>(client, 'habit_logs', db.habit_logs, userId),
    await syncTable<DailyNote>(client, 'daily_notes', db.daily_notes, userId),
    await syncTable<FinanceTransaction>(
      client,
      'finance_transactions',
      db.finance_transactions,
      userId
    ),
    await syncTable<GoalItem>(client, 'goals', db.goals, userId),
    await syncTable<CountdownItem>(client, 'countdowns', db.countdowns, userId)
  ]

  return {
    pushed: results.reduce((sum, r) => sum + r.pushed, 0),
    pulled: results.reduce((sum, r) => sum + r.pulled, 0),
    syncedAt: new Date().toISOString()
  }
}
