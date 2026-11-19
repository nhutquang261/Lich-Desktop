import { Notification } from 'electron'
import type { ReminderPayload } from '@shared/types'
import { createMainWindow } from './windows/mainWindow'

const scheduledTimers = new Map<string, NodeJS.Timeout>()

export function clearAllReminders(): void {
  for (const timer of scheduledTimers.values()) {
    clearTimeout(timer)
  }
  scheduledTimers.clear()
}

export function syncReminders(reminders: ReminderPayload[]): number {
  clearAllReminders()
  if (!Notification.isSupported()) return 0

  const now = Date.now()
  const MAX_TIMEOUT = 2_147_483_647 // 32-bit signed max (~24.8 days)
  let count = 0

  for (const item of reminders) {
    const delay = item.fireAt - now
    if (delay <= 0 || delay > MAX_TIMEOUT) continue

    const timer = setTimeout(() => {
      scheduledTimers.delete(item.id)
      const notification = new Notification({
        title: item.title,
        body: item.body,
        silent: false
      })
      notification.on('click', () => {
        createMainWindow()
      })
      notification.show()
    }, delay)

    scheduledTimers.set(item.id, timer)
    count += 1
  }

  return count
}

export function showTestNotification(): boolean {
  return showInstantNotification(
    'Lịch Desktop — Kiểm tra nhắc nhở',
    'Hệ thống thông báo Windows đang hoạt động bình thường.'
  )
}

export function showInstantNotification(title: string, body: string): boolean {
  if (!Notification.isSupported()) return false
  const notification = new Notification({
    title,
    body,
    silent: false
  })
  notification.on('click', () => {
    createMainWindow()
  })
  notification.show()
  return true
}
