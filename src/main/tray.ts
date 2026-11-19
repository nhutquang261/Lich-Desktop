import { app, Menu, nativeImage, Tray } from 'electron'
import { desktopStore } from './store'
import { createMainWindow, setAppQuitting } from './windows/mainWindow'
import {
  getWidgetWindow,
  setWidgetAlwaysOnTop,
  setWidgetVisible
} from './windows/widgetWindow'

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  // 16x16 crisp vermilion calendar icon encoded as SVG data URI
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect x="2" y="4" width="28" height="26" rx="4" fill="#111315"/>
      <rect x="2" y="4" width="28" height="9" rx="4" fill="#D9381E"/>
      <rect x="2" y="9" width="28" height="4" fill="#D9381E"/>
      <rect x="9" y="1" width="3" height="6" rx="1" fill="#F2F4F7"/>
      <rect x="20" y="1" width="3" height="6" rx="1" fill="#F2F4F7"/>
      <text x="16" y="25" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle">L</text>
    </svg>
  `.trim()
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  return nativeImage.createFromDataURL(dataUrl).resize({ width: 16, height: 16 })
}

export function refreshTrayMenu(): void {
  if (!tray) return
  const settings = desktopStore.getSettings()
  const isWidgetOpen = Boolean(getWidgetWindow())

  const menu = Menu.buildFromTemplate([
    {
      label: 'Mở Lịch Desktop',
      click: () => {
        createMainWindow()
      }
    },
    { type: 'separator' },
    {
      label: isWidgetOpen ? 'Ẩn Floating Widget' : 'Hiện Floating Widget',
      click: () => {
        setWidgetVisible(!isWidgetOpen)
        refreshTrayMenu()
      }
    },
    {
      label: 'Ghim Widget lên trên cùng',
      type: 'checkbox',
      checked: settings.widgetAlwaysOnTop,
      click: (item) => {
        setWidgetAlwaysOnTop(item.checked)
        refreshTrayMenu()
      }
    },
    { type: 'separator' },
    {
      label: 'Thoát hoàn toàn',
      click: () => {
        setAppQuitting(true)
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
}

export function initSystemTray(): Tray {
  if (tray) return tray
  tray = new Tray(createTrayIcon())
  tray.setToolTip('Lịch Desktop — Lịch Dương/Âm & Life-OS')
  tray.on('click', () => {
    createMainWindow()
  })
  refreshTrayMenu()
  return tray
}
