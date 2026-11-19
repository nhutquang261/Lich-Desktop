import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Plus,
  Trash
} from '@phosphor-icons/react'
import { formatISODate } from '@shared/calendar/recurrence'
import { useAppStore } from '@renderer/core/store/useAppStore'
import { formatVnd } from './formatVnd'

const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Di chuyển',
  'Hóa đơn & Nhà ở',
  'Mua sắm',
  'Sức khỏe',
  'Học tập',
  'Giải trí',
  'Gia đình',
  'Khác'
] as const

const INCOME_CATEGORIES = ['Lương', 'Thưởng', 'Freelance', 'Đầu tư', 'Khác'] as const

export function FinanceLedgerPanel(): React.JSX.Element {
  const { transactions, selectedDateISO, addTransaction, removeTransaction } = useAppStore()
  const todayISO = formatISODate(new Date())

  const [monthKey, setMonthKey] = useState(todayISO.slice(0, 7)) // YYYY-MM
  const [txDate, setTxDate] = useState(selectedDateISO)
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amountInput, setAmountInput] = useState('')
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [yearNum, monthNum] = monthKey.split('-').map(Number)

  const shiftMonth = (delta: number): void => {
    const dt = new Date(yearNum, monthNum - 1 + delta, 1)
    setMonthKey(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => tx.tx_date.startsWith(monthKey))
        .sort((a, b) => b.tx_date.localeCompare(a.tx_date) || b.created_at.localeCompare(a.created_at)),
    [transactions, monthKey]
  )

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    const byCategory = new Map<string, number>()

    for (const tx of monthTransactions) {
      if (tx.kind === 'income') {
        income += tx.amount
      } else {
        expense += tx.amount
        byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount)
      }
    }

    const breakdown = Array.from(byCategory.entries())
      .map(([cat, total]) => ({
        category: cat,
        total,
        pct: expense > 0 ? Math.round((total / expense) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)

    return { income, expense, net: income - expense, breakdown }
  }, [monthTransactions])

  const handleKindChange = (nextKind: 'expense' | 'income'): void => {
    setKind(nextKind)
    setCategory(nextKind === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0])
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    const numeric = Number(amountInput.replace(/[.,\s]/g, ''))
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.')
      return
    }
    await addTransaction({
      tx_date: txDate,
      kind,
      amount: numeric,
      category,
      note: note.trim()
    })
    setAmountInput('')
    setNote('')
    setMonthKey(txDate.slice(0, 7))
  }

  const categories = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  return (
    <div className="space-y-5">
      {/* Month Switcher + KPI Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Tháng trước"
            className="rounded-[2px] border border-hairline bg-paper p-1.5 text-ink hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
          >
            <CaretLeft size={14} />
          </button>
          <span className="font-mono-tabular min-w-[118px] text-center text-[14px] font-bold text-ink dark:text-obsidian-ink">
            Tháng {String(monthNum).padStart(2, '0')}/{yearNum}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Tháng sau"
            className="rounded-[2px] border border-hairline bg-paper p-1.5 text-ink hover:border-vermilion dark:border-obsidian-border dark:bg-obsidian-surface dark:text-obsidian-ink"
          >
            <CaretRight size={14} />
          </button>
        </div>
        <span className="font-mono-tabular text-[11.5px] text-ink-muted dark:text-obsidian-muted">
          {monthTransactions.length} giao dịch trong tháng
        </span>
      </div>

      {/* 3 KPI Blocks */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
          <div className="flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
            <span>Tổng thu</span>
            <ArrowDownLeft size={15} className="text-jade" />
          </div>
          <div className="font-mono-tabular mt-1.5 text-[22px] font-bold text-jade">
            +{formatVnd(totals.income)}
          </div>
        </div>

        <div className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
          <div className="flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
            <span>Tổng chi</span>
            <ArrowUpRight size={15} className="text-vermilion" />
          </div>
          <div className="font-mono-tabular mt-1.5 text-[22px] font-bold text-vermilion">
            -{formatVnd(totals.expense)}
          </div>
        </div>

        <div className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-muted dark:text-obsidian-muted">
            Chênh lệch ròng
          </div>
          <div
            className={`font-mono-tabular mt-1.5 text-[22px] font-bold ${
              totals.net >= 0 ? 'text-jade' : 'text-vermilion'
            }`}
          >
            {totals.net >= 0 ? '+' : ''}
            {formatVnd(totals.net)}
          </div>
        </div>
      </div>

      {/* Quick Entry Form */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-3 rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <span className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink">
              Loại
            </span>
            <div className="flex rounded-[2px] border border-hairline bg-paper-subtle p-0.5 dark:border-obsidian-border dark:bg-obsidian-elevated">
              <button
                type="button"
                onClick={() => handleKindChange('expense')}
                className={`rounded-[2px] px-3 py-1 text-[12px] font-semibold ${
                  kind === 'expense'
                    ? 'bg-vermilion text-white'
                    : 'text-ink-muted hover:text-ink dark:text-obsidian-muted'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => handleKindChange('income')}
                className={`rounded-[2px] px-3 py-1 text-[12px] font-semibold ${
                  kind === 'income'
                    ? 'bg-jade text-white'
                    : 'text-ink-muted hover:text-ink dark:text-obsidian-muted'
                }`}
              >
                Thu nhập
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-date"
              className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
            >
              Ngày
            </label>
            <input
              id="tx-date"
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="font-mono-tabular rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
          </div>

          <div className="w-40">
            <label
              htmlFor="tx-amount"
              className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
            >
              Số tiền (VNĐ)
            </label>
            <input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="150000"
              className="font-mono-tabular w-full rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
          </div>

          <div>
            <label
              htmlFor="tx-cat"
              className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
            >
              Danh mục
            </label>
            <select
              id="tx-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[180px] flex-1">
            <label
              htmlFor="tx-note"
              className="mb-1 block text-[12px] font-semibold text-ink dark:text-obsidian-ink"
            >
              Ghi chú
            </label>
            <input
              id="tx-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cà phê sáng, tiền điện..."
              className="w-full rounded-[2px] border border-hairline bg-paper-subtle px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-vermilion dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-[2px] bg-vermilion px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-vermilion-hover active:scale-[0.98]"
          >
            <Plus size={14} weight="bold" />
            <span>Ghi sổ</span>
          </button>
        </div>

        {error && <p className="text-[12px] font-medium text-[#C81E1E]">{error}</p>}
      </form>

      {/* Breakdown + Ledger Split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Expense Category Breakdown */}
        <section className="rounded-[2px] border border-hairline bg-paper p-4 dark:border-obsidian-border dark:bg-obsidian-surface">
          <h2 className="mb-3 text-[13px] font-semibold text-ink dark:text-obsidian-ink">
            Cơ cấu chi tiêu tháng {String(monthNum).padStart(2, '0')}
          </h2>
          {totals.breakdown.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted dark:text-obsidian-muted">
              Chưa có khoản chi nào trong tháng này.
            </p>
          ) : (
            <div className="space-y-3">
              {totals.breakdown.map((row) => (
                <div key={row.category}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="font-medium text-ink dark:text-obsidian-ink">
                      {row.category}
                    </span>
                    <span className="font-mono-tabular text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                      {formatVnd(row.total)} ({row.pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-obsidian-border">
                    <div
                      className="h-full bg-vermilion"
                      style={{ width: `${Math.max(3, row.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions Table */}
        <section className="rounded-[2px] border border-hairline bg-paper lg:col-span-2 dark:border-obsidian-border dark:bg-obsidian-surface">
          <div className="border-b border-hairline px-4 py-3 dark:border-obsidian-border">
            <h2 className="text-[13px] font-semibold text-ink dark:text-obsidian-ink">
              Lịch sử giao dịch
            </h2>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-ink-muted dark:text-obsidian-muted">
              Chưa có giao dịch nào trong tháng {String(monthNum).padStart(2, '0')}/{yearNum}.
            </div>
          ) : (
            <ul className="divide-y divide-hairline dark:divide-obsidian-border">
              {monthTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="group flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-paper-subtle/60 dark:hover:bg-obsidian-elevated/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-[11.5px] text-ink-muted dark:text-obsidian-muted">
                        {tx.tx_date}
                      </span>
                      <span className="rounded-[2px] border border-hairline bg-paper-subtle px-1.5 py-0.5 text-[11px] font-medium text-ink dark:border-obsidian-border dark:bg-obsidian-elevated dark:text-obsidian-ink">
                        {tx.category}
                      </span>
                    </div>
                    {tx.note && (
                      <p className="mt-0.5 truncate text-[12.5px] text-ink-muted dark:text-obsidian-muted">
                        {tx.note}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`font-mono-tabular text-[13.5px] font-bold ${
                        tx.kind === 'income' ? 'text-jade' : 'text-vermilion'
                      }`}
                    >
                      {tx.kind === 'income' ? '+' : '-'}
                      {formatVnd(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeTransaction(tx.id)}
                      aria-label="Xóa giao dịch"
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-ink-muted hover:text-[#C81E1E]"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
