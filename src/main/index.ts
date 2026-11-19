import { app, BrowserWindow } from 'electron'
import { registerIpcHandlers } from './ipc'
import { clearAllReminders } from './notifications'
import { desktopStore } from './store'
import { initSystemTray } from './tray'
import { createMainWindow, setAppQuitting } from './windows/mainWindow'
import { createWidgetWindow } from './windows/widgetWindow'

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    createMainWindow()
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.lichdesktop.studio')
    registerIpcHandlers()
    initSystemTray()
    createMainWindow()

    const settings = desktopStore.getSettings()
    if (settings.widgetVisible) {
      createWidgetWindow()
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  })

  app.on('before-quit', () => {
    setAppQuitting(true)
    clearAllReminders()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
