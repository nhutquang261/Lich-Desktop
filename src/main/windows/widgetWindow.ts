import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { desktopStore } from '../store'

let widgetWindow: BrowserWindow | null = null

export function getWidgetWindow(): BrowserWindow | null {
  return widgetWindow && !widgetWindow.isDestroyed() ? widgetWindow : null
}

export function createWidgetWindow(): BrowserWindow {
  const existing = getWidgetWindow()
  if (existing) {
    existing.show()
    return existing
  }

  const settings = desktopStore.getSettings()
  const saved = desktopStore.getWidgetBounds()
  const display = screen.getPrimaryDisplay().workArea

  const width = Math.max(300, Math.min(480, saved.width))
  const height = Math.max(340, Math.min(720, saved.height))
  const defaultX = display.x + display.width - width - 24
  const defaultY = display.y + 24

  const win = new BrowserWindow({
    width,
    height,
    x: saved.x ?? defaultX,
    y: saved.y ?? defaultY,
    minWidth: 300,
    minHeight: 340,
    maxWidth: 520,
    maxHeight: 760,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: settings.widgetAlwaysOnTop,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.setOpacity(settings.widgetOpacity)

  win.once('ready-to-show', () => {
    win.show()
  })

  const saveBounds = (): void => {
    if (!win.isDestroyed()) {
      desktopStore.setWidgetBounds(win.getBounds())
    }
  }
  win.on('moved', saveBounds)
  win.on('resized', saveBounds)
  win.on('closed', () => {
    widgetWindow = null
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/widget.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/widget.html'))
  }

  widgetWindow = win
  return win
}

export function setWidgetVisible(visible: boolean): boolean {
  if (visible) {
    createWidgetWindow()
    desktopStore.updateSettings({ widgetVisible: true })
    return true
  }
  const existing = getWidgetWindow()
  if (existing) {
    existing.close()
  }
  desktopStore.updateSettings({ widgetVisible: false })
  return false
}

export function setWidgetAlwaysOnTop(alwaysOnTop: boolean): boolean {
  const existing = getWidgetWindow()
  if (existing) {
    existing.setAlwaysOnTop(alwaysOnTop, 'floating')
  }
  desktopStore.updateSettings({ widgetAlwaysOnTop: alwaysOnTop })
  return alwaysOnTop
}

export function setWidgetOpacity(opacity: number): number {
  const clamped = Math.max(0.6, Math.min(1, Number(opacity.toFixed(2))))
  const existing = getWidgetWindow()
  if (existing) {
    existing.setOpacity(clamped)
  }
  desktopStore.updateSettings({ widgetOpacity: clamped })
  return clamped
}
