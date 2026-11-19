import type {
  AppSettings,
  ReminderPayload,
  WidgetActionPayload,
  WidgetSnapshot
} from '@shared/types'

export interface LichDesktopAPI {
  getSettings: () => Promise<AppSettings>
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void

  toggleWidget: (forceVisible?: boolean) => Promise<boolean>
  setWidgetAlwaysOnTop: (value: boolean) => Promise<boolean>
  setWidgetOpacity: (value: number) => Promise<number>
  pushWidgetSnapshot: (snapshot: WidgetSnapshot) => Promise<boolean>
  getWidgetSnapshot: () => Promise<WidgetSnapshot | null>
  onWidgetSnapshot: (callback: (snapshot: WidgetSnapshot) => void) => () => void

  sendWidgetAction: (action: WidgetActionPayload) => Promise<boolean>
  onWidgetAction: (callback: (action: WidgetActionPayload) => void) => () => void

  syncReminders: (reminders: ReminderPayload[]) => Promise<number>
  testNotification: () => Promise<boolean>
  notifyNow: (title: string, body: string) => Promise<boolean>
  openMainWindow: () => Promise<boolean>
}

declare global {
  interface Window {
    lichAPI?: LichDesktopAPI
  }
}

export {}
