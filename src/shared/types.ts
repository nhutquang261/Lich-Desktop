import type { ModuleId } from './modules'
import type { ThemePresetId } from './themes'

export type SyncStatus = 'synced' | 'pending'

export interface SyncableRecord {
  id: string
  user_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  sync_status: SyncStatus
}

export type EventCategory = 'work' | 'personal' | 'family' | 'health' | 'holiday' | 'other'

export type RecurrenceRule =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'lunar-monthly'
  | 'lunar-yearly'

export const EVENT_CATEGORY_META: Record<
  EventCategory,
  { label: string; color: string }
> = {
  work: { label: 'Công việc', color: '#334155' },
  personal: { label: 'Cá nhân', color: '#0D7A5F' },
  family: { label: 'Gia đình', color: '#D9381E' },
  health: { label: 'Sức khỏe', color: '#0F766E' },
  holiday: { label: 'Ngày lễ / Giỗ', color: '#C2410C' },
  other: { label: 'Khác', color: '#C67D08' }
}

export interface CalendarEvent extends SyncableRecord {
  title: string
  description: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  start_time: string | null // HH:mm
  end_time: string | null // HH:mm
  all_day: boolean
  category: EventCategory
  color: string
  recurrence: RecurrenceRule
  lunar_day: number | null
  lunar_month: number | null
  reminder_minutes: number | null
}

export interface EventOccurrence {
  occurrenceKey: string
  event: CalendarEvent
  date: string // YYYY-MM-DD
}

export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskItem extends SyncableRecord {
  title: string
  due_date: string | null // YYYY-MM-DD
  completed: boolean
  priority: TaskPriority
  notes: string
}

export interface HabitItem extends SyncableRecord {
  name: string
  color: string
  target_days_per_week: number
  archived: boolean
}

export interface HabitLog extends SyncableRecord {
  habit_id: string
  log_date: string // YYYY-MM-DD
  completed: boolean
}

export interface DailyNote extends SyncableRecord {
  note_date: string // YYYY-MM-DD
  content: string
  mood: 'great' | 'good' | 'neutral' | 'low' | 'stressed' | null
}

export interface FinanceTransaction extends SyncableRecord {
  tx_date: string // YYYY-MM-DD
  kind: 'income' | 'expense'
  amount: number
  category: string
  note: string
}

export interface GoalItem extends SyncableRecord {
  title: string
  target_date: string | null
  progress: number // 0..100
  status: 'active' | 'completed' | 'paused'
}

export interface CountdownItem extends SyncableRecord {
  title: string
  target_date: string // YYYY-MM-DD
  is_lunar: boolean
  lunar_day: number | null
  lunar_month: number | null
  color: string
  pinned: boolean
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSizeScale = 'small' | 'medium' | 'large' | 'xlarge'
export type ButtonRadiusStyle = 'rounded' | 'pill' | 'sharp'

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

export interface YearLayoutSettings {
  startYear: number
  startMonth: number // 1..12
  customOrder: string[] // 12 "YYYY-MM" keys
  columns: 2 | 3 | 4
}

export interface AppSettings {
  theme: ThemeMode
  themePreset: ThemePresetId
  fontSizeScale: FontSizeScale
  buttonRadiusStyle: ButtonRadiusStyle
  customAccent: string | null
  enabledModules: Record<ModuleId, boolean>
  showLunarInGrid: boolean
  yearLayout: YearLayoutSettings
  widgetVisible: boolean
  widgetAlwaysOnTop: boolean
  widgetOpacity: number
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface WidgetSnapshot {
  dateISO: string
  solarLabel: string
  lunarLabel: string
  canChiDay: string
  holidayName: string | null
  events: Array<{
    id: string
    title: string
    timeLabel: string
    color: string
    isLunarRecurring: boolean
  }>
  tasks: Array<{
    id: string
    title: string
    completed: boolean
    priority: TaskPriority
  }>
  pinnedCountdowns: Array<{
    id: string
    title: string
    daysRemaining: number
    resolvedSolarISO: string
    color: string
    isLunar: boolean
  }>
  theme: 'light' | 'dark'
  themePreset: ThemePresetId
  fontSizeScale?: FontSizeScale
  buttonRadiusStyle?: ButtonRadiusStyle
  customAccent?: string | null
  alwaysOnTop: boolean
  opacity: number
}

export interface BackupDataPayload {
  schemaVersion: 1
  exportedAt: string
  data: {
    calendar_events: CalendarEvent[]
    tasks: TaskItem[]
    habits: HabitItem[]
    habit_logs: HabitLog[]
    daily_notes: DailyNote[]
    finance_transactions: FinanceTransaction[]
    goals: GoalItem[]
    countdowns: CountdownItem[]
  }
}

export interface ReminderPayload {
  id: string
  title: string
  body: string
  fireAt: number // epoch ms
}

export type WidgetActionPayload =
  | { type: 'toggle-task'; taskId: string }
  | { type: 'add-quick-task'; title: string }
  | { type: 'open-main'; dateISO?: string }
