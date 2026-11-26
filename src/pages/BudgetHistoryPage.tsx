import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeftRight,
  ChevronRight,
  Edit3,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppSettings, Budget, BudgetMetrics, Expense } from '../types';
import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  formatCurrency,
} from '../utils/currency';
import { formatDisplayDate, formatShortDate } from '../utils/dates';

interface BudgetHistoryPageProps {
  allMetrics: BudgetMetrics[];
  expenses: Expense[];
  settings: AppSettings;
  onEditBudget: (budget: Budget) => void;
}

export const BudgetHistoryPage: React.FC<BudgetHistoryPageProps> = ({
  allMetrics,
  expenses,
  settings,
  onEditBudget,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    allMetrics[0]?.budget.id ?? null
  );
  const [compareA, setCompareA] = useState<string>(allMetrics[0]?.budget.id ?? '');
  const [compareB, setCompareB] = useState<string>(allMetrics[1]?.budget.id ?? '');

  const selectedReport = useMemo(
    () => allMetrics.find((m) => m.budget.id === selectedId) ?? null,
    [allMetrics, selectedId]
  );

  // Month-by-month summary directly from stored expenses & budgets
  const monthlySummaries = useMemo(() => {
    const map = new Map<
      string,
      { monthKey: string; label: string; spent: number; count: number; budgetsCount: number }
    >();

    for (const exp of expenses) {
      const monthKey = exp.date.slice(0, 7); // YYYY-MM
      const [y, m] = monthKey.split('-').map(Number);
      const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      const prev = map.get(monthKey) ?? {
        monthKey,
        label,
        spent: 0,
        count: 0,
        budgetsCount: 0,
      };
      prev.spent += exp.amount;
      prev.count += 1;
      map.set(monthKey, prev);
    }

    for (const m of allMetrics) {
      const monthKey = m.budget.startDate.slice(0, 7);
      const [y, mo] = monthKey.split('-').map(Number);
      const label = new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      const prev = map.get(monthKey) ?? {
        monthKey,
        label,
        spent: 0,
        count: 0,
        budgetsCount: 0,
      };
      prev.budgetsCount += 1;
      map.set(monthKey, prev);
    }

    return Array.from(map.values()).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    );
  }, [expenses, allMetrics]);

  // Budget Comparison Data
  const comparisonData = useMemo(() => {
    const mA = allMetrics.find((m) => m.budget.id === compareA);
    const mB = allMetrics.find((m) => m.budget.id === compareB);
    if (!mA || !mB) return null;

    const categoryRows = EXPENSE_CATEGORIES.map((cat) => {
      const aAmt =
        mA.categoryBreakdown.find((c) => c.category === cat)?.amount ?? 0;
      const bAmt =
        mB.categoryBreakdown.find((c) => c.category === cat)?.amount ?? 0;
      return {
        category: cat,
        [mA.budget.name]: Math.round(aAmt),
        [mB.budget.name]: Math.round(bAmt),
        aAmt,
        bAmt,
      };
    }).filter((r) => r.aAmt > 0 || r.bAmt > 0);

    return { mA, mB, categoryRows };
  }, [allMetrics, compareA, compareB]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Budget History & Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Every past and current budget stays preserved. Inspect detailed
          reports or compare budgets side-by-side.
        </p>
      </div>

      {allMetrics.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-10 text-center">
          <Archive className="w-10 h-10 mx-auto text-slate-400 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-semibold">No budget history yet</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            All budgets you create will remain archived here with full reports.
          </p>
        </div>
      ) : (
        <>
          {/* All Budgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMetrics.map((m) => {
              const cur = m.budget.currency;
              const isSelected = selectedId === m.budget.id;

              return (
                <div
                  key={m.budget.id}
                  onClick={() => setSelectedId(m.budget.id)}
                  className={`cursor-pointer rounded-2xl bg-white dark:bg-[#12161c] border p-4 transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500/25'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {m.budget.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {formatDisplayDate(
                          m.budget.startDate,
                          settings.dateFormat
                        )}{' '}
                        —{' '}
                        {formatDisplayDate(
                          m.budget.endDate,
                          settings.dateFormat
                        )}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {m.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Money received
                      </span>
                      <span className="font-mono font-medium">
                        {formatCurrency(m.budget.totalMoney, cur, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Savings target
                      </span>
                      <span className="font-mono text-emerald-500">
                        {formatCurrency(m.budget.savingsGoal, cur, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Total spent ({m.usagePercentage.toFixed(0)}%)
                      </span>
                      <span className="font-mono font-medium">
                        {formatCurrency(m.totalExpenses, cur, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Actual saved
                      </span>
                      <span className="font-mono font-semibold text-emerald-500">
                        {formatCurrency(m.actualSavings, cur, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Remaining balance
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          m.rawRemainingSpendable < 0
                            ? 'text-red-500'
                            : 'text-slate-900 dark:text-zinc-100'
                        }`}
                      >
                        {formatCurrency(m.remainingSpendable, cur, { decimals: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-medium text-emerald-500">
                    <span>View Detailed Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Detailed Report */}
          {selectedReport && (
            <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-500">
                    Detailed Budget Report
                  </span>
                  <h2 className="text-lg font-bold mt-0.5">
                    {selectedReport.budget.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {formatDisplayDate(
                      selectedReport.budget.startDate,
                      settings.dateFormat
                    )}{' '}
                    to{' '}
                    {formatDisplayDate(
                      selectedReport.budget.endDate,
                      settings.dateFormat
                    )}{' '}
                    · {selectedReport.totalDays} days
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditBudget(selectedReport.budget)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-medium hover:bg-slate-200 dark:hover:bg-zinc-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Budget</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close report"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Report KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <ReportStat
                  label="Spending Budget"
                  value={formatCurrency(
                    selectedReport.spendableBudget,
                    selectedReport.budget.currency,
                    { decimals: 0 }
                  )}
                />
                <ReportStat
                  label="Total Expenses"
                  value={formatCurrency(
                    selectedReport.totalExpenses,
                    selectedReport.budget.currency,
                    { decimals: 0 }
                  )}
                />
                <ReportStat
                  label="Actual Saved Money"
                  value={formatCurrency(
                    selectedReport.actualSavings,
                    selectedReport.budget.currency,
                    { decimals: 0 }
                  )}
                />
                <ReportStat
                  label="Avg Daily Spend"
                  value={`${formatCurrency(
                    selectedReport.averageDailySpending,
                    selectedReport.budget.currency,
                    { decimals: 0 }
                  )}/day`}
                />
              </div>

              {/* Category Breakdown & Daily Spending */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Category-wise Spending
                  </h3>
                  {selectedReport.categoryBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      No expenses recorded inside this budget.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedReport.categoryBreakdown.map((c) => (
                        <div key={c.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>
                              {c.category} ({c.count})
                            </span>
                            <span className="font-mono font-semibold">
                              {formatCurrency(
                                c.amount,
                                selectedReport.budget.currency,
                                { decimals: 0 }
                              )}{' '}
                              ({c.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, c.percentage)}%`,
                                backgroundColor: CATEGORY_COLORS[c.category],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Daily Spending History
                  </h3>
                  {selectedReport.dailyHistory.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Budget has not started yet.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/70 pr-1">
                      {selectedReport.dailyHistory
                        .slice()
                        .reverse()
                        .map((day) => (
                          <div
                            key={day.date}
                            className="py-2 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-medium">
                                {formatShortDate(day.date)}
                              </span>
                              <span className="text-slate-500 dark:text-zinc-400 ml-2">
                                Limit:{' '}
                                {formatCurrency(
                                  day.allowance,
                                  selectedReport.budget.currency,
                                  { decimals: 0 }
                                )}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-semibold ${
                                day.withinBudget
                                  ? 'text-emerald-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {formatCurrency(
                                day.spent,
                                selectedReport.budget.currency,
                                { decimals: 0 }
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Overview */}
          {monthlySummaries.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
              <h2 className="text-sm font-semibold mb-3">Monthly Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthlySummaries.map((m) => (
                  <div
                    key={m.monthKey}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {m.count} expenses · {m.budgetsCount}{' '}
                        {m.budgetsCount === 1 ? 'budget' : 'budgets'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      {formatCurrency(m.spent, settings.currency, {
                        decimals: 0,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Comparison Tool */}
          {allMetrics.length >= 2 && (
            <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold">
                    Compare Two Budgets
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    aria-label="First budget to compare"
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs"
                  >
                    {allMetrics.map((m) => (
                      <option key={m.budget.id} value={m.budget.id}>
                        {m.budget.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">vs</span>
                  <select
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    aria-label="Second budget to compare"
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs"
                  >
                    {allMetrics.map((m) => (
                      <option key={m.budget.id} value={m.budget.id}>
                        {m.budget.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {comparisonData && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <CompareStat
                      label="Total Spent"
                      a={formatCurrency(
                        comparisonData.mA.totalExpenses,
                        comparisonData.mA.budget.currency,
                        { decimals: 0 }
                      )}
                      b={formatCurrency(
                        comparisonData.mB.totalExpenses,
                        comparisonData.mB.budget.currency,
                        { decimals: 0 }
                      )}
                    />
                    <CompareStat
                      label="Avg Daily Spend"
                      a={formatCurrency(
                        comparisonData.mA.averageDailySpending,
                        comparisonData.mA.budget.currency,
                        { decimals: 0 }
                      )}
                      b={formatCurrency(
                        comparisonData.mB.averageDailySpending,
                        comparisonData.mB.budget.currency,
                        { decimals: 0 }
                      )}
                    />
                    <CompareStat
                      label="Actual Savings"
                      a={formatCurrency(
                        comparisonData.mA.actualSavings,
                        comparisonData.mA.budget.currency,
                        { decimals: 0 }
                      )}
                      b={formatCurrency(
                        comparisonData.mB.actualSavings,
                        comparisonData.mB.budget.currency,
                        { decimals: 0 }
                      )}
                    />
                    <CompareStat
                      label="Usage %"
                      a={`${comparisonData.mA.usagePercentage.toFixed(0)}%`}
                      b={`${comparisonData.mB.usagePercentage.toFixed(0)}%`}
                    />
                  </div>

                  {comparisonData.categoryRows.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData.categoryRows}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148,163,184,0.12)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="category"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#12161c',
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#f4f4f5',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar
                            dataKey={comparisonData.mA.budget.name}
                            fill="#10b981"
                            radius={[6, 6, 0, 0]}
                          />
                          <Bar
                            dataKey={comparisonData.mB.budget.name}
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ReportStat: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
    <p className="text-slate-500 dark:text-zinc-400">{label}</p>
    <p className="font-mono font-bold text-sm sm:text-base mt-1">{value}</p>
  </div>
);

const CompareStat: React.FC<{ label: string; a: string; b: string }> = ({
  label,
  a,
  b,
}) => (
  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
    <p className="text-slate-500 dark:text-zinc-400 mb-1.5">{label}</p>
    <p className="font-mono font-semibold text-emerald-500">{a}</p>
    <p className="font-mono font-semibold text-blue-400 mt-0.5">{b}</p>
  </div>
);
