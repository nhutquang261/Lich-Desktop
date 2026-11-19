import { useState } from 'react'
import { Coins, Flag, Wallet } from '@phosphor-icons/react'
import { FinanceLedgerPanel } from './FinanceLedgerPanel'
import { GoalsPanel } from './GoalsPanel'

type FinanceTab = 'ledger' | 'goals'

export function FinanceGoalsView(): React.JSX.Element {
  const [tab, setTab] = useState<FinanceTab>('ledger')

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-paper-subtle dark:bg-obsidian">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-paper px-6 dark:border-obsidian-border dark:bg-obsidian-surface">
        <div className="flex items-center gap-2.5">
          <Coins size={20} weight="fill" className="text-vermilion" />
          <h1 className="text-[18px] font-bold tracking-tight text-ink dark:text-obsidian-ink">
            Thu chi theo ngày & Mục tiêu cá nhân
          </h1>
        </div>

        <div className="flex rounded-[2px] border border-hairline bg-paper-subtle p-0.5 dark:border-obsidian-border dark:bg-obsidian-elevated">
          {(
            [
              { id: 'ledger', label: 'Sổ thu chi', Icon: Wallet },
              { id: 'goals', label: 'Mục tiêu', Icon: Flag }
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-[12.5px] font-medium transition-colors ${
                tab === id
                  ? 'bg-paper text-ink shadow-xs dark:bg-obsidian-surface dark:text-obsidian-ink'
                  : 'text-ink-muted hover:text-ink dark:text-obsidian-muted dark:hover:text-obsidian-ink'
              }`}
            >
              <Icon size={14} weight={tab === id ? 'fill' : 'regular'} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          {tab === 'ledger' ? <FinanceLedgerPanel /> : <GoalsPanel />}
        </div>
      </div>
    </div>
  )
}
