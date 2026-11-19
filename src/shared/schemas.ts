import { z } from 'zod'

export const dateISOSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD')

export const timeHHMMSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có dạng HH:mm')

export const eventInputSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề sự kiện').max(140),
  description: z.string().max(2000).default(''),
  start_date: dateISOSchema,
  end_date: dateISOSchema,
  start_time: timeHHMMSchema.nullable().default(null),
  end_time: timeHHMMSchema.nullable().default(null),
  all_day: z.boolean().default(true),
  category: z.enum(['work', 'personal', 'family', 'health', 'holiday', 'other']).default('personal'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#0D7A5F'),
  recurrence: z
    .enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'lunar-monthly', 'lunar-yearly'])
    .default('none'),
  lunar_day: z.number().int().min(1).max(30).nullable().default(null),
  lunar_month: z.number().int().min(1).max(12).nullable().default(null),
  reminder_minutes: z.number().int().min(0).max(10080).nullable().default(15)
})

export type EventInput = z.infer<typeof eventInputSchema>

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập nội dung công việc').max(200),
  due_date: dateISOSchema.nullable().default(null),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().max(1000).default('')
})

export type TaskInput = z.infer<typeof taskInputSchema>

export const habitInputSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên thói quen').max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#0D7A5F'),
  target_days_per_week: z.number().int().min(1).max(7).default(7)
})

export type HabitInput = z.infer<typeof habitInputSchema>

export const dailyNoteInputSchema = z.object({
  note_date: dateISOSchema,
  content: z.string().max(50000).default(''),
  mood: z.enum(['great', 'good', 'neutral', 'low', 'stressed']).nullable().default(null)
})

export type DailyNoteInput = z.infer<typeof dailyNoteInputSchema>

export const financeTransactionInputSchema = z.object({
  tx_date: dateISOSchema,
  kind: z.enum(['income', 'expense']),
  amount: z.number().finite().positive('Số tiền phải lớn hơn 0').max(999_999_999_999),
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục').max(60),
  note: z.string().max(300).default('')
})

export type FinanceTransactionInput = z.infer<typeof financeTransactionInputSchema>

export const goalInputSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên mục tiêu').max(160),
  target_date: dateISOSchema.nullable().default(null),
  progress: z.number().int().min(0).max(100).default(0),
  status: z.enum(['active', 'completed', 'paused']).default('active')
})

export type GoalInput = z.infer<typeof goalInputSchema>

export const countdownInputSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên sự kiện đếm ngược').max(120),
  target_date: dateISOSchema,
  is_lunar: z.boolean().default(false),
  lunar_day: z.number().int().min(1).max(30).nullable().default(null),
  lunar_month: z.number().int().min(1).max(12).nullable().default(null),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#D9381E'),
  pinned: z.boolean().default(true)
})

export type CountdownInput = z.infer<typeof countdownInputSchema>

export const backupFileSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    calendar_events: z.array(z.record(z.unknown())).default([]),
    tasks: z.array(z.record(z.unknown())).default([]),
    habits: z.array(z.record(z.unknown())).default([]),
    habit_logs: z.array(z.record(z.unknown())).default([]),
    daily_notes: z.array(z.record(z.unknown())).default([]),
    finance_transactions: z.array(z.record(z.unknown())).default([]),
    goals: z.array(z.record(z.unknown())).default([]),
    countdowns: z.array(z.record(z.unknown())).default([])
  })
})

export const yearLayoutSchema = z.object({
  startYear: z.number().int().min(1900).max(2100).default(new Date().getFullYear()),
  startMonth: z.number().int().min(1).max(12).default(1),
  customOrder: z.array(z.string().regex(/^\d{4}-\d{2}$/)).default([]),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4)
})

export const themePresetSchema = z.enum([
  'vermilion-light',
  'pure-light',
  'obsidian-dark',
  'midnight-dark',
  'aurora-night',
  'nordic-sea',
  'vintage-paper',
  'monochrome',
  'jade-forest',
  'forest-night'
])

export const fontSizeScaleSchema = z.enum(['small', 'medium', 'large', 'xlarge'])
export const buttonRadiusStyleSchema = z.enum(['rounded', 'pill', 'sharp'])

export const appSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  themePreset: themePresetSchema.default('vermilion-light'),
  fontSizeScale: fontSizeScaleSchema.default('medium'),
  buttonRadiusStyle: buttonRadiusStyleSchema.default('rounded'),
  customAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().default(null),
  enabledModules: z.object({
    calendar: z.literal(true).default(true),
    'lunar-countdown': z.boolean().default(true),
    'tasks-habits': z.boolean().default(true),
    'daily-notes': z.boolean().default(true),
    'finance-goals': z.boolean().default(true)
  }),
  showLunarInGrid: z.boolean().default(true),
  yearLayout: yearLayoutSchema.default({
    startYear: new Date().getFullYear(),
    startMonth: 1,
    customOrder: [],
    columns: 4
  }),
  widgetVisible: z.boolean().default(false),
  widgetAlwaysOnTop: z.boolean().default(true),
  widgetOpacity: z.number().min(0.6).max(1).default(0.96),
  supabaseUrl: z.string().default(''),
  supabaseAnonKey: z.string().default('')
})
