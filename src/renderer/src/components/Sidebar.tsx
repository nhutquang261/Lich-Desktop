import { useEffect, useRef, useState } from 'react'
import {
  CalendarBlank,
  Check,
  CheckSquare,
  CloudCheck,
  CloudSlash,
  Coins,
  GearSix,
  MagnifyingGlass,
  MoonStars,
  Notebook,
  Palette,
  SidebarSimple,
  SquaresFour
} from '@phosphor-icons/react'
import { formatISODate } from '@shared/calendar/recurrence'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { MODULE_REGISTRY, type ModuleId } from '@shared/modules'
import { getThemePreset, THEME_PRESETS } from '@shared/themes'
import { useAppStore, type ActiveNavView } from '@renderer/core/store/useAppStore'

const MODULE_ICONS: Record<ModuleId, typeof CalendarBlank> = {
  calendar: CalendarBlank,
  'lunar-countdown': MoonStars,
  'tasks-habits': CheckSquare,
  'daily-notes': Notebook,
  'finance-goals': Coins
}

const MODULE_GROUPS: Array<{ title: string; modules: ModuleId[] }> = [
  {
    title: 'LỊCH & THỜI GIAN',
    modules: ['calendar', 'lunar-countdown']
  },
  {
    title: 'CÔNG VIỆC & THÓI QUEN',
    modules: ['tasks-habits', 'daily-notes']
  },
  {
    title: 'CÁ NHÂN & TÀI CHÍNH',
    modules: ['finance-goals']
  }
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenSearch?: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onOpenSearch
}: SidebarProps): React.JSX.Element {
  const { settings, activeView, setActiveView, toggleWidget, updateSettings, syncState } =
    useAppStore()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!themeMenuOpen) return
    const handleOutside = (event: MouseEvent): void => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [themeMenuOpen])

  const todayISO = formatISODate(new Date())
  const todayLunar = getLunarInfoFromISO(todayISO)
  const currentTheme = getThemePreset(settings.themePreset)

  const renderNavItem = (
    id: ActiveNavView,
    label: string,
    Icon: typeof CalendarBlank
  ): React.JSX.Element => {
    const isActive = activeView === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveView(id)}
        title={collapsed ? label : undefined}
        className={`btn-radius group relative flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 active:scale-[0.99] ${
          isActive
            ? 'bg-vermilion/10 font-semibold text-vermilion dark:bg-vermilion/15'
            : 'text-ink-muted hover:bg-black/[0.04] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.05] dark:hover:text-obsidian-ink'
        }`}
      >
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r bg-vermilion"
          />
        )}
        <Icon size={18} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    )
  }

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-hairline bg-paper transition-[width] duration-150 dark:border-obsidian-border dark:bg-obsidian-surface ${
        collapsed ? 'w-[60px]' : 'w-[236px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-hairline px-3 dark:border-obsidian-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="font-mono-tabular btn-radius flex h-7 w-7 shrink-0 items-center justify-center bg-vermilion text-xs font-bold text-white shadow-xs">
            {todayISO.slice(8, 10)}
          </div>
          {!collapsed && (
            <div className="truncate">
              <div className="text-[14px] font-bold tracking-tight text-ink dark:text-obsidian-ink">
                Lịch Desktop
              </div>
              <div className="font-mono-tabular text-[10px] text-ink-muted dark:text-obsidian-muted">
                STUDIO · v1.0
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className="btn-radius p-1 text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.06] dark:hover:text-obsidian-ink"
        >
          <SidebarSimple size={16} />
        </button>
      </div>

      {/* Quick Search Ctrl + K Bar (Matching NovaTimNhanh & Rieng) */}
      <div className="px-2.5 pt-2.5">
        {collapsed ? (
          <button
            type="button"
            onClick={onOpenSearch}
            title="Tìm kiếm nhanh (Ctrl + K)"
            className="btn-radius flex h-9 w-full items-center justify-center border border-hairline bg-paper-subtle text-ink-muted transition-colors hover:border-vermilion hover:text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted dark:hover:text-obsidian-ink"
          >
            <MagnifyingGlass size={16} weight="bold" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSearch}
            className="btn-radius flex w-full items-center justify-between border border-hairline bg-paper-subtle px-2.5 py-1.5 text-left text-xs text-ink-muted transition-colors hover:border-vermilion hover:text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted dark:hover:text-obsidian-ink"
          >
            <div className="flex items-center gap-2">
              <MagnifyingGlass size={14} weight="bold" />
              <span>Tìm kiếm nhanh...</span>
            </div>
            <kbd className="rounded border border-hairline bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-muted dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-muted">
              Ctrl K
            </kbd>
          </button>
        )}
      </div>

      {/* Today Lunar Mini Strip */}
      {!collapsed && settings.enabledModules['lunar-countdown'] && (
        <div className="mx-2.5 mt-2 rounded-xl border border-hairline bg-paper-subtle px-2.5 py-2 dark:border-obsidian-border dark:bg-obsidian-elevated">
          <div className="flex items-center justify-between text-[11px] text-ink-muted dark:text-obsidian-muted">
            <span>Hôm nay · Âm lịch</span>
            <span className="font-mono-tabular font-semibold text-vermilion">
              {todayLunar.day}/{todayLunar.month}
              {todayLunar.isLeapMonth ? 'N' : ''}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[12px] font-medium text-ink dark:text-obsidian-ink">
            Ngày {todayLunar.canChiDay} · {todayLunar.canChiYear}
          </div>
        </div>
      )}

      {/* Grouped Navigation (Matching Rieng & NovaModule 3-level Menu) */}
      <nav aria-label="Điều hướng chính" className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {MODULE_GROUPS.map((group, gIdx) => {
          const visibleInGroup = group.modules.filter((id) => settings.enabledModules[id])
          if (visibleInGroup.length === 0) return null

          return (
            <div key={group.title} className="space-y-0.5">
              {gIdx > 0 &&
                (collapsed ? (
                  <div className="my-1.5 h-[1px] w-6 mx-auto bg-hairline dark:bg-obsidian-border opacity-60" />
                ) : (
                  <div className="px-2.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted/70 dark:text-obsidian-muted/70">
                    {group.title}
                  </div>
                ))}
              {visibleInGroup.map((modId) => {
                const mod = MODULE_REGISTRY.find((m) => m.id === modId)
                if (!mod) return null
                return renderNavItem(mod.id, mod.shortName, MODULE_ICONS[mod.id])
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom Desktop Actions */}
      <div className="space-y-1.5 border-t border-hairline p-2 dark:border-obsidian-border">
        <button
          type="button"
          onClick={() => void toggleWidget()}
          title={collapsed ? 'Floating Desktop Widget' : undefined}
          className={`btn-radius flex w-full items-center gap-2.5 border px-2.5 py-2 text-[12.5px] font-medium transition-colors active:scale-[0.98] ${
            settings.widgetVisible
              ? 'border-vermilion/40 bg-vermilion/10 text-vermilion'
              : 'border-hairline bg-paper-subtle text-ink hover:border-ink/30 dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink'
          }`}
        >
          <SquaresFour
            size={16}
            weight={settings.widgetVisible ? 'fill' : 'regular'}
            className="shrink-0"
          />
          {!collapsed && (
            <span className="truncate">
              {settings.widgetVisible ? 'Đang bật Widget' : 'Mở Desktop Widget'}
            </span>
          )}
        </button>

        {/* Quick Theme Switcher Button + Popover */}
        <div ref={themeMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setThemeMenuOpen((prev) => !prev)}
            title={collapsed ? `Giao diện: ${currentTheme.name}` : undefined}
            className={`btn-radius flex w-full items-center gap-2.5 border px-2.5 py-2 text-[12.5px] font-medium transition-colors active:scale-[0.98] ${
              themeMenuOpen
                ? 'border-vermilion/50 bg-vermilion/10 text-vermilion'
                : 'border-hairline bg-paper-subtle text-ink hover:border-ink/30 dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink'
            }`}
          >
            <Palette size={16} weight={themeMenuOpen ? 'fill' : 'regular'} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate text-left">{currentTheme.name}</span>
                <span className="flex shrink-0 items-center gap-0.5">
                  <span
                    className="h-3 w-3 rounded-[2px] border border-black/15"
                    style={{ backgroundColor: currentTheme.preview.canvas }}
                  />
                  <span
                    className="h-3 w-3 rounded-[2px]"
                    style={{ backgroundColor: currentTheme.preview.accent }}
                  />
                </span>
              </>
            )}
          </button>

          {themeMenuOpen && (
            <div className="absolute bottom-0 left-full z-40 ml-2 w-[260px] rounded-2xl border border-hairline bg-paper p-2.5 shadow-2xl dark:border-obsidian-border dark:bg-obsidian-surface">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
                  Chọn giao diện
                </span>
                <span className="font-mono-tabular text-[10px] text-jade">App + Widget</span>
              </div>
              <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin">
                {THEME_PRESETS.map((preset) => {
                  const selected = preset.id === currentTheme.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        void updateSettings({ themePreset: preset.id })
                        setThemeMenuOpen(false)
                      }}
                      className={`btn-radius flex w-full items-center justify-between gap-2 border px-2 py-1.5 text-left transition-colors ${
                        selected
                          ? 'border-vermilion bg-vermilion/10'
                          : 'border-transparent hover:bg-paper-subtle dark:hover:bg-obsidian-elevated'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border"
                          style={{
                            backgroundColor: preset.preview.canvas,
                            borderColor: preset.preview.border
                          }}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: preset.preview.accent }}
                          />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-semibold text-ink dark:text-obsidian-ink">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-ink-muted dark:text-obsidian-muted">
                            {preset.subtitle}
                          </div>
                        </div>
                      </div>
                      {selected && (
                        <Check size={14} weight="bold" className="shrink-0 text-vermilion" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {renderNavItem('settings', 'Cài đặt & Sync', GearSix)}

        {!collapsed && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-ink-muted dark:text-obsidian-muted">
            <span className="flex items-center gap-1.5 truncate">
              {syncState.userEmail ? (
                <>
                  <CloudCheck size={14} weight="fill" className="shrink-0 text-jade" />
                  <span className="truncate">Cloud Sync</span>
                </>
              ) : (
                <>
                  <CloudSlash size={14} className="shrink-0" />
                  <span className="truncate">Offline Local</span>
                </>
              )}
            </span>
            {syncState.pendingCount > 0 && (
              <span className="font-mono-tabular text-[10px] text-amber">
                {syncState.pendingCount} chờ
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
