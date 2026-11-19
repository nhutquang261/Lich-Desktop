import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  ReminderPayload,
  WidgetActionPayload,
  WidgetSnapshot
} from '@shared/types'
import type { LichDesktopAPI } from './index.d'

const lichAPI: LichDesktopAPI = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  updateSettings: (patch: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:update', patch),
  onSettingsChanged: (callback: (settings: AppSettings) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings): void => {
      callback(settings)
    }
    ipcRenderer.on('settings:changed', listener)
    return () => ipcRenderer.removeListener('settings:changed', listener)
  },

  toggleWidget: (forceVisible?: boolean): Promise<boolean> =>
    ipcRenderer.invoke('widget:toggle', forceVisible),
  setWidgetAlwaysOnTop: (value: boolean): Promise<boolean> =>
    ipcRenderer.invoke('widget:setAlwaysOnTop', value),
  setWidgetOpacity: (value: number): Promise<number> =>
    ipcRenderer.invoke('widget:setOpacity', value),
  pushWidgetSnapshot: (snapshot: WidgetSnapshot): Promise<boolean> =>
    ipcRenderer.invoke('widget:pushSnapshot', snapshot),
  getWidgetSnapshot: (): Promise<WidgetSnapshot | null> =>
    ipcRenderer.invoke('widget:getSnapshot'),
  onWidgetSnapshot: (callback: (snapshot: WidgetSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: WidgetSnapshot): void => {
      callback(snapshot)
    }
    ipcRenderer.on('widget:snapshot', listener)
    return () => ipcRenderer.removeListener('widget:snapshot', listener)
  },

  sendWidgetAction: (action: WidgetActionPayload): Promise<boolean> =>
    ipcRenderer.invoke('widget:action', action),
  onWidgetAction: (callback: (action: WidgetActionPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: WidgetActionPayload): void => {
      callback(action)
    }
    ipcRenderer.on('widget:action', listener)
    return () => ipcRenderer.removeListener('widget:action', listener)
  },

  syncReminders: (reminders: ReminderPayload[]): Promise<number> =>
    ipcRenderer.invoke('reminders:sync', reminders),
  testNotification: (): Promise<boolean> => ipcRenderer.invoke('reminders:test'),
  notifyNow: (title: string, body: string): Promise<boolean> =>
    ipcRenderer.invoke('reminders:notifyNow', title, body),
  openMainWindow: (): Promise<boolean> => ipcRenderer.invoke('app:openMain')
}

contextBridge.exposeInMainWorld('lichAPI', lichAPI)
