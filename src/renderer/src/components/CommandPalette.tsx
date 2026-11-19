import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BellRinging,
  CalendarBlank,
  CheckSquare,
  Coins,
  DownloadSimple,
  GearSix,
  MagnifyingGlass,
  MoonStars,
  Notebook,
  SquaresFour,
  Sun,
  X
} from '@phosphor-icons/react'
import { MODULE_REGISTRY } from '@shared/modules'
import { exportFullBackupPayload } from '@renderer/core/db/repositories'
import { useAppStore } from '@renderer/core/store/useAppStore'
import { removeVietnameseAccents } from './removeAccents'

interface PaletteItem {
  id: string
  title: string
  subtitle?: string
  category: 'Điều hướng' | 'Sự kiện & Lịch' | 'Việc cần làm' | 'Đếm ngược & Mục tiêu' | 'Thao tác nhanh'
  icon: typeof CalendarBlank
  badge?: string
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): React.JSX.Element | null {
  const {
    events,
    tasks,
    countdowns,
    goals,
    settings,
    setActiveView,
    toggleWidget,
    updateSettings
  } = useAppStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Aggregate searchable items
  const allItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = []

    // 1. Navigation items
    const navIcons: Record<string, typeof CalendarBlank> = {
      calendar: CalendarBlank,
      'lunar-countdown': MoonStars,
      'tasks-habits': CheckSquare,
      'daily-notes': Notebook,
      'finance-goals': Coins
    }

    MODULE_REGISTRY.forEach((mod) => {
      list.push({
        id: `nav-${mod.id}`,
        title: mod.name,
        subtitle: mod.description,
        category: 'Điều hướng',
        icon: navIcons[mod.id] || CalendarBlank,
        badge: 'Module',
        action: () => {
          setActiveView(mod.id)
          onClose()
        }
      })
    })

    list.push({
      id: 'nav-settings',
      title: 'Tùy chỉnh giao diện & Cài đặt',
      subtitle: 'Chọn theme, đổi màu chủ đạo, cỡ chữ, đồng bộ Cloud & sao lưu',
      category: 'Điều hướng',
      icon: GearSix,
      badge: 'Cài đặt',
      action: () => {
        setActiveView('settings')
        onClose()
      }
    })

    // 2. Calendar events
    events.slice(0, 15).forEach((ev) => {
      list.push({
        id: `event-${ev.id}`,
        title: ev.title,
        subtitle: `${ev.start_date}${ev.start_time ? ` · ${ev.start_time}` : ''}`,
        category: 'Sự kiện & Lịch',
        icon: CalendarBlank,
        badge: ev.all_day ? 'Cả ngày' : 'Giờ cố định',
        action: () => {
          setActiveView('calendar')
          onClose()
        }
      })
    })

    // 3. Tasks
    tasks
      .filter((t) => !t.completed)
      .slice(0, 15)
      .forEach((t) => {
        list.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: t.due_date ? `Hạn: ${t.due_date}` : 'Không có hạn chót',
          category: 'Việc cần làm',
          icon: CheckSquare,
          badge: t.priority === 'high' ? 'Ưu tiên cao' : 'Việc cần làm',
          action: () => {
            setActiveView('tasks-habits')
            onClose()
          }
        })
      })

    // 4. Countdowns & Goals
    countdowns.slice(0, 8).forEach((c) => {
      list.push({
        id: `cd-${c.id}`,
        title: c.title,
        subtitle: c.is_lunar ? `Âm lịch: ${c.lunar_day}/${c.lunar_month}` : `Dương: ${c.target_date}`,
        category: 'Đếm ngược & Mục tiêu',
        icon: MoonStars,
        badge: 'Đếm ngược',
        action: () => {
          setActiveView('lunar-countdown')
          onClose()
        }
      })
    })

    goals.slice(0, 6).forEach((g) => {
      list.push({
        id: `goal-${g.id}`,
        title: g.title,
        subtitle: `Tiến độ: ${g.progress}%`,
        category: 'Đếm ngược & Mục tiêu',
        icon: Coins,
        badge: 'Mục tiêu',
        action: () => {
          setActiveView('finance-goals')
          onClose()
        }
      })
    })

    // 5. Quick Actions
    list.push({
      id: 'act-widget',
      title: settings.widgetVisible ? 'Ẩn Floating Desktop Widget' : 'Hiện Floating Desktop Widget',
      subtitle: 'Widget nổi tiện ích trên màn hình Windows',
      category: 'Thao tác nhanh',
      icon: SquaresFour,
      badge: 'Widget',
      action: () => {
        void toggleWidget()
        onClose()
      }
    })

    list.push({
      id: 'act-theme',
      title: 'Đổi chế độ Sáng / Tối',
      subtitle: 'Chuyển nhanh chủ đề hiển thị',
      category: 'Thao tác nhanh',
      icon: Sun,
      badge: 'Theme',
      action: () => {
        const nextTheme = settings.themePreset === 'midnight-dark' ? 'vermilion-light' : 'midnight-dark'
        void updateSettings({ themePreset: nextTheme })
        onClose()
      }
    })

    list.push({
      id: 'act-export',
      title: 'Xuất bản sao lưu toàn bộ (JSON)',
      subtitle: 'Tải về file lưu trữ 8 bảng dữ liệu',
      category: 'Thao tác nhanh',
      icon: DownloadSimple,
      badge: 'Sao lưu',
      action: () => {
        void exportFullBackupPayload().then((payload) => {
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json;charset=utf-8'
          })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `lich-desktop-backup-${new Date().toISOString().slice(0, 10)}.json`
          document.body.appendChild(link)
          link.click()
          link.remove()
          URL.revokeObjectURL(url)
        })
        onClose()
      }
    })

    list.push({
      id: 'act-notify',
      title: 'Kiểm tra thông báo Windows',
      subtitle: 'Gửi thử 1 thông báo Native Windows',
      category: 'Thao tác nhanh',
      icon: BellRinging,
      badge: 'Thông báo',
      action: () => {
        void window.lichAPI?.testNotification()
        onClose()
      }
    })

    return list
  }, [events, tasks, countdowns, goals, settings, setActiveView, toggleWidget, updateSettings, onClose])

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = removeVietnameseAccents(query)
    if (!q) {
      // Group: show all Navigation first, then quick actions
      return allItems.filter(
        (i) => i.category === 'Điều hướng' || i.category === 'Thao tác nhanh'
      )
    }
    return allItems.filter((i) => {
      const matchTitle = removeVietnameseAccents(i.title).includes(q)
      const matchSub = i.subtitle ? removeVietnameseAccents(i.subtitle).includes(q) : false
      const matchCat = removeVietnameseAccents(i.category).includes(q)
      return matchTitle || matchSub || matchCat
    })
  }, [allItems, query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredItems, selectedIndex, onClose])

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh Lịch Desktop"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-[10vh] backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-2xl dark:border-obsidian-border dark:bg-obsidian-surface">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 dark:border-obsidian-border">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="text-ink-muted dark:text-obsidian-muted"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Tìm kiếm sự kiện, việc cần làm, module hoặc gõ không dấu..."
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-muted/60 dark:text-obsidian-ink dark:placeholder:text-obsidian-muted/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSelectedIndex(0)
                inputRef.current?.focus()
              }}
              className="text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="rounded border border-hairline bg-paper-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-muted dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-ink-muted dark:text-obsidian-muted">
                Không tìm thấy mục nào khớp với &ldquo;<strong>{query}</strong>&rdquo;
              </p>
              <p className="mt-1 text-[11.5px] text-ink-muted/70 dark:text-obsidian-muted/70">
                Thử gõ từ khóa không dấu như &ldquo;lich&rdquo;, &ldquo;thoi quen&rdquo;, &ldquo;thu chi&rdquo;...
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-index={idx}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => item.action()}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-vermilion font-medium text-white shadow-xs'
                        : 'text-ink hover:bg-paper-subtle dark:text-obsidian-ink dark:hover:bg-obsidian-elevated'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-paper-subtle text-ink-muted dark:bg-obsidian-elevated dark:text-obsidian-muted'
                        }`}
                      >
                        <IconComponent size={16} weight={isSelected ? 'fill' : 'regular'} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px]">{item.title}</div>
                        {item.subtitle && (
                          <div
                            className={`truncate text-[11px] ${
                              isSelected
                                ? 'text-white/80'
                                : 'text-ink-muted dark:text-obsidian-muted'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'border border-hairline bg-paper-subtle text-ink-muted dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted'
                        }`}
                      >
                        {item.badge ?? item.category}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-hairline bg-paper-subtle px-4 py-2 text-[11.5px] text-ink-muted dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-muted">
          <span>
            <strong className="font-semibold text-ink dark:text-obsidian-ink">↑ ↓</strong> để di chuyển ·{' '}
            <strong className="font-semibold text-ink dark:text-obsidian-ink">Enter</strong> để chọn
          </span>
          <span>
            Bấm <strong className="font-semibold text-ink dark:text-obsidian-ink">Esc</strong> để đóng
          </span>
        </div>
      </div>
    </div>
  )
}
