import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { desktopStore } from '../store'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

export function setAppQuitting(quitting: boolean): void {
  isQuitting = quitting
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

export function createMainWindow(): BrowserWindow {
  const existing = getMainWindow()
  if (existing) {
    if (existing.isMinimized()) existing.restore()
    existing.show()
    existing.focus()
    return existing
  }

  const savedBounds = desktopStore.getMainBounds()

  const win = new BrowserWindow({
    width: Math.max(960, savedBounds.width),
    height: Math.max(640, savedBounds.height),
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 960,
    minHeight: 640,
    title: 'Lịch Desktop',
    backgroundColor: '#F6F7F9',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  const saveBounds = (): void => {
    if (!win.isDestroyed() && !win.isMaximized() && !win.isMinimized()) {
      desktopStore.setMainBounds(win.getBounds())
    }
  }
  win.on('resized', saveBounds)
  win.on('moved', saveBounds)

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = win
  return win
}
