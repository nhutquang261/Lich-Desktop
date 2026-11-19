import { useEffect, useState } from 'react'
import { MoonStars, Trash, X } from '@phosphor-icons/react'
import { getLunarInfoFromISO } from '@shared/lunar/lunarCalendar'
import { eventInputSchema, type EventInput } from '@shared/schemas'
import {
  EVENT_CATEGORY_META,
  type CalendarEvent,
  type EventCategory,
  type RecurrenceRule
} from '@shared/types'

interface EventModalProps {
  open: boolean
  initialDateISO: string
  editingEvent: CalendarEvent | null
  onClose: () => void
  onSave: (input: EventInput, editingId?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const RECURRENCE_OPTIONS: Array<{ value: RecurrenceRule; label: string }> = [
  { value: 'none', label: 'Không lặp lại' },
  { value: 'daily', label: 'Hằng ngày' },
  { value: 'weekly', label: 'Hằng tuần' },
  { value: 'monthly', label: 'Hằng tháng (Dương lịch)' },
  { value: 'yearly', label: 'Hằng năm (Dương lịch)' },
  { value: 'lunar-monthly', label: 'Hằng tháng (Âm lịch)' },
  { value: 'lunar-yearly', label: 'Hằng năm (Âm lịch — Giỗ, Tết...)' }
]

const REMINDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'none', label: 'Không nhắc' },
  { value: '0', label: 'Đúng giờ diễn ra' },
  { value: '10', label: 'Trước 10 phút' },
  { value: '15', label: 'Trước 15 phút' },
  { value: '30', label: 'Trước 30 phút' },
  { value: '60', label: 'Trước 1 giờ' },
  { value: '1440', label: 'Trước 1 ngày' }
]

export function EventModal({
  open,
  initialDateISO,
  editingEvent,
  onClose,
  onSave,
  onDelete
}: EventModalProps): React.JSX.Element | null {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(initialDateISO)
  const [endDate, setEndDate] = useState(initialDateISO)
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState<EventCategory>('personal')
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none')
  const [reminder, setReminder] = useState<string>('15')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editingEvent) {
      setTitle(editingEvent.title)
      setDescription(editingEvent.description)
      setStartDate(editingEvent.start_date)
      setEndDate(editingEvent.end_date)
      setAllDay(editingEvent.all_day)
      setStartTime(editingEvent.start_time ?? '09:00')
      setEndTime(editingEvent.end_time ?? '10:00')
      setCategory(editingEvent.category)
      setRecurrence(editingEvent.recurrence)
      setReminder(
        editingEvent.reminder_minutes === null ? 'none' : String(editingEvent.reminder_minutes)
      )
    } else {
      setTitle('')
      setDescription('')
      setStartDate(initialDateISO)
      setEndDate(initialDateISO)
      setAllDay(false)
      setStartTime('09:00')
      setEndTime('10:00')
      setCategory('personal')
      setRecurrence('none')
      setReminder('15')
    }
    setError(null)
  }, [open, editingEvent, initialDateISO])

  if (!open) return null

  const lunarPreview = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
    ? getLunarInfoFromISO(startDate)
    : null

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    const effectiveEndDate = endDate < startDate ? startDate : endDate
    const rawInput: EventInput = {
      title,
      description,
      start_date: startDate,
      end_date: effectiveEndDate,
      all_day: allDay,
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      category,
      color: EVENT_CATEGORY_META[category].color,
      recurrence,
      lunar_day:
        recurrence === 'lunar-monthly' || recurrence === 'lunar-yearly'
          ? (lunarPreview?.day ?? null)
          : null,
      lunar_month: recurrence === 'lunar-yearly' ? (lunarPreview?.month ?? null) : null,
      reminder_minutes: reminder === 'none' ? null : Number(reminder)
    }

    const parsed = eventInputSchema.safeParse(rawInput)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dữ liệu sự kiện chưa hợp lệ')
      return
    }

    setSaving(true)
    try {
      await onSave(parsed.data, editingEvent?.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu sự kiện')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-[10px] border border-hairline bg-paper shadow-[0_20px_50px_-12px_rgba(17,19,21,0.35)] dark:border-obsidian-border dark:bg-obsidian-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5 dark:border-obsidian-border">
          <h2
            id="event-modal-title"
            className="text-[15px] font-semibold text-ink dark:text-obsidian-ink"
          >
            {editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-[2px] p-1 text-ink-muted hover:bg-black/[0.05] hover:text-ink dark:text-obsidian-muted dark:hover:bg-white/[0.06] dark:hover:text-obsidian-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="ev-title"
              className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
            >
              Tiêu đề sự kiện
            </label>
            <input
              id="ev-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Họp dự án, Sinh nhật mẹ, Cúng Rằm..."
              className="w-full rounded-[2px] border border-hairline bg-paper px-3 py-2 text-[13.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ev-start-date"
                className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
              >
                Ngày bắt đầu
              </label>
              <input
                id="ev-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (endDate < e.target.value) setEndDate(e.target.value)
                }}
                className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              />
            </div>
            <div>
              <label
                htmlFor="ev-end-date"
                className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
              >
                Ngày kết thúc
              </label>
              <input
                id="ev-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              />
            </div>
          </div>

          {/* All-day & Time */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink dark:text-obsidian-ink">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 accent-vermilion"
              />
              <span>Cả ngày</span>
            </label>
            {!allDay && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  aria-label="Giờ bắt đầu"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="font-mono-tabular rounded-[2px] border border-hairline bg-paper px-2 py-1 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                />
                <span className="text-xs text-ink-muted">đến</span>
                <input
                  type="time"
                  aria-label="Giờ kết thúc"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="font-mono-tabular rounded-[2px] border border-hairline bg-paper px-2 py-1 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink">
              Danh mục
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map((cat) => {
                const meta = EVENT_CATEGORY_META[cat]
                const selected = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      selected
                        ? 'border-ink bg-ink text-white dark:border-obsidian-ink dark:bg-obsidian-ink dark:text-obsidian'
                        : 'border-hairline bg-paper-subtle text-ink hover:border-ink/40 dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recurrence & Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ev-recurrence"
                className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
              >
                Lặp lại
              </label>
              <select
                id="ev-recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceRule)}
                className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-2 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ev-reminder"
                className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
              >
                Nhắc nhở Windows
              </label>
              <select
                id="ev-reminder"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-2 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(recurrence === 'lunar-monthly' || recurrence === 'lunar-yearly') && lunarPreview && (
            <div className="flex items-center gap-2 rounded-[2px] border border-vermilion/30 bg-vermilion-soft px-3 py-2 text-[12px] text-vermilion dark:bg-vermilion/15 dark:text-[#F4725B]">
              <MoonStars size={16} weight="fill" className="shrink-0" />
              <span>
                Tự động lặp theo Âm lịch:{' '}
                <strong className="font-mono-tabular">
                  {recurrence === 'lunar-monthly'
                    ? `Ngày ${lunarPreview.day} Âm lịch hàng tháng`
                    : `Ngày ${lunarPreview.day}/${lunarPreview.month} Âm lịch hàng năm`}
                </strong>
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor="ev-desc"
              className="mb-1.5 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
            >
              Ghi chú
            </label>
            <textarea
              id="ev-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Địa điểm, nội dung cần chuẩn bị..."
              className="w-full resize-none rounded-[2px] border border-hairline bg-paper px-3 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
          </div>

          {error && <p className="text-[12.5px] font-medium text-[#C81E1E]">{error}</p>}

          <div className="flex items-center justify-between border-t border-hairline pt-3.5 dark:border-obsidian-border">
            {editingEvent && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  void onDelete(editingEvent.id).then(onClose)
                }}
                className="flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 text-[12.5px] font-medium text-[#C81E1E] hover:bg-[#C81E1E]/10"
              >
                <Trash size={15} />
                <span>Xóa sự kiện</span>
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[2px] border border-hairline bg-paper-subtle px-3.5 py-1.5 text-[13px] font-medium text-ink hover:bg-black/[0.04] dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-[2px] bg-vermilion px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-vermilion-hover active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : editingEvent ? 'Cập nhật' : 'Tạo sự kiện'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
