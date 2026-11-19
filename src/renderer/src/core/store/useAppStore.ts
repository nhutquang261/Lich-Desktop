import { create } from 'zustand'
import {
  addDaysISO,
  expandEventsForRange,
  formatISODate
} from '@shared/calendar/recurrence'
import { resolveCountdown } from '@shared/countdown/countdownMath'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { getVietnameseHolidays } from '@shared/lunar/vnHolidays'
import { getDefaultEnabledModules, type ModuleId } from '@shared/modules'
import { DEFAULT_THEME_PRESET, getThemePreset, type ThemePresetId } from '@shared/themes'
import type {
  CountdownInput,
  DailyNoteInput,
  EventInput,
  FinanceTransactionInput,
  GoalInput,
  HabitInput,
  TaskInput
} from '@shared/schemas'
import type {
  AppSettings,
  CalendarEvent,
  CountdownItem,
  DailyNote,
  FinanceTransaction,
  GoalItem,
  HabitItem,
  HabitLog,
  ReminderPayload,
  TaskItem,
  WidgetSnapshot
} from '@shared/types'
import {
  countPendingSyncRecords,
  createCountdown,
  createEvent,
  createGoal,
  createHabit,
  createTask,
  createTransaction,
  listActiveCountdowns,
  listActiveDailyNotes,
  listActiveEvents,
  listActiveGoals,
  listActiveHabitLogs,
  listActiveHabits,
  listActiveTasks,
  listActiveTransactions,
  seedInitialDataIfNeeded,
  softDeleteCountdown,
  softDeleteEvent,
  softDeleteGoal,
  softDeleteHabit,
  softDeleteTask,
  softDeleteTransaction,
  toggleCountdownPinned,
  toggleHabitLogForDate,
  toggleTaskCompleted,
  updateEvent,
  updateGoalProgress,
  updateTask,
  upsertDailyNote
} from '../db/repositories'
import { getSupabaseClient } from '../sync/supabaseClient'
import { runCloudSync } from '../sync/syncEngine'

export type ActiveNavView = ModuleId | 'settings'
export type CalendarViewMode = 'year' | 'month' | 'week' | 'day' | 'agenda'

export interface SyncUIState {
  configured: boolean
  userEmail: string | null
  userId: string | null
  status: 'offline' | 'idle' | 'syncing' | 'error'
  lastSyncedAt: string | null
  pendingCount: number
  errorMessage: string | null
}

function adjustBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '')
  const num = parseInt(cleanHex, 16)
  if (isNaN(num)) return hex
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`
}

const FALLBACK_SETTINGS: AppSettings = {
  theme: 'light',
  themePreset: DEFAULT_THEME_PRESET,
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

function resolveEffectiveTheme(
  themePreset: ThemePresetId | undefined,
  theme: AppSettings['theme']
): 'light' | 'dark' {
  if (themePreset) {
    return getThemePreset(themePreset).colorScheme
  }
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyThemeToDocument(settings: AppSettings): 'light' | 'dark' {
  const preset = getThemePreset(settings.themePreset)
  document.documentElement.dataset.theme = preset.id
  document.documentElement.dataset.fontSize = settings.fontSizeScale || 'medium'
  document.documentElement.dataset.buttonRadius = settings.buttonRadiusStyle || 'rounded'
  document.documentElement.classList.toggle('dark', preset.colorScheme === 'dark')

  if (settings.customAccent) {
    document.documentElement.style.setProperty('--color-vermilion', settings.customAccent)
    document.documentElement.style.setProperty(
      '--color-vermilion-hover',
      adjustBrightness(settings.customAccent, -15)
    )
    document.documentElement.style.setProperty(
      '--color-vermilion-soft',
      `${settings.customAccent}1A`
    )
  } else {
    document.documentElement.style.removeProperty('--color-vermilion')
    document.documentElement.style.removeProperty('--color-vermilion-hover')
    document.documentElement.style.removeProperty('--color-vermilion-soft')
  }

  return preset.colorScheme
}

function buildTodayWidgetSnapshot(
  events: CalendarEvent[],
  tasks: TaskItem[],
  countdowns: CountdownItem[],
  settings: AppSettings
): WidgetSnapshot {
  const todayISO = formatISODate(new Date())
  const [yy, mm, dd] = todayISO.split('-').map(Number)
  const lunar = getLunarInfoFromISO(todayISO)
  const holidays = getVietnameseHolidays(dd, mm, lunar)
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const dayOfWeek = dayNames[new Date(yy, mm - 1, dd).getDay()]

  const expanded = expandEventsForRange(events, todayISO, todayISO).get(todayISO) ?? []
  const todayTasks = tasks
    .filter((t) => !t.due_date || t.due_date <= todayISO)
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 8)

  const pinnedCountdowns = settings.enabledModules['lunar-countdown']
    ? countdowns
        .filter((c) => c.pinned)
        .map((c) => resolveCountdown(c, todayISO))
        .filter((r) => !r.isPast)
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .slice(0, 2)
        .map((r) => ({
          id: r.item.id,
          title: r.item.title,
          daysRemaining: r.daysRemaining,
          resolvedSolarISO: r.resolvedSolarISO,
          color: r.item.color,
          isLunar: r.item.is_lunar
        }))
    : []

  return {
    dateISO: todayISO,
    solarLabel: `${dayOfWeek}, ${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yy}`,
    lunarLabel: `Âm lịch ${lunar.day}/${lunar.month}${lunar.isLeapMonth ? ' Nhuận' : ''} · Năm ${lunar.canChiYear}`,
    canChiDay: `Ngày ${lunar.canChiDay}`,
    holidayName: holidays[0]?.name ?? null,
    events: expanded.slice(0, 6).map((occ) => ({
      id: occ.event.id,
      title: occ.event.title,
      timeLabel: occ.event.all_day ? 'Cả ngày' : (occ.event.start_time ?? '—'),
      color: occ.event.color,
      isLunarRecurring:
        occ.event.recurrence === 'lunar-monthly' || occ.event.recurrence === 'lunar-yearly'
    })),
    tasks: todayTasks.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority
    })),
    pinnedCountdowns,
    theme: resolveEffectiveTheme(settings.themePreset, settings.theme),
    themePreset: settings.themePreset,
    fontSizeScale: settings.fontSizeScale,
    buttonRadiusStyle: settings.buttonRadiusStyle,
    customAccent: settings.customAccent,
    alwaysOnTop: settings.widgetAlwaysOnTop,
    opacity: settings.widgetOpacity
  }
}

function buildUpcomingReminders(events: CalendarEvent[]): ReminderPayload[] {
  const todayISO = formatISODate(new Date())
  const endISO = addDaysISO(todayISO, 7)
  const map = expandEventsForRange(events, todayISO, endISO)
  const payloads: ReminderPayload[] = []

  for (const [dateISO, occs] of map.entries()) {
    for (const occ of occs) {
      if (occ.event.reminder_minutes === null) continue
      const [y, m, d] = dateISO.split('-').map(Number)
      const [hh, min] = occ.event.all_day
        ? [8, 0]
        : (occ.event.start_time ?? '08:00').split(':').map(Number)
      const eventTimeMs = new Date(y, m - 1, d, hh, min, 0, 0).getTime()
      const fireAt = eventTimeMs - occ.event.reminder_minutes * 60_000
      if (fireAt > Date.now()) {
        payloads.push({
          id: occ.occurrenceKey,
          title: `Sắp diễn ra: ${occ.event.title}`,
          body: occ.event.all_day
            ? `Sự kiện cả ngày (${dateISO})`
            : `Lúc ${occ.event.start_time ?? '08:00'} · Nhắc trước ${occ.event.reminder_minutes} phút`,
          fireAt
        })
      }
    }
  }
  return payloads
}

interface AppStoreState {
  initialized: boolean
  settings: AppSettings
  activeView: ActiveNavView
  calendarView: CalendarViewMode
  selectedDateISO: string
  visibleMonthISO: string // YYYY-MM-01
  events: CalendarEvent[]
  tasks: TaskItem[]
  habits: HabitItem[]
  habitLogs: HabitLog[]
  dailyNotes: DailyNote[]
  transactions: FinanceTransaction[]
  goals: GoalItem[]
  countdowns: CountdownItem[]
  syncState: SyncUIState

  bootstrap: () => Promise<void>
  setActiveView: (view: ActiveNavView) => void
  setCalendarView: (mode: CalendarViewMode) => void
  setSelectedDate: (dateISO: string) => void
  setVisibleMonth: (monthStartISO: string) => void
  jumpToToday: () => void

  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  toggleModule: (id: ModuleId) => Promise<void>
  toggleWidget: () => Promise<void>

  addEvent: (input: EventInput) => Promise<CalendarEvent>
  editEvent: (id: string, input: EventInput) => Promise<void>
  removeEvent: (id: string) => Promise<void>

  addTask: (input: TaskInput) => Promise<TaskItem>
  editTask: (id: string, input: TaskInput) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>

  addHabit: (input: HabitInput) => Promise<HabitItem>
  removeHabit: (id: string) => Promise<void>
  toggleHabitOnDate: (habitId: string, dateISO: string) => Promise<void>

  saveDailyNote: (input: DailyNoteInput) => Promise<DailyNote>

  addTransaction: (input: FinanceTransactionInput) => Promise<FinanceTransaction>
  removeTransaction: (id: string) => Promise<void>

  addGoal: (input: GoalInput) => Promise<GoalItem>
  setGoalProgress: (id: string, progress: number, status?: GoalItem['status']) => Promise<void>
  removeGoal: (id: string) => Promise<void>

  addCountdown: (input: CountdownInput) => Promise<CountdownItem>
  togglePinCountdown: (id: string) => Promise<void>
  removeCountdown: (id: string) => Promise<void>

  signInCloud: (email: string, password: string) => Promise<void>
  signUpCloud: (email: string, password: string) => Promise<void>
  signOutCloud: () => Promise<void>
  syncCloudNow: () => Promise<void>
  refreshLocalData: () => Promise<void>
}

export const useAppStore = create<AppStoreState>((set, get) => {
  const broadcastDesktopBridge = async (): Promise<void> => {
    const { events, tasks, countdowns, settings } = get()
    const snapshot = buildTodayWidgetSnapshot(events, tasks, countdowns, settings)
    await window.lichAPI?.pushWidgetSnapshot(snapshot)
    await window.lichAPI?.syncReminders(buildUpcomingReminders(events))
  }

  return {
    initialized: false,
    settings: FALLBACK_SETTINGS,
    activeView: 'calendar',
    calendarView: 'month',
    selectedDateISO: formatISODate(new Date()),
    visibleMonthISO: `${formatISODate(new Date()).slice(0, 7)}-01`,
    events: [],
    tasks: [],
    habits: [],
    habitLogs: [],
    dailyNotes: [],
    transactions: [],
    goals: [],
    countdowns: [],
    syncState: {
      configured: false,
      userEmail: null,
      userId: null,
      status: 'offline',
      lastSyncedAt: null,
      pendingCount: 0,
      errorMessage: null
    },

    bootstrap: async () => {
      if (get().initialized) return
      await seedInitialDataIfNeeded()
      const settings = (await window.lichAPI?.getSettings()) ?? FALLBACK_SETTINGS
      applyThemeToDocument(settings)

      const [
        events,
        tasks,
        habits,
        habitLogs,
        dailyNotes,
        transactions,
        goals,
        countdowns,
        pendingCount
      ] = await Promise.all([
        listActiveEvents(),
        listActiveTasks(),
        listActiveHabits(),
        listActiveHabitLogs(),
        listActiveDailyNotes(),
        listActiveTransactions(),
        listActiveGoals(),
        listActiveCountdowns(),
        countPendingSyncRecords()
      ])

      const client = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey)
      let userEmail: string | null = null
      let userId: string | null = null
      if (client) {
        const { data } = await client.auth.getSession()
        userEmail = data.session?.user?.email ?? null
        userId = data.session?.user?.id ?? null
      }

      set({
        initialized: true,
        settings,
        events,
        tasks,
        habits,
        habitLogs,
        dailyNotes,
        transactions,
        goals,
        countdowns,
        syncState: {
          configured: Boolean(client),
          userEmail,
          userId,
          status: client && userId ? 'idle' : 'offline',
          lastSyncedAt: null,
          pendingCount,
          errorMessage: null
        }
      })

      await broadcastDesktopBridge()

      window.lichAPI?.onSettingsChanged((nextSettings) => {
        applyThemeToDocument(nextSettings)
        set({ settings: nextSettings })
        void broadcastDesktopBridge()
      })

      window.lichAPI?.onWidgetAction((action) => {
        if (action.type === 'toggle-task') {
          void get().toggleTask(action.taskId)
        } else if (action.type === 'add-quick-task') {
          void get().addTask({
            title: action.title,
            due_date: formatISODate(new Date()),
            completed: false,
            priority: 'medium',
            notes: ''
          })
        } else if (action.type === 'open-main' && action.dateISO) {
          get().setSelectedDate(action.dateISO)
          get().setActiveView('calendar')
        }
      })
    },

    setActiveView: (view) => set({ activeView: view }),
    setCalendarView: (mode) => set({ calendarView: mode }),

    setSelectedDate: (dateISO) =>
      set({
        selectedDateISO: dateISO,
        visibleMonthISO: `${dateISO.slice(0, 7)}-01`
      }),

    setVisibleMonth: (monthStartISO) => set({ visibleMonthISO: monthStartISO }),

    jumpToToday: () => {
      const todayISO = formatISODate(new Date())
      set({
        selectedDateISO: todayISO,
        visibleMonthISO: `${todayISO.slice(0, 7)}-01`
      })
    },

    updateSettings: async (patch) => {
      const normalizedPatch: Partial<AppSettings> = { ...patch }
      if (patch.themePreset) {
        normalizedPatch.theme = getThemePreset(patch.themePreset).colorScheme
      }
      const next =
        (await window.lichAPI?.updateSettings(normalizedPatch)) ?? {
          ...get().settings,
          ...normalizedPatch
        }
      applyThemeToDocument(next)
      const client = getSupabaseClient(next.supabaseUrl, next.supabaseAnonKey)
      set((state) => ({
        settings: next,
        syncState: {
          ...state.syncState,
          configured: Boolean(client),
          status: client && state.syncState.userId ? 'idle' : 'offline'
        }
      }))
      await broadcastDesktopBridge()
    },

    toggleModule: async (id) => {
      if (id === 'calendar') return
      const current = get().settings.enabledModules
      const nextEnabled = {
        ...current,
        [id]: !current[id],
        calendar: true as const
      }
      await get().updateSettings({ enabledModules: nextEnabled })
      if (!nextEnabled[id] && get().activeView === id) {
        set({ activeView: 'calendar' })
      }
    },

    toggleWidget: async () => {
      const visible = (await window.lichAPI?.toggleWidget()) ?? !get().settings.widgetVisible
      set((state) => ({
        settings: { ...state.settings, widgetVisible: visible }
      }))
      if (visible) {
        setTimeout(() => {
          void broadcastDesktopBridge()
        }, 300)
      }
    },

    refreshLocalData: async () => {
      const [
        events,
        tasks,
        habits,
        habitLogs,
        dailyNotes,
        transactions,
        goals,
        countdowns,
        pendingCount
      ] = await Promise.all([
        listActiveEvents(),
        listActiveTasks(),
        listActiveHabits(),
        listActiveHabitLogs(),
        listActiveDailyNotes(),
        listActiveTransactions(),
        listActiveGoals(),
        listActiveCountdowns(),
        countPendingSyncRecords()
      ])
      set((state) => ({
        events,
        tasks,
        habits,
        habitLogs,
        dailyNotes,
        transactions,
        goals,
        countdowns,
        syncState: { ...state.syncState, pendingCount }
      }))
      await broadcastDesktopBridge()
    },

    addEvent: async (input) => {
      const created = await createEvent(input, get().syncState.userId)
      await get().refreshLocalData()
      return created
    },

    editEvent: async (id, input) => {
      await updateEvent(id, input)
      await get().refreshLocalData()
    },

    removeEvent: async (id) => {
      await softDeleteEvent(id)
      await get().refreshLocalData()
    },

    addTask: async (input) => {
      const created = await createTask(input, get().syncState.userId)
      await get().refreshLocalData()
      return created
    },

    editTask: async (id, input) => {
      await updateTask(id, input)
      await get().refreshLocalData()
    },

    toggleTask: async (id) => {
      await toggleTaskCompleted(id)
      await get().refreshLocalData()
    },

    removeTask: async (id) => {
      await softDeleteTask(id)
      await get().refreshLocalData()
    },

    addHabit: async (input) => {
      const created = await createHabit(input, get().syncState.userId)
      await get().refreshLocalData()
      return created
    },

    removeHabit: async (id) => {
      await softDeleteHabit(id)
      await get().refreshLocalData()
    },

    toggleHabitOnDate: async (habitId, dateISO) => {
      await toggleHabitLogForDate(habitId, dateISO, get().syncState.userId)
      await get().refreshLocalData()
    },

    saveDailyNote: async (input) => {
      const saved = await upsertDailyNote(input, get().syncState.userId)
      await get().refreshLocalData()
      return saved
    },

    addTransaction: async (input) => {
      const created = await createTransaction(input, get().syncState.userId)
      await get().refreshLocalData()
      return created
    },

    removeTransaction: async (id) => {
      await softDeleteTransaction(id)
      await get().refreshLocalData()
    },

    addGoal: async (input) => {
      const created = await createGoal(input, get().syncState.userId)
      await get().refreshLocalData()
      return created
    },

    setGoalProgress: async (id, progress, status) => {
      await updateGoalProgress(id, progress, status)
      await get().refreshLocalData()
    },

    removeGoal: async (id) => {
      await softDeleteGoal(id)
      await get().refreshLocalData()
    },

    addCountdown: async (input) => {
      const created = await createCountdown(input, get().syncState.userId)
      await get().refreshLocalData()
      return created
    },

    togglePinCountdown: async (id) => {
      await toggleCountdownPinned(id)
      await get().refreshLocalData()
    },

    removeCountdown: async (id) => {
      await softDeleteCountdown(id)
      await get().refreshLocalData()
    },

    signInCloud: async (email, password) => {
      const { supabaseUrl, supabaseAnonKey } = get().settings
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey)
      if (!client) {
        throw new Error('Vui lòng nhập Supabase URL và Anon Key trước khi đăng nhập.')
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      set((state) => ({
        syncState: {
          ...state.syncState,
          configured: true,
          userEmail: data.user?.email ?? email,
          userId: data.user?.id ?? null,
          status: 'idle',
          errorMessage: null
        }
      }))
      await get().syncCloudNow()
    },

    signUpCloud: async (email, password) => {
      const { supabaseUrl, supabaseAnonKey } = get().settings
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey)
      if (!client) {
        throw new Error('Vui lòng nhập Supabase URL và Anon Key trước khi đăng ký.')
      }
      const { data, error } = await client.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      set((state) => ({
        syncState: {
          ...state.syncState,
          configured: true,
          userEmail: data.user?.email ?? email,
          userId: data.user?.id ?? null,
          status: data.session ? 'idle' : 'offline',
          errorMessage: data.session
            ? null
            : 'Đã tạo tài khoản. Vui lòng kiểm tra email xác nhận nếu Supabase yêu cầu.'
        }
      }))
    },

    signOutCloud: async () => {
      const { supabaseUrl, supabaseAnonKey } = get().settings
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey)
      await client?.auth.signOut()
      set((state) => ({
        syncState: {
          ...state.syncState,
          userEmail: null,
          userId: null,
          status: 'offline',
          errorMessage: null
        }
      }))
    },

    syncCloudNow: async () => {
      const { supabaseUrl, supabaseAnonKey } = get().settings
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey)
      if (!client) {
        set((state) => ({
          syncState: {
            ...state.syncState,
            status: 'offline',
            errorMessage: 'Chưa cấu hình Supabase URL & Anon Key.'
          }
        }))
        return
      }
      set((state) => ({
        syncState: { ...state.syncState, status: 'syncing', errorMessage: null }
      }))
      try {
        const result = await runCloudSync(client)
        await get().refreshLocalData()
        set((state) => ({
          syncState: {
            ...state.syncState,
            status: 'idle',
            lastSyncedAt: result.syncedAt,
            errorMessage: null
          }
        }))
      } catch (err) {
        set((state) => ({
          syncState: {
            ...state.syncState,
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Đồng bộ thất bại'
          }
        }))
      }
    }
  }
})
