import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { getDefaultEnabledModules } from '@shared/modules'
import { appSettingsSchema } from '@shared/schemas'
import type { AppSettings, WindowBounds } from '@shared/types'

interface PersistedConfig {
  settings: AppSettings
  mainBounds: WindowBounds
  widgetBounds: WindowBounds
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  themePreset: 'vermilion-light',
  fontSizeScale: 'medium',
  buttonRadiusStyle: 'rounded',
  customAccent: null,
  enabledModules: getDefaultEnabledModules(),
  showLunarInGrid: true,
  yearLayout: {
    startYear: new Date().getFullYear(),
    startMonth: 1,
    customOrder: [],
    columns: 4
  },
  widgetVisible: false,
  widgetAlwaysOnTop: true,
  widgetOpacity: 0.96,
  supabaseUrl: '',
  supabaseAnonKey: ''
}

const DEFAULT_CONFIG: PersistedConfig = {
  settings: DEFAULT_SETTINGS,
  mainBounds: { width: 1280, height: 820 },
  widgetBounds: { width: 340, height: 460 }
}

class DesktopConfigStore {
  private cache: PersistedConfig | null = null

  private get filePath(): string {
    return join(app.getPath('userData'), 'lich-desktop-config.json')
  }

  private load(): PersistedConfig {
    if (this.cache) return this.cache
    try {
      if (existsSync(this.filePath)) {
        const raw = JSON.parse(readFileSync(this.filePath, 'utf-8')) as Partial<PersistedConfig>
        const parsedSettings = appSettingsSchema.safeParse({
          ...DEFAULT_SETTINGS,
          ...(raw.settings ?? {}),
          enabledModules: {
            ...getDefaultEnabledModules(),
            ...(raw.settings?.enabledModules ?? {}),
            calendar: true
          }
        })
        this.cache = {
          settings: parsedSettings.success ? parsedSettings.data : DEFAULT_SETTINGS,
          mainBounds: { ...DEFAULT_CONFIG.mainBounds, ...(raw.mainBounds ?? {}) },
          widgetBounds: { ...DEFAULT_CONFIG.widgetBounds, ...(raw.widgetBounds ?? {}) }
        }
        return this.cache
      }
    } catch {
      // Fallback safely to defaults if config file is corrupted
    }
    this.cache = structuredClone(DEFAULT_CONFIG)
    return this.cache
  }

  private save(): void {
    const data = this.load()
    const dir = dirname(this.filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  getSettings(): AppSettings {
    return structuredClone(this.load().settings)
  }

  updateSettings(patch: Partial<AppSettings>): AppSettings {
    const current = this.load()
    const merged: AppSettings = {
      ...current.settings,
      ...patch,
      enabledModules: {
        ...current.settings.enabledModules,
        ...(patch.enabledModules ?? {}),
        calendar: true
      }
    }
    const parsed = appSettingsSchema.safeParse(merged)
    if (parsed.success) {
      current.settings = parsed.data
      this.save()
    }
    return structuredClone(current.settings)
  }

  getMainBounds(): WindowBounds {
    return structuredClone(this.load().mainBounds)
  }

  setMainBounds(bounds: WindowBounds): void {
    this.load().mainBounds = bounds
    this.save()
  }

  getWidgetBounds(): WindowBounds {
    return structuredClone(this.load().widgetBounds)
  }

  setWidgetBounds(bounds: WindowBounds): void {
    this.load().widgetBounds = bounds
    this.save()
  }
}

export const desktopStore = new DesktopConfigStore()
