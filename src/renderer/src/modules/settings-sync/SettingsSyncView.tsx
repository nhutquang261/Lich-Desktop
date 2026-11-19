import { useRef, useState } from 'react'
import {
  ArrowCounterClockwise,
  ArrowsClockwise,
  BellRinging,
  Check,
  CloudCheck,
  DownloadSimple,
  Gear,
  PaintBrush,
  Palette,
  Pill,
  SignOut,
  SquaresFour,
  Sun,
  TextT,
  UploadSimple
} from '@phosphor-icons/react'
import { exportEventsToIcs, parseIcsEvents } from '@shared/calendar/icsCodec'
import { formatISODate } from '@shared/calendar/recurrence'
import { MODULE_REGISTRY } from '@shared/modules'
import {
  ACCENT_COLOR_SWATCHES,
  DEFAULT_THEME_PRESET,
  THEME_PRESETS,
  type ThemePresetId
} from '@shared/themes'
import type { ButtonRadiusStyle, FontSizeScale } from '@shared/types'
import {
  exportFullBackupPayload,
  importFullBackupPayload
} from '@renderer/core/db/repositories'
import { useAppStore } from '@renderer/core/store/useAppStore'

function triggerBrowserDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

type SettingsSubTab = 'appearance' | 'widget' | 'cloud' | 'backup' | 'modules'

const FONT_SIZE_OPTIONS: Array<{ id: FontSizeScale; label: string }> = [
  { id: 'small', label: 'Nhỏ' },
  { id: 'medium', label: 'Vừa' },
  { id: 'large', label: 'Lớn' },
  { id: 'xlarge', label: 'Rất lớn' }
]

const BUTTON_RADIUS_OPTIONS: Array<{ id: ButtonRadiusStyle; label: string }> = [
  { id: 'rounded', label: 'Bo vừa' },
  { id: 'pill', label: 'Viên thuốc' },
  { id: 'sharp', label: 'Góc vuông' }
]

// 8 primary theme presets matching the user's reference mockup
const FEATURED_PRESET_IDS: ThemePresetId[] = [
  'vermilion-light',
  'pure-light',
  'obsidian-dark',
  'midnight-dark',
  'aurora-night',
  'nordic-sea',
  'vintage-paper',
  'monochrome'
]

export function SettingsSyncView(): React.JSX.Element {
  const {
    settings,
    events,
    syncState,
    updateSettings,
    toggleModule,
    toggleWidget,
    addEvent,
    refreshLocalData,
    signInCloud,
    signUpCloud,
    signOutCloud,
    syncCloudNow
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<SettingsSubTab>('appearance')
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl)
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authFeedback, setAuthFeedback] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null)
  const [appearanceFeedback, setAppearanceFeedback] = useState<string | null>(null)

  const jsonInputRef = useRef<HTMLInputElement>(null)
  const icsInputRef = useRef<HTMLInputElement>(null)

  const handleResetAppearance = async (): Promise<void> => {
    await updateSettings({
      fontSizeScale: 'medium',
      buttonRadiusStyle: 'rounded',
      themePreset: DEFAULT_THEME_PRESET,
      customAccent: null
    })
    setAppearanceFeedback('Đã khôi phục giao diện mặc định.')
    setTimeout(() => setAppearanceFeedback(null), 3000)
  }

  const handleSaveSupabaseConfig = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    await updateSettings({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim()
    })
    setAuthFeedback('Đã lưu cấu hình kết nối Supabase.')
  }

  const handleAuth = async (mode: 'signin' | 'signup'): Promise<void> => {
    setAuthFeedback(null)
    setAuthBusy(true)
    try {
      if (mode === 'signin') {
        await signInCloud(email.trim(), password)
        setAuthFeedback('Đăng nhập và đồng bộ thành công.')
      } else {
        await signUpCloud(email.trim(), password)
        setAuthFeedback('Đã gửi yêu cầu tạo tài khoản.')
      }
      setPassword('')
    } catch (err) {
      setAuthFeedback(err instanceof Error ? err.message : 'Thao tác thất bại')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleExportJson = async (): Promise<void> => {
    const payload = await exportFullBackupPayload()
    const stamp = formatISODate(new Date())
    triggerBrowserDownload(
      `lich-desktop-backup-${stamp}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    )
    setBackupFeedback(`Đã xuất bản sao lưu JSON toàn bộ 8 bảng dữ liệu (${stamp}).`)
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const count = await importFullBackupPayload(text)
      await refreshLocalData()
      setBackupFeedback(`Đã khôi phục thành công ${count} bản ghi từ file JSON.`)
    } catch (err) {
      setBackupFeedback(err instanceof Error ? err.message : 'Không thể nhập file JSON.')
    }
  }

  const handleExportIcs = (): void => {
    const ics = exportEventsToIcs(events)
    const stamp = formatISODate(new Date())
    triggerBrowserDownload(`lich-desktop-${stamp}.ics`, ics, 'text/calendar;charset=utf-8')
    setBackupFeedback(`Đã xuất ${events.length} sự kiện sang định dạng .ics.`)
  }

  const handleImportIcs = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseIcsEvents(text)
      if (parsed.length === 0) {
        setBackupFeedback('Không tìm thấy sự kiện hợp lệ (VEVENT) nào trong file .ics.')
        return
      }
      for (const evInput of parsed) {
        await addEvent(evInput)
      }
      setBackupFeedback(`Đã nhập thành công ${parsed.length} sự kiện từ file .ics.`)
    } catch (err) {
      setBackupFeedback(err instanceof Error ? err.message : 'Không thể nhập file .ics.')
    }
  }

  const featuredPresets = THEME_PRESETS.filter((p) => FEATURED_PRESET_IDS.includes(p.id))

  return (
    <div className="flex h-full w-full overflow-hidden bg-paper-subtle text-ink dark:bg-obsidian dark:text-obsidian-ink">
      {/* Sub-Navigation Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
        <div className="mb-4 flex items-center gap-2 px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-vermilion/10 text-vermilion">
            <Gear size={17} weight="bold" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-ink dark:text-obsidian-ink">
            Cài đặt
          </span>
        </div>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'bg-vermilion-soft font-semibold text-vermilion dark:bg-vermilion/15'
                : 'text-ink-muted hover:bg-paper-subtle hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian-elevated dark:hover:text-obsidian-ink'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Palette size={16} weight={activeTab === 'appearance' ? 'fill' : 'regular'} />
              <span>Tùy chỉnh giao diện</span>
            </div>
            <span className="text-[11px] opacity-60">›</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('widget')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
              activeTab === 'widget'
                ? 'bg-vermilion-soft font-semibold text-vermilion dark:bg-vermilion/15'
                : 'text-ink-muted hover:bg-paper-subtle hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian-elevated dark:hover:text-obsidian-ink'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BellRinging size={16} weight={activeTab === 'widget' ? 'fill' : 'regular'} />
              <span>Desktop Widget</span>
            </div>
            <span className="text-[11px] opacity-60">›</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
              activeTab === 'cloud'
                ? 'bg-vermilion-soft font-semibold text-vermilion dark:bg-vermilion/15'
                : 'text-ink-muted hover:bg-paper-subtle hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian-elevated dark:hover:text-obsidian-ink'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CloudCheck size={16} weight={activeTab === 'cloud' ? 'fill' : 'regular'} />
              <span>Đồng bộ Cloud</span>
            </div>
            <span className="text-[11px] opacity-60">›</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
              activeTab === 'backup'
                ? 'bg-vermilion-soft font-semibold text-vermilion dark:bg-vermilion/15'
                : 'text-ink-muted hover:bg-paper-subtle hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian-elevated dark:hover:text-obsidian-ink'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DownloadSimple size={16} weight={activeTab === 'backup' ? 'fill' : 'regular'} />
              <span>Sao lưu & Trao đổi</span>
            </div>
            <span className="text-[11px] opacity-60">›</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
              activeTab === 'modules'
                ? 'bg-vermilion-soft font-semibold text-vermilion dark:bg-vermilion/15'
                : 'text-ink-muted hover:bg-paper-subtle hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian-elevated dark:hover:text-obsidian-ink'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <SquaresFour size={16} weight={activeTab === 'modules' ? 'fill' : 'regular'} />
              <span>Quản lý Module</span>
            </div>
            <span className="text-[11px] opacity-60">›</span>
          </button>
        </nav>
      </aside>

      {/* Main Settings Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* TAB 1: TÙY CHỈNH GIAO DIỆN (Matching reference mockup) */}
          {activeTab === 'appearance' && (
            <div className="rounded-2xl border border-hairline bg-paper p-6 shadow-xs dark:border-obsidian-border dark:bg-obsidian-surface">
              <div className="flex items-start justify-between border-b border-hairline pb-4 dark:border-obsidian-border">
                <div>
                  <h2 className="text-[17px] font-bold text-ink dark:text-obsidian-ink">
                    Tùy chỉnh giao diện
                  </h2>
                  <p className="mt-1 text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                    Tùy biến kích cỡ chữ, màu sắc thương hiệu, chủ đề thị giác và kiểu nút bấm. Mọi
                    thay đổi tự động lưu tức thì cho cả Lịch Desktop & Floating Widget.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {appearanceFeedback && (
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-jade">
                      <Check size={13} weight="bold" />
                      <span>{appearanceFeedback}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleResetAppearance()}
                    title="Khôi phục toàn bộ giao diện về trạng thái chuẩn ban đầu"
                    className="btn-radius flex items-center gap-1.5 border border-hairline bg-paper-subtle px-3 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:border-vermilion hover:text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted dark:hover:text-obsidian-ink"
                  >
                    <ArrowCounterClockwise size={13} weight="bold" />
                    <span>Đặt lại mặc định</span>
                  </button>
                </div>
              </div>

              {/* 1. CỠ CHỮ */}
              <div className="mt-6">
                <div className="mb-2.5 flex items-center gap-2">
                  <TextT size={16} weight="bold" className="text-ink dark:text-obsidian-ink" />
                  <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                    Cỡ chữ
                  </span>
                </div>
                <div className="grid grid-cols-4 items-center gap-1 rounded-xl border border-hairline bg-paper-subtle p-1 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  {FONT_SIZE_OPTIONS.map((opt) => {
                    const active = (settings.fontSizeScale ?? 'medium') === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => void updateSettings({ fontSizeScale: opt.id })}
                        className={`btn-radius py-2 text-center text-[13px] transition-all ${
                          active
                            ? 'bg-vermilion font-bold text-white shadow-xs'
                            : 'text-ink-muted hover:bg-paper hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. MÀU CHỦ ĐẠO */}
              <div className="mt-6">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PaintBrush
                      size={16}
                      weight="bold"
                      className="text-ink dark:text-obsidian-ink"
                    />
                    <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                      Màu chủ đạo
                    </span>
                  </div>
                  {settings.customAccent && (
                    <button
                      type="button"
                      onClick={() => void updateSettings({ customAccent: null })}
                      className="text-[11.5px] font-medium text-vermilion hover:underline"
                    >
                      Dùng màu gốc theo Theme
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {ACCENT_COLOR_SWATCHES.map((swatch) => {
                    const isSelected =
                      settings.customAccent?.toLowerCase() === swatch.hex.toLowerCase()
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        title={swatch.name}
                        onClick={() => void updateSettings({ customAccent: swatch.hex })}
                        className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
                          isSelected ? 'ring-2 ring-vermilion ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-white shadow-xs" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. GIAO DIỆN (8 PRESET CARDS WITH MOCKUP VIEW) */}
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun size={16} weight="bold" className="text-ink dark:text-obsidian-ink" />
                    <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                      Giao diện
                    </span>
                  </div>
                  <span className="text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                    8 bản phối kiến trúc tuyển chọn
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                  {featuredPresets.map((preset) => {
                    const isSelected = settings.themePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => void updateSettings({ themePreset: preset.id })}
                        className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-vermilion ring-2 ring-vermilion/50 shadow-sm'
                            : 'border-hairline hover:border-ink/30 dark:border-obsidian-border dark:hover:border-obsidian-muted'
                        }`}
                      >
                        {/* Mockup miniature window */}
                        <div
                          className="relative flex h-20 w-full flex-col justify-between overflow-hidden p-2"
                          style={{ backgroundColor: preset.preview.canvas }}
                        >
                          {/* Accent header / sidebar bar */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-6 rounded-[2px]"
                              style={{ backgroundColor: preset.preview.accent }}
                            />
                            <span
                              className="h-1.5 w-10 rounded-[1px] opacity-40"
                              style={{ backgroundColor: preset.preview.ink }}
                            />
                          </div>

                          {/* Miniature surface content card */}
                          <div
                            className="mt-1 flex h-10 w-full items-center justify-center rounded-[3px] border"
                            style={{
                              backgroundColor: preset.preview.surface,
                              borderColor: preset.preview.border
                            }}
                          >
                            {isSelected ? (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-600 shadow-xs dark:bg-emerald-950/70 dark:text-emerald-400">
                                <Check size={14} weight="bold" />
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1 w-3/4">
                                <span
                                  className="h-1 w-full rounded-[1px] opacity-25"
                                  style={{ backgroundColor: preset.preview.ink }}
                                />
                                <span
                                  className="h-1 w-2/3 rounded-[1px] opacity-15"
                                  style={{ backgroundColor: preset.preview.ink }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Label */}
                        <div className="border-t border-hairline bg-paper px-2.5 py-2 dark:border-obsidian-border dark:bg-obsidian-elevated">
                          <div className="flex items-center justify-between">
                            <span className="text-[12.5px] font-bold text-ink dark:text-obsidian-ink">
                              {preset.name}
                            </span>
                            <span className="font-mono text-[10px] text-ink-muted dark:text-obsidian-muted">
                              {preset.colorScheme === 'dark' ? 'Tối' : 'Sáng'}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[10.5px] text-ink-muted dark:text-obsidian-muted">
                            {preset.subtitle}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. KIỂU NÚT BẤM */}
              <div className="mt-7">
                <div className="mb-2.5 flex items-center gap-2">
                  <Pill size={16} weight="bold" className="text-ink dark:text-obsidian-ink" />
                  <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                    Kiểu nút bấm
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-1 rounded-xl border border-hairline bg-paper-subtle p-1 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  {BUTTON_RADIUS_OPTIONS.map((opt) => {
                    const active = (settings.buttonRadiusStyle ?? 'rounded') === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => void updateSettings({ buttonRadiusStyle: opt.id })}
                        className={`btn-radius py-2 text-center text-[13px] transition-all ${
                          active
                            ? 'bg-vermilion font-bold text-white shadow-xs'
                            : 'text-ink-muted hover:bg-paper hover:text-ink dark:text-obsidian-muted dark:hover:bg-obsidian'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESKTOP WIDGET & THÔNG BÁO */}
          {activeTab === 'widget' && (
            <div className="rounded-2xl border border-hairline bg-paper p-6 shadow-xs dark:border-obsidian-border dark:bg-obsidian-surface">
              <h2 className="text-[17px] font-bold text-ink dark:text-obsidian-ink">
                Floating Desktop Widget & Thông báo Windows
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                Điều chỉnh widget nổi trên màn hình nền Windows và cấu hình nhắc việc.
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-paper-subtle p-4 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div>
                    <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                      Trạng thái hiển thị Widget
                    </span>
                    <p className="mt-0.5 text-[12px] text-ink-muted dark:text-obsidian-muted">
                      Widget nổi hiển thị ngày âm dương, sự kiện hôm nay, việc cần làm & đếm ngược.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleWidget()}
                      className="btn-radius bg-vermilion px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-vermilion-hover"
                    >
                      {settings.widgetVisible ? 'Ẩn Widget' : 'Hiện Widget'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void updateSettings({ widgetAlwaysOnTop: !settings.widgetAlwaysOnTop })
                      }
                      className="btn-radius border border-hairline bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-ink hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian dark:text-obsidian-ink"
                    >
                      {settings.widgetAlwaysOnTop ? 'Ghim trên cùng' : 'Không ghim'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-hairline bg-paper-subtle p-4 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div>
                    <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                      Độ trong suốt Widget ({Math.round(settings.widgetOpacity * 100)}%)
                    </span>
                    <p className="mt-0.5 text-[12px] text-ink-muted dark:text-obsidian-muted">
                      Điều chỉnh độ mờ ảo khi đặt trên hình nền Desktop.
                    </p>
                  </div>
                  <input
                    type="range"
                    min={0.65}
                    max={1}
                    step={0.05}
                    value={settings.widgetOpacity}
                    onChange={(e) => void updateSettings({ widgetOpacity: Number(e.target.value) })}
                    className="w-48 accent-vermilion"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-hairline bg-paper-subtle p-4 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div>
                    <span className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                      Kiểm tra thông báo Windows
                    </span>
                    <p className="mt-0.5 text-[12px] text-ink-muted dark:text-obsidian-muted">
                      Gửi thông báo mẫu qua hệ thống Native Windows Notification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void window.lichAPI?.testNotification()}
                    className="btn-radius flex items-center gap-1.5 border border-hairline bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-ink hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian dark:text-obsidian-ink"
                  >
                    <BellRinging size={14} />
                    <span>Gửi thông báo thử</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐỒNG BỘ CLOUD (SUPABASE) */}
          {activeTab === 'cloud' && (
            <div className="rounded-2xl border border-hairline bg-paper p-6 shadow-xs dark:border-obsidian-border dark:bg-obsidian-surface">
              <div className="flex items-center justify-between border-b border-hairline pb-4 dark:border-obsidian-border">
                <h2 className="text-[17px] font-bold text-ink dark:text-obsidian-ink">
                  Đồng bộ Cloud (Supabase · 8 bảng dữ liệu)
                </h2>
                <span className="rounded-lg border border-hairline bg-paper-subtle px-2.5 py-1 font-mono text-[11px] text-ink-muted dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted">
                  {syncState.pendingCount} bản ghi chờ đồng bộ
                </span>
              </div>

              <p className="mt-3 text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                Ứng dụng luôn ưu tiên lưu dữ liệu cục bộ an toàn trên máy. Để đồng bộ nhiều thiết bị,
                tạo project Supabase miễn phí, chạy file{' '}
                <code className="font-mono">supabase/schema.sql</code> và dán thông tin kết nối dưới
                đây:
              </p>

              <form onSubmit={(e) => void handleSaveSupabaseConfig(e)} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="sb-url"
                    className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Supabase Project URL
                  </label>
                  <input
                    id="sb-url"
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="btn-radius font-mono w-full border border-hairline bg-paper-subtle px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sb-key"
                    className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Supabase Anon Public Key
                  </label>
                  <input
                    id="sb-key"
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="btn-radius font-mono w-full border border-hairline bg-paper-subtle px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-radius border border-hairline bg-paper-subtle px-4 py-2 text-[12.5px] font-medium text-ink hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                >
                  Lưu cấu hình Supabase
                </button>
              </form>

              <div className="mt-6 border-t border-hairline pt-5 dark:border-obsidian-border">
                {syncState.userEmail ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                        Đã đăng nhập: {syncState.userEmail}
                      </div>
                      <div className="font-mono text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                        {syncState.lastSyncedAt
                          ? `Đồng bộ gần nhất: ${new Date(syncState.lastSyncedAt).toLocaleTimeString('vi-VN')}`
                          : 'Sẵn sàng đồng bộ hai chiều'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={syncState.status === 'syncing'}
                        onClick={() => void syncCloudNow()}
                        className="btn-radius flex items-center gap-1.5 bg-jade px-4 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        <ArrowsClockwise
                          size={14}
                          className={syncState.status === 'syncing' ? 'animate-spin' : ''}
                        />
                        <span>
                          {syncState.status === 'syncing' ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void signOutCloud()}
                        className="btn-radius flex items-center gap-1 border border-hairline px-3 py-1.5 text-[12.5px] font-medium text-ink hover:border-[#C81E1E] hover:text-[#C81E1E] dark:border-obsidian-border dark:text-obsidian-ink"
                      >
                        <SignOut size={14} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="sync-email"
                          className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                        >
                          Email tài khoản
                        </label>
                        <input
                          id="sync-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ban@example.com"
                          className="btn-radius w-full border border-hairline bg-paper-subtle px-3 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="sync-pass"
                          className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
                        >
                          Mật khẩu
                        </label>
                        <input
                          id="sync-pass"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          className="btn-radius w-full border border-hairline bg-paper-subtle px-3 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={authBusy}
                        onClick={() => void handleAuth('signin')}
                        className="btn-radius bg-vermilion px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-vermilion-hover disabled:opacity-60"
                      >
                        Đăng nhập & Đồng bộ
                      </button>
                      <button
                        type="button"
                        disabled={authBusy}
                        onClick={() => void handleAuth('signup')}
                        className="btn-radius border border-hairline px-3.5 py-2 text-[12.5px] font-medium text-ink hover:border-vermilion dark:border-obsidian-border dark:text-obsidian-ink"
                      >
                        Đăng ký tài khoản mới
                      </button>
                    </div>
                  </div>
                )}

                {(authFeedback || syncState.errorMessage) && (
                  <p className="mt-2.5 text-[12.5px] font-medium text-vermilion">
                    {syncState.errorMessage ?? authFeedback}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SAO LƯU & .ICS */}
          {activeTab === 'backup' && (
            <div className="rounded-2xl border border-hairline bg-paper p-6 shadow-xs dark:border-obsidian-border dark:bg-obsidian-surface">
              <h2 className="text-[17px] font-bold text-ink dark:text-obsidian-ink">
                Sao lưu dữ liệu (JSON) & Trao đổi lịch (.ics)
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                Xuất toàn bộ 8 bảng dữ liệu sang file JSON để lưu trữ riêng, hoặc trao đổi sự kiện
                chuẩn .ics với Google Calendar / Apple Calendar.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-hairline bg-paper-subtle p-4 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                    Sao lưu toàn bộ (JSON)
                  </div>
                  <p className="mt-1 text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                    Bao gồm Lịch, Việc cần làm, Thói quen, Sổ nhật ký, Tài chính & Mục tiêu.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleExportJson()}
                      className="btn-radius flex items-center gap-1.5 bg-ink px-3.5 py-2 text-[12px] font-semibold text-white hover:opacity-90 dark:bg-obsidian-ink dark:text-obsidian"
                    >
                      <DownloadSimple size={14} />
                      <span>Xuất JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => jsonInputRef.current?.click()}
                      className="btn-radius flex items-center gap-1.5 border border-hairline bg-paper px-3.5 py-2 text-[12px] font-medium text-ink hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
                    >
                      <UploadSimple size={14} />
                      <span>Khôi phục JSON</span>
                    </button>
                    <input
                      ref={jsonInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => void handleImportJson(e)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-hairline bg-paper-subtle p-4 dark:border-obsidian-border dark:bg-obsidian-elevated">
                  <div className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                    Trao đổi iCalendar (.ics)
                  </div>
                  <p className="mt-1 text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                    Đồng bộ sự kiện sang Google Calendar, Outlook hoặc Apple iCal.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExportIcs}
                      className="btn-radius flex items-center gap-1.5 bg-jade px-3.5 py-2 text-[12px] font-semibold text-white hover:opacity-90"
                    >
                      <DownloadSimple size={14} />
                      <span>Xuất .ics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => icsInputRef.current?.click()}
                      className="btn-radius flex items-center gap-1.5 border border-hairline bg-paper px-3.5 py-2 text-[12px] font-medium text-ink hover:border-jade dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
                    >
                      <UploadSimple size={14} />
                      <span>Nhập .ics</span>
                    </button>
                    <input
                      ref={icsInputRef}
                      type="file"
                      accept=".ics,text/calendar"
                      className="hidden"
                      onChange={(e) => void handleImportIcs(e)}
                    />
                  </div>
                </div>
              </div>

              {backupFeedback && (
                <div className="mt-4 rounded-xl border border-hairline bg-paper-subtle p-3 text-[12.5px] font-medium text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink">
                  {backupFeedback}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: QUẢN LÝ MODULE */}
          {activeTab === 'modules' && (
            <div className="rounded-2xl border border-hairline bg-paper p-6 shadow-xs dark:border-obsidian-border dark:bg-obsidian-surface">
              <div className="border-b border-hairline pb-4 dark:border-obsidian-border">
                <h2 className="text-[17px] font-bold text-ink dark:text-obsidian-ink">
                  Quản lý Module (Bật / Tắt tính năng)
                </h2>
                <p className="mt-1 text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                  Ẩn bớt các module bạn ít dùng để giao diện gọn gàng hơn. Dữ liệu đã ghi luôn được
                  bảo lưu đầy đủ.
                </p>
              </div>

              <div className="mt-4 divide-y divide-hairline dark:divide-obsidian-border">
                {MODULE_REGISTRY.map((mod) => {
                  const enabled = settings.enabledModules[mod.id]
                  return (
                    <div key={mod.id} className="flex items-center justify-between gap-4 py-3.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-ink dark:text-obsidian-ink">
                            {mod.name}
                          </span>
                          {mod.required && (
                            <span className="text-[11px] font-medium text-vermilion">Cốt lõi</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] text-ink-muted dark:text-obsidian-muted">
                          {mod.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        disabled={mod.required}
                        onClick={() => void toggleModule(mod.id)}
                        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                          enabled ? 'bg-vermilion' : 'bg-hairline dark:bg-obsidian-border'
                        } ${mod.required ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`block h-4 w-4 translate-y-[2px] rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 border-t border-hairline pt-4 dark:border-obsidian-border">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-[13px] font-medium text-ink dark:text-obsidian-ink">
                    Hiển thị ngày Âm lịch trực tiếp trên ô lịch tháng
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.showLunarInGrid}
                    onChange={(e) => void updateSettings({ showLunarInGrid: e.target.checked })}
                    className="h-4 w-4 accent-vermilion"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
