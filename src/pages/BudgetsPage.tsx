import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import type { AppSettings, Budget, BudgetMetrics } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDisplayDate } from '../utils/dates';

interface BudgetsPageProps {
  allMetrics: BudgetMetrics[];
  activeBudgetId: string | null;
  settings: AppSettings;
  onCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => Promise<void>;
  onSetActive: (id: string) => Promise<void>;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  allMetrics,
  activeBudgetId,
  settings,
  onCreateBudget,
  onEditBudget,
  onDeleteBudget,
  onSetActive,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Create budgets for any duration (5, 7, 14, 30 days, full month, or
            custom range). Editing keeps all historical expenses intact.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateBudget}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Budget</span>
        </button>
      </div>

      {allMetrics.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-10 text-center">
          <Wallet className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
          <h2 className="text-base font-semibold">No budgets created yet</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Create your first budget to start tracking daily spending limits.
          </p>
          <button
            type="button"
            onClick={onCreateBudget}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allMetrics.map((m) => {
            const { budget } = m;
            const isActive = budget.id === activeBudgetId;
            const cur = budget.currency;
            const pct = Math.min(100, Math.max(0, m.usagePercentage));

            return (
              <div
                key={budget.id}
                className={`rounded-2xl bg-white dark:bg-[#12161c] border p-5 transition-colors ${
                  isActive
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-base truncate">
                        {budget.name}
                      </h3>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 capitalize">
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {formatDisplayDate(budget.startDate, settings.dateFormat)}{' '}
                      — {formatDisplayDate(budget.endDate, settings.dateFormat)}{' '}
                      ({m.totalDays} days)
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditBudget(budget)}
                      aria-label={`Edit ${budget.name}`}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(budget.id)}
                      aria-label={`Delete ${budget.name}`}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">
                      Total Money
                    </span>
                    <span className="font-mono font-semibold text-sm">
                      {formatCurrency(budget.totalMoney, cur, { decimals: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">
                      Savings Goal
                    </span>
                    <span className="font-mono font-semibold text-sm text-emerald-500">
                      {formatCurrency(budget.savingsGoal, cur, { decimals: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">
                      Spendable
                    </span>
                    <span className="font-mono font-semibold text-sm">
                      {formatCurrency(m.spendableBudget, cur, { decimals: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-zinc-400 block">
                      Spent
                    </span>
                    <span className="font-mono font-semibold text-sm">
                      {formatCurrency(m.totalExpenses, cur, { decimals: 0 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-zinc-400">
                      Initial: {formatCurrency(m.initialDailyBudget, cur, { decimals: 0 })}/day
                    </span>
                    <span className="font-mono font-medium">
                      {m.usagePercentage.toFixed(1)}% used
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.usagePercentage >= 90
                          ? 'bg-red-500'
                          : m.usagePercentage >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    {m.rawRemainingSpendable >= 0
                      ? `${formatCurrency(m.remainingSpendable, cur, {
                          decimals: 0,
                        })} remaining`
                      : `${formatCurrency(m.overspentTotal, cur, {
                          decimals: 0,
                        })} overspent`}
                  </span>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => void onSetActive(budget.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 transition-colors"
                    >
                      Set as Active
                    </button>
                  )}
                </div>

                {confirmDeleteId === budget.id && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-red-400">
                      Delete this budget? (Your logged expenses stay saved.)
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteBudget(budget.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500 text-white font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
