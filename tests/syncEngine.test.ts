import { describe, expect, it } from 'vitest'
import { mergeByLastWriteWins } from '@renderer/core/sync/syncEngine'
import type { TaskItem } from '@shared/types'

function makeTask(updatedAt: string, title: string): TaskItem {
  return {
    id: 'task-1',
    user_id: 'user-1',
    title,
    due_date: '2026-11-19',
    completed: false,
    priority: 'medium',
    notes: '',
    created_at: '2026-11-19T00:00:00.000Z',
    updated_at: updatedAt,
    deleted_at: null,
    sync_status: 'pending'
  }
}

describe('Cloud Sync Engine — Last-Write-Wins Merger', () => {
  it('accepts remote record when local record does not exist', () => {
    const remote = makeTask('2026-11-19T10:00:00.000Z', 'Remote Task')
    const { sync_status: _s, ...remoteRow } = remote
    const result = mergeByLastWriteWins<TaskItem>(undefined, remoteRow)
    expect(result.winner).toBe('remote')
    expect(result.record.sync_status).toBe('synced')
    expect(result.record.title).toBe('Remote Task')
  })

  it('picks remote when remote updated_at is newer than local', () => {
    const local = makeTask('2026-11-19T09:00:00.000Z', 'Old Local')
    const remote = makeTask('2026-11-19T11:00:00.000Z', 'New Remote')
    const { sync_status: _s, ...remoteRow } = remote
    const result = mergeByLastWriteWins(local, remoteRow)
    expect(result.winner).toBe('remote')
    expect(result.record.title).toBe('New Remote')
  })

  it('keeps local pending record when local updated_at is newer than remote', () => {
    const local = makeTask('2026-11-19T12:00:00.000Z', 'Newer Local')
    const remote = makeTask('2026-11-19T11:00:00.000Z', 'Older Remote')
    const { sync_status: _s, ...remoteRow } = remote
    const result = mergeByLastWriteWins(local, remoteRow)
    expect(result.winner).toBe('local')
    expect(result.record.title).toBe('Newer Local')
    expect(result.record.sync_status).toBe('pending')
  })
})
