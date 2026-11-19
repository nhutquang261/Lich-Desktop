export type ModuleId =
  | 'calendar'
  | 'lunar-countdown'
  | 'tasks-habits'
  | 'daily-notes'
  | 'finance-goals'

export type ModuleMilestone = 'M1' | 'M2' | 'M3'

export interface ModuleDefinition {
  id: ModuleId
  name: string
  shortName: string
  description: string
  required: boolean
  milestone: ModuleMilestone
  defaultEnabled: boolean
}

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  {
    id: 'calendar',
    name: 'Lịch & Sự kiện',
    shortName: 'Lịch',
    description: 'Lưới lịch Tháng/Tuần/Ngày, sự kiện lặp Dương & Âm lịch, nhắc nhở Windows.',
    required: true,
    milestone: 'M1',
    defaultEnabled: true
  },
  {
    id: 'lunar-countdown',
    name: 'Âm lịch & Đếm ngược',
    shortName: 'Âm lịch',
    description: 'Âm lịch Việt Nam, Can Chi, ngày lễ truyền thống và đếm ngược sự kiện.',
    required: false,
    milestone: 'M1',
    defaultEnabled: true
  },
  {
    id: 'tasks-habits',
    name: 'Công việc & Thói quen',
    shortName: 'Công việc',
    description: 'To-do gắn ngày (đồng bộ Widget), Habit Tracker chuỗi ngày và Pomodoro.',
    required: false,
    milestone: 'M2',
    defaultEnabled: true
  },
  {
    id: 'daily-notes',
    name: 'Ghi chú & Tâm trạng',
    shortName: 'Nhật ký',
    description: 'Ghi chú Markdown theo ngày và theo dõi tâm trạng (Mood Tracker).',
    required: false,
    milestone: 'M2',
    defaultEnabled: true
  },
  {
    id: 'finance-goals',
    name: 'Thu chi & Mục tiêu',
    shortName: 'Tài chính',
    description: 'Sổ thu chi theo ngày, tổng kết tháng và theo dõi mục tiêu cá nhân.',
    required: false,
    milestone: 'M3',
    defaultEnabled: true
  }
] as const

export function getDefaultEnabledModules(): Record<ModuleId, boolean> {
  return {
    calendar: true,
    'lunar-countdown': true,
    'tasks-habits': true,
    'daily-notes': true,
    'finance-goals': true
  }
}
