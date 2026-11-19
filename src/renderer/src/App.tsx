import { useEffect, useState } from 'react'
import { CommandPalette } from './components/CommandPalette'
import { Sidebar } from './components/Sidebar'
import { useAppStore } from './core/store/useAppStore'
import { CalendarWorkspace } from './modules/calendar/CalendarWorkspace'
import { DailyNotesView } from './modules/daily-notes/DailyNotesView'
import { FinanceGoalsView } from './modules/finance-goals/FinanceGoalsView'
import { LunarModuleView } from './modules/lunar-countdown/LunarModuleView'
import { SettingsSyncView } from './modules/settings-sync/SettingsSyncView'
import { TasksHabitsView } from './modules/tasks-habits/TasksHabitsView'

export function App(): React.JSX.Element {
  const { initialized, activeView, bootstrap } = useAppStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center bg-paper-subtle dark:bg-obsidian">
        <div className="flex items-center gap-3 text-[13px] font-medium text-ink-muted dark:text-obsidian-muted">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-vermilion" />
          <span>Đang khởi tạo Lịch Desktop...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-paper-subtle text-ink dark:bg-obsidian dark:text-obsidian-ink">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
      />

      <main className="flex min-w-0 flex-1 overflow-hidden">
        {activeView === 'calendar' && <CalendarWorkspace />}
        {activeView === 'lunar-countdown' && <LunarModuleView />}
        {activeView === 'tasks-habits' && <TasksHabitsView />}
        {activeView === 'daily-notes' && <DailyNotesView />}
        {activeView === 'finance-goals' && <FinanceGoalsView />}
        {activeView === 'settings' && <SettingsSyncView />}
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  )
}
