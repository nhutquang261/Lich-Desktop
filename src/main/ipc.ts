import { ipcMain } from 'electron'
import type {
  AppSettings,
  ReminderPayload,
  WidgetActionPayload,
  WidgetSnapshot
} from '@shared/types'
import { desktopStore } from './store'
import { showInstantNotification, showTestNotification, syncReminders } from './notifications'
import { refreshTrayMenu } from './tray'
import { createMainWindow, getMainWindow } from './windows/mainWindow'
import {
  getWidgetWindow,
  setWidgetAlwaysOnTop,
  setWidgetOpacity,
  setWidgetVisible
} from './windows/widgetWindow'

let latestWidgetSnapshot: WidgetSnapshot | null = null

function broadcastSettings(settings: AppSettings): void {
  const main = getMainWindow()
  if (main) {
    main.webContents.send('settings:changed', settings)
  }
  const widget = getWidgetWindow()
  if (widget) {
    widget.webContents.send('settings:changed', settings)
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('settings:get', () => desktopStore.getSettings())

  ipcMain.handle('settings:update', (_event, patch: Partial<AppSettings>) => {
    const updated = desktopStore.updateSettings(patch)
    if (typeof patch.widgetAlwaysOnTop === 'boolean') {
      setWidgetAlwaysOnTop(patch.widgetAlwaysOnTop)
    }
    if (typeof patch.widgetOpacity === 'number') {
      setWidgetOpacity(patch.widgetOpacity)
    }
    if (typeof patch.widgetVisible === 'boolean') {
      setWidgetVisible(patch.widgetVisible)
    }
    broadcastSettings(updated)
    refreshTrayMenu()
    return updated
  })

  ipcMain.handle('widget:toggle', (_event, forceVisible?: boolean) => {
    const currentOpen = Boolean(getWidgetWindow())
    const next = typeof forceVisible === 'boolean' ? forceVisible : !currentOpen
    const visible = setWidgetVisible(next)
    const updated = desktopStore.getSettings()
    broadcastSettings(updated)
    refreshTrayMenu()
    return visible
  })

  ipcMain.handle('widget:setAlwaysOnTop', (_event, value: boolean) => {
    const next = setWidgetAlwaysOnTop(value)
    const updated = desktopStore.getSettings()
    broadcastSettings(updated)
    refreshTrayMenu()
    return next
  })

  ipcMain.handle('widget:setOpacity', (_event, value: number) => {
    const next = setWidgetOpacity(value)
    const updated = desktopStore.getSettings()
    broadcastSettings(updated)
    return next
  })

  ipcMain.handle('widget:pushSnapshot', (_event, snapshot: WidgetSnapshot) => {
    latestWidgetSnapshot = snapshot
    const widget = getWidgetWindow()
    if (widget) {
      widget.webContents.send('widget:snapshot', snapshot)
    }
    return true
  })

  ipcMain.handle('widget:getSnapshot', () => latestWidgetSnapshot)

  ipcMain.handle('widget:action', (_event, action: WidgetActionPayload) => {
    if (action.type === 'open-main') {
      const main = createMainWindow()
      if (action.dateISO) {
        main.webContents.send('widget:action', action)
      }
      return true
    }
    const main = getMainWindow()
    if (main) {
      main.webContents.send('widget:action', action)
      return true
    }
    return false
  })

  ipcMain.handle('reminders:sync', (_event, reminders: ReminderPayload[]) => {
    return syncReminders(reminders)
  })

  ipcMain.handle('reminders:test', () => showTestNotification())

  ipcMain.handle('reminders:notifyNow', (_event, title: string, body: string) =>
    showInstantNotification(title, body)
  )

  ipcMain.handle('app:openMain', () => {
    createMainWindow()
    return true
  })
}
