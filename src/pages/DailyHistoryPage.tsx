import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { CategoryIconBox } from '../components/CategoryBadge';
import type { BudgetMetrics, CurrencyCode, Expense } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatRelativeDayLabel, formatTime12h, getTodayISO } from '../utils/dates';

interface DailyHistoryPageProps {
  expenses: Expense[];
  activeMetrics: BudgetMetrics | null;
  currency: CurrencyCode;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
}

interface DayGroup {
  date: string;
  expenses: Expense[];
  totalSpent: number;
  dailyAllowance: number | null;
  remainingAllowance: number | null;
  withinBudget: boolean | null;
}

export const DailyHistoryPage: React.FC<DailyHistoryPageProps> = ({
  expenses,
  activeMetrics,
  currency,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const todayISO = getTodayISO();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    [todayISO]: true,
  });

  const dayGroups = useMemo<DayGroup[]>(() => {
    const allowanceByDate = new Map<
      string,
      { allowance: number; remaining: number; withinBudget: boolean }
    >();
    if (activeMetrics) {
      for (const point of activeMetrics.dailyHistory) {
        allowanceByDate.set(point.date, {
          allowance: point.allowance,
          remaining: point.remaining,
          withinBudget: point.withinBudget,
        });
      }
    }

    const byDate = new Map<string, Expense[]>();
    for (const exp of expenses) {
      const arr = byDate.get(exp.date);
      if (arr) {
        arr.push(exp);
      } else {
        byDate.set(exp.date, [exp]);
      }
    }

    // Ensure dates in activeMetrics with expenses or today are visible cleanly
    const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

    return dates.map((date) => {
      const list = (byDate.get(date) ?? [])
        .slice()
        .sort((a, b) => b.time.localeCompare(a.time));
      const totalSpent = list.reduce((sum, e) => sum + e.amount, 0);
      const allowanceMeta = allowanceByDate.get(date);

      return {
        date,
        expenses: list,
        totalSpent,
        dailyAllowance: allowanceMeta ? allowanceMeta.allowance : null,
        remainingAllowance: allowanceMeta ? allowanceMeta.remaining : null,
        withinBudget: allowanceMeta ? allowanceMeta.withinBudget : null,
      };
    });
  }, [expenses, activeMetrics]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const g of dayGroups) next[g.date] = true;
    setExpandedDates(next);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Daily Expense History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Expenses grouped by day with dynamic daily allowance comparison
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dayGroups.length > 0 && (
            <>
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 text-xs font-medium"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 text-xs font-medium"
              >
                Collapse All
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {dayGroups.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-10 text-center">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-400 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-semibold">No daily expenses recorded yet</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Add expenses to see day-by-day spending totals and budget status.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayGroups.map((group) => {
            const isExpanded = Boolean(expandedDates[group.date]);
            const cur = activeMetrics?.budget.currency ?? currency;

            return (
              <div
                key={group.date}
                className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleDate(group.date)}
                  className="w-full px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-bold tracking-tight">
                        {formatRelativeDayLabel(group.date, todayISO)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {group.expenses.length}{' '}
                        {group.expenses.length === 1 ? 'expense' : 'expenses'}
                        {group.dailyAllowance !== null && (
                          <>
                            {' '}
                            · Allowance:{' '}
                            <span className="font-mono">
                              {formatCurrency(group.dailyAllowance, cur, {
                                decimals: 0,
                              })}
                            </span>
                            {' · '}
                            {group.remainingAllowance !== null &&
                              (group.remainingAllowance >= 0 ? (
                                <span className="text-emerald-500 font-medium">
                                  {formatCurrency(group.remainingAllowance, cur, {
                                    decimals: 0,
                                  })}{' '}
                                  left
                                </span>
                              ) : (
                                <span className="text-red-500 font-medium">
                                  {formatCurrency(
                                    Math.abs(group.remainingAllowance),
                                    cur,
                                    { decimals: 0 }
                                  )}{' '}
                                  over
                                </span>
                              ))}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-6 sm:pl-0">
                    {group.withinBudget !== null && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          group.withinBudget
                            ? 'bg-emerald-500/12 text-emerald-500 border-emerald-500/30'
                            : 'bg-red-500/12 text-red-500 border-red-500/30'
                        }`}
                      >
                        {group.withinBudget ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Within Budget
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Over Budget
                          </>
                        )}
                      </span>
                    )}
                    <span className="font-mono font-bold text-base">
                      {formatCurrency(group.totalSpent, cur, { decimals: 0 })}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 divide-y divide-slate-100 dark:divide-zinc-800/60 px-4 sm:px-5">
                    {group.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CategoryIconBox category={exp.category} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {exp.description}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {exp.category} · {formatTime12h(exp.time)}
                              {exp.paymentMethod ? ` · ${exp.paymentMethod}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-semibold text-sm mr-1">
                            {formatCurrency(exp.amount, cur, { decimals: 0 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => onEditExpense(exp)}
                            aria-label="Edit expense"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteExpense(exp.id)}
                            aria-label="Delete expense"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
