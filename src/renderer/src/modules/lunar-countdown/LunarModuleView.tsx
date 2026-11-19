import { useMemo, useState } from 'react'
import {
  ArrowsLeftRight,
  CalendarBlank,
  HourglassHigh,
  MoonStars,
  Plus,
  PushPin,
  Trash
} from '@phosphor-icons/react'
import { formatISODate } from '@shared/calendar/recurrence'
import { resolveCountdown } from '@shared/countdown/countdownMath'
import {
  convertLunarToSolar,
  convertSolarToLunar,
  getLunarInfoFromISO
} from '@shared/lunar/lunarCalendar'
import { useAppStore } from '@renderer/core/store/useAppStore'

const KEY_LUNAR_EVENTS = [
  { name: 'Tết Nguyên Đán (Mùng 1)', day: 1, month: 1 },
  { name: 'Rằm Tháng Giêng (Tết Nguyên Tiêu)', day: 15, month: 1 },
  { name: 'Tết Hàn Thực', day: 3, month: 3 },
  { name: 'Giỗ Tổ Hùng Vương', day: 10, month: 3 },
  { name: 'Lễ Phật Đản', day: 15, month: 4 },
  { name: 'Tết Đoan Ngọ', day: 5, month: 5 },
  { name: 'Lễ Vu Lan', day: 15, month: 7 },
  { name: 'Tết Trung Thu', day: 15, month: 8 },
  { name: 'Ông Công Ông Táo', day: 23, month: 12 }
] as const

const COUNTDOWN_SWATCHES = ['#D9381E', '#0D7A5F', '#C67D08', '#334155', '#C2410C'] as const

export function LunarModuleView(): React.JSX.Element {
  const {
    countdowns,
    addCountdown,
    togglePinCountdown,
    removeCountdown,
    setSelectedDate,
    setActiveView
  } = useAppStore()
  const todayISO = formatISODate(new Date())
  const todayYear = Number(todayISO.slice(0, 4))

  // Countdown form state
  const [cdTitle, setCdTitle] = useState('')
  const [cdIsLunar, setCdIsLunar] = useState(false)
  const [cdSolarDate, setCdSolarDate] = useState(todayISO)
  const [cdLunarDay, setCdLunarDay] = useState(1)
  const [cdLunarMonth, setCdLunarMonth] = useState(1)
  const [cdColor, setCdColor] = useState<string>(COUNTDOWN_SWATCHES[0])

  // Converter state
  const [solarInput, setSolarInput] = useState(todayISO)
  const [lunarDay, setLunarDay] = useState(15)
  const [lunarMonth, setLunarMonth] = useState(8)
  const [lunarYear, setLunarYear] = useState(todayYear)

  const resolvedCountdowns = useMemo(() => {
    return countdowns
      .map((item) => resolveCountdown(item, todayISO))
      .sort((a, b) => Number(b.item.pinned) - Number(a.item.pinned) || a.daysRemaining - b.daysRemaining)
  }, [countdowns, todayISO])

  const handleAddCountdown = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = cdTitle.trim()
    if (!trimmed) return

    let targetDate = cdSolarDate
    if (cdIsLunar) {
      const todayLunar = getLunarInfoFromISO(todayISO)
      const solar = convertLunarToSolar(cdLunarDay, cdLunarMonth, todayLunar.year, false)
      targetDate = solar
        ? `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
        : todayISO
    }

    await addCountdown({
      title: trimmed,
      target_date: targetDate,
      is_lunar: cdIsLunar,
      lunar_day: cdIsLunar ? cdLunarDay : null,
      lunar_month: cdIsLunar ? cdLunarMonth : null,
      color: cdColor,
      pinned: true
    })
    setCdTitle('')
  }

  const convertedLunar = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(solarInput)) return null
    return getLunarInfoFromISO(solarInput)
  }, [solarInput])

  const convertedSolar = useMemo(() => {
    const res = convertLunarToSolar(lunarDay, lunarMonth, lunarYear, false)
    if (!res) return null
    return `${res.year}-${String(res.month).padStart(2, '0')}-${String(res.day).padStart(2, '0')}`
  }, [lunarDay, lunarMonth, lunarYear])

  const upcomingLunarHolidays = useMemo(() => {
    const todayLunar = convertSolarToLunar(
      Number(todayISO.slice(8, 10)),
      Number(todayISO.slice(5, 7)),
      todayYear
    )
    const baseYear = todayLunar.year
    return KEY_LUNAR_EVENTS.map((item) => {
      let solar = convertLunarToSolar(item.day, item.month, baseYear, false)
      let iso = solar
        ? `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
        : ''
      if (iso && iso < todayISO) {
        solar = convertLunarToSolar(item.day, item.month, baseYear + 1, false)
        iso = solar
          ? `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
          : ''
      }
      const diffMs = iso ? Date.parse(iso) - Date.parse(todayISO) : 0
      const daysLeft = Math.round(diffMs / 86_400_000)
      return { ...item, solarISO: iso, daysLeft }
    }).sort((a, b) => a.daysLeft - b.daysLeft)
  }, [todayISO, todayYear])

  return (
    <div className="flex-1 overflow-y-auto bg-paper-subtle p-6 dark:bg-obsidian">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-hairline pb-4 dark:border-obsidian-border">
          <div className="flex items-center gap-2 text-vermilion">
            <MoonStars size={20} weight="fill" />
            <h1 className="text-[20px] font-bold tracking-tight text-ink dark:text-obsidian-ink">
              Âm lịch Việt Nam & Đếm ngược sự kiện
            </h1>
          </div>
          <p className="mt-1 text-[13px] text-ink-muted dark:text-obsidian-muted">
            Tạo thẻ đếm ngược theo cả Dương lịch lẫn Âm lịch (tự ghim lên đầu Lịch & Floating
            Widget), kèm công cụ quy đổi Âm–Dương chuẩn UTC+7.
          </p>
        </header>

        {/* Custom Countdowns Section */}
        <section className="space-y-4 rounded-[2px] border border-hairline bg-paper p-5 dark:border-obsidian-border dark:bg-obsidian-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HourglassHigh size={17} weight="fill" className="text-vermilion" />
              <h2 className="text-[14.5px] font-semibold text-ink dark:text-obsidian-ink">
                Đếm ngược của bạn ({resolvedCountdowns.length})
              </h2>
            </div>
            <span className="font-mono-tabular text-[11px] text-jade">
              Các mục có Ghim sẽ hiện trên Lịch & Widget
            </span>
          </div>

          {/* Add Countdown Form */}
          <form
            onSubmit={(e) => void handleAddCountdown(e)}
            className="flex flex-wrap items-end gap-3 rounded-[2px] border border-hairline bg-paper-subtle p-3.5 dark:border-obsidian-border dark:bg-obsidian-elevated"
          >
            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="cd-title"
                className="mb-1 block text-[11.5px] font-semibold text-ink dark:text-obsidian-ink"
              >
                Tên sự kiện đếm ngược
              </label>
              <input
                id="cd-title"
                type="text"
                value={cdTitle}
                onChange={(e) => setCdTitle(e.target.value)}
                placeholder="Ví dụ: Kỳ nghỉ hè, Sinh nhật, Ngày cưới..."
                className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
              />
            </div>

            <div>
              <span className="mb-1 block text-[11.5px] font-semibold text-ink dark:text-obsidian-ink">
                Loại lịch
              </span>
              <div className="flex rounded-[2px] border border-hairline bg-paper p-0.5 dark:border-obsidian-border dark:bg-obsidian-surface">
                <button
                  type="button"
                  onClick={() => setCdIsLunar(false)}
                  className={`rounded-[2px] px-2.5 py-1 text-[11.5px] font-medium ${
                    !cdIsLunar
                      ? 'bg-ink text-white dark:bg-obsidian-ink dark:text-obsidian'
                      : 'text-ink-muted dark:text-obsidian-muted'
                  }`}
                >
                  Dương lịch
                </button>
                <button
                  type="button"
                  onClick={() => setCdIsLunar(true)}
                  className={`rounded-[2px] px-2.5 py-1 text-[11.5px] font-medium ${
                    cdIsLunar
                      ? 'bg-vermilion text-white'
                      : 'text-ink-muted dark:text-obsidian-muted'
                  }`}
                >
                  Âm lịch
                </button>
              </div>
            </div>

            {!cdIsLunar ? (
              <div>
                <label
                  htmlFor="cd-solar"
                  className="mb-1 block text-[11.5px] font-semibold text-ink dark:text-obsidian-ink"
                >
                  Ngày đích
                </label>
                <input
                  id="cd-solar"
                  type="date"
                  value={cdSolarDate}
                  onChange={(e) => setCdSolarDate(e.target.value)}
                  className="font-mono-tabular rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
                />
              </div>
            ) : (
              <div className="flex items-end gap-1.5">
                <div>
                  <label
                    htmlFor="cd-lday"
                    className="mb-1 block text-[11.5px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Ngày ÂL
                  </label>
                  <input
                    id="cd-lday"
                    type="number"
                    min={1}
                    max={30}
                    value={cdLunarDay}
                    onChange={(e) => setCdLunarDay(Number(e.target.value))}
                    className="font-mono-tabular w-16 rounded-[2px] border border-hairline bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cd-lmonth"
                    className="mb-1 block text-[11.5px] font-semibold text-ink dark:text-obsidian-ink"
                  >
                    Tháng ÂL
                  </label>
                  <input
                    id="cd-lmonth"
                    type="number"
                    min={1}
                    max={12}
                    value={cdLunarMonth}
                    onChange={(e) => setCdLunarMonth(Number(e.target.value))}
                    className="font-mono-tabular w-16 rounded-[2px] border border-hairline bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 py-1.5">
              {COUNTDOWN_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Màu ${swatch}`}
                  onClick={() => setCdColor(swatch)}
                  className={`h-5 w-5 rounded-[2px] ${
                    cdColor === swatch
                      ? 'ring-2 ring-ink ring-offset-1 dark:ring-obsidian-ink'
                      : ''
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="flex items-center gap-1 rounded-[2px] bg-vermilion px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-vermilion-hover active:scale-[0.98]"
            >
              <Plus size={14} weight="bold" />
              <span>Thêm</span>
            </button>
          </form>

          {/* Countdown Cards */}
          {resolvedCountdowns.length === 0 ? (
            <p className="py-3 text-center text-[12.5px] text-ink-muted dark:text-obsidian-muted">
              Chưa có thẻ đếm ngược tùy chỉnh nào.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {resolvedCountdowns.map(({ item, resolvedSolarISO, daysRemaining, isPast }) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-[2px] border border-hairline bg-paper-subtle p-3.5 dark:border-obsidian-border dark:bg-obsidian-elevated"
                  style={{ borderLeftWidth: '3px', borderLeftColor: item.color }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink dark:text-obsidian-ink">
                        <span>{item.title}</span>
                        {item.is_lunar && (
                          <MoonStars size={13} weight="fill" className="text-vermilion" />
                        )}
                      </div>
                      <div className="font-mono-tabular mt-0.5 text-[11px] text-ink-muted dark:text-obsidian-muted">
                        {item.is_lunar && item.lunar_day && item.lunar_month
                          ? `${item.lunar_day}/${item.lunar_month} ÂL · ${resolvedSolarISO}`
                          : resolvedSolarISO}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void togglePinCountdown(item.id)}
                        title={item.pinned ? 'Bỏ ghim khỏi Lịch & Widget' : 'Ghim lên Lịch & Widget'}
                        className={`rounded-[2px] p-1 ${
                          item.pinned
                            ? 'text-vermilion'
                            : 'text-ink-muted hover:text-ink dark:text-obsidian-muted'
                        }`}
                      >
                        <PushPin size={14} weight={item.pinned ? 'fill' : 'regular'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeCountdown(item.id)}
                        aria-label="Xóa đếm ngược"
                        className="rounded-[2px] p-1 text-ink-muted hover:text-[#C81E1E]"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span
                      className="font-mono-tabular text-[22px] font-bold leading-none"
                      style={{ color: item.color }}
                    >
                      {daysRemaining === 0
                        ? 'Hôm nay'
                        : isPast
                          ? `Đã qua ${Math.abs(daysRemaining)} ngày`
                          : `${daysRemaining} ngày`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(resolvedSolarISO)
                        setActiveView('calendar')
                      }}
                      className="text-[11.5px] font-medium text-ink-muted hover:text-vermilion dark:text-obsidian-muted"
                    >
                      Xem lịch →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Converters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Solar -> Lunar */}
          <section className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink dark:text-obsidian-ink">
              <ArrowsLeftRight size={15} className="text-vermilion" />
              <span>Dương lịch → Âm lịch</span>
            </div>
            <label
              htmlFor="conv-solar"
              className="mb-1 block text-[12px] font-medium text-ink-muted dark:text-obsidian-muted"
            >
              Chọn ngày Dương lịch
            </label>
            <input
              id="conv-solar"
              type="date"
              value={solarInput}
              onChange={(e) => setSolarInput(e.target.value)}
              className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper-subtle px-3 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
            {convertedLunar && (
              <div className="mt-3 rounded-[2px] border border-hairline bg-paper-subtle p-3 dark:border-obsidian-border dark:bg-obsidian-elevated">
                <div className="font-mono-tabular text-[18px] font-bold text-vermilion">
                  {convertedLunar.fullLabel}
                </div>
                <div className="mt-1 text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                  Ngày {convertedLunar.canChiDay} · Tháng {convertedLunar.canChiMonth} · Năm{' '}
                  {convertedLunar.canChiYear}
                </div>
              </div>
            )}
          </section>

          {/* Lunar -> Solar */}
          <section className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink dark:text-obsidian-ink">
              <ArrowsLeftRight size={15} className="text-jade" />
              <span>Âm lịch → Dương lịch</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="conv-l-day"
                  className="mb-1 block text-[11.5px] text-ink-muted dark:text-obsidian-muted"
                >
                  Ngày ÂL
                </label>
                <input
                  id="conv-l-day"
                  type="number"
                  min={1}
                  max={30}
                  value={lunarDay}
                  onChange={(e) => setLunarDay(Number(e.target.value))}
                  className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="conv-l-month"
                  className="mb-1 block text-[11.5px] text-ink-muted dark:text-obsidian-muted"
                >
                  Tháng ÂL
                </label>
                <input
                  id="conv-l-month"
                  type="number"
                  min={1}
                  max={12}
                  value={lunarMonth}
                  onChange={(e) => setLunarMonth(Number(e.target.value))}
                  className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="conv-l-year"
                  className="mb-1 block text-[11.5px] text-ink-muted dark:text-obsidian-muted"
                >
                  Năm ÂL
                </label>
                <input
                  id="conv-l-year"
                  type="number"
                  min={1900}
                  max={2100}
                  value={lunarYear}
                  onChange={(e) => setLunarYear(Number(e.target.value))}
                  className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-2 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
                />
              </div>
            </div>
            {convertedSolar && (
              <div className="mt-3 flex items-center justify-between rounded-[2px] border border-hairline bg-paper-subtle p-3 dark:border-obsidian-border dark:bg-obsidian-elevated">
                <div>
                  <div className="text-[11px] text-ink-muted dark:text-obsidian-muted">
                    Tương ứng Dương lịch
                  </div>
                  <div className="font-mono-tabular text-[18px] font-bold text-jade">
                    {convertedSolar}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(convertedSolar)
                    setActiveView('calendar')
                  }}
                  className="flex items-center gap-1 rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-vermilion hover:text-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
                >
                  <CalendarBlank size={14} />
                  <span>Xem trên lịch</span>
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Upcoming Traditional Holidays */}
        <section className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
          <h2 className="mb-3 text-[14px] font-semibold text-ink dark:text-obsidian-ink">
            Ngày lễ Âm lịch sắp tới
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingLunarHolidays.map((h) => (
              <button
                key={h.name}
                type="button"
                onClick={() => {
                  if (!h.solarISO) return
                  setSelectedDate(h.solarISO)
                  setActiveView('calendar')
                }}
                className="flex flex-col justify-between rounded-[2px] border border-hairline bg-paper-subtle p-3 text-left transition-colors hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated"
              >
                <div className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
                  {h.name}
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono-tabular text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                    {h.day}/{h.month} ÂL · {h.solarISO}
                  </span>
                  <span className="font-mono-tabular rounded-[2px] bg-vermilion-soft px-1.5 py-0.5 text-[11px] font-bold text-vermilion dark:bg-vermilion/20 dark:text-[#F4725B]">
                    {h.daysLeft === 0 ? 'Hôm nay' : `Còn ${h.daysLeft} ngày`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
