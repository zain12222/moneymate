import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Flame,
  PiggyBank,
  Plus,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CategoryIconBox } from '../components/CategoryBadge';
import type {
  AppSettings,
  Budget,
  BudgetMetrics,
  Expense,
  PageRoute,
} from '../types';
import { CATEGORY_COLORS, formatCurrency } from '../utils/currency';
import { formatDisplayDate, formatShortDate, formatTime12h } from '../utils/dates';

interface DashboardPageProps {
  budgets: Budget[];
  activeMetrics: BudgetMetrics | null;
  expenses: Expense[];
  settings: AppSettings;
  onSelectBudget: (id: string) => void;
  onCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onNavigate: (page: PageRoute) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  budgets,
  activeMetrics,
  expenses,
  settings,
  onSelectBudget,
  onCreateBudget,
  onEditBudget,
  onAddExpense,
  onEditExpense,
  onNavigate,
}) => {
  if (!activeMetrics) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="rounded-3xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-500">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to MoneyMate
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
            Set up your first pocket money budget for any duration — 5 days, 7
            days, 14 days, 30 days, or a custom date range. MoneyMate protects
            your savings goal and adjusts your daily spending allowance
            automatically.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-emerald-500">1. Protect Savings</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Separate your savings target before calculating spendable cash.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-emerald-500">2. Dynamic Daily Limit</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Remaining money ÷ remaining days recalculates with every expense.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-emerald-500">3. Local & Private</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Stored offline in IndexedDB with JSON & CSV backup anytime.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateBudget}
            className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Your First Budget</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    budget,
    status,
    totalDays,
    daysElapsed,
    daysRemaining,
    spendableBudget,
    initialDailyBudget,
    totalExpenses,
    rawRemainingSpendable,
    remainingSpendable,
    overspentTotal,
    actualSavings,
    todayExpenses,
    todaySpendingLimit,
    todayRemainingAllowance,
    todayOverspent,
    futureDailyAllowance,
    averageDailySpending,
    usagePercentage,
    categoryBreakdown,
    dailyHistory,
    alerts,
    dailyPrimaryMessage,
    dailySecondaryMessage,
  } = activeMetrics;

  const cur = budget.currency;
  const clampedPct = Math.min(100, Math.max(0, usagePercentage));

  const progressBarColor =
    usagePercentage >= 90
      ? 'bg-red-500'
      : usagePercentage >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const statusBadge =
    status === 'active'
      ? {
          label: 'Active',
          cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        }
      : status === 'upcoming'
      ? {
          label: 'Upcoming',
          cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        }
      : {
          label: 'Completed',
          cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
        };

  const recentExpenses = expenses
    .filter((e) => e.date >= budget.startDate && e.date <= budget.endDate)
    .slice(0, 6);

  const chartData = dailyHistory.slice(-14).map((d) => ({
    day: formatShortDate(d.date),
    Spent: Math.round(d.spent),
    Allowance: Math.round(d.allowance),
  }));

  const isTodayOver = status === 'active' && todayExpenses > todaySpendingLimit + 0.01;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {budget.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.cls}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {formatDisplayDate(budget.startDate, settings.dateFormat)} —{' '}
            {formatDisplayDate(budget.endDate, settings.dateFormat)} ({totalDays}{' '}
            {totalDays === 1 ? 'day' : 'days'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {budgets.length > 1 && (
            <select
              value={budget.id}
              onChange={(e) => onSelectBudget(e.target.value)}
              aria-label="Switch active budget"
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => onEditBudget(budget)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-xs sm:text-sm font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onCreateBudget}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Budget</span>
          </button>
          <button
            type="button"
            onClick={onAddExpense}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Alerts & Warnings */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const styles =
              alert.level === 'danger'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : alert.level === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400';
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${styles}`}
              >
                {alert.level === 'danger' ? (
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="text-xs sm:text-sm">
                  <span className="font-semibold">{alert.title}: </span>
                  <span className="opacity-90">{alert.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero: Dynamic Daily Allowance & Summary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Daily Budget Calculator Card */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Dynamic Daily Allowance
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Initial: {formatCurrency(initialDailyBudget, cur, { decimals: 0 })}/day
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Today&apos;s Spending Limit
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-slate-900 dark:text-zinc-50">
                  {formatCurrency(todaySpendingLimit, cur, { decimals: 0 })}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Today&apos;s Expenses
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-slate-900 dark:text-zinc-50">
                  {formatCurrency(todayExpenses, cur, { decimals: 0 })}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isTodayOver ? "Over Today's Limit" : 'Daily Remaining'}
                </p>
                <p
                  className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${
                    isTodayOver ? 'text-red-500' : 'text-emerald-500'
                  }`}
                >
                  {formatCurrency(
                    isTodayOver ? todayOverspent : todayRemainingAllowance,
                    cur,
                    { decimals: 0 }
                  )}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-5 p-3.5 rounded-xl border flex items-start gap-3 ${
              isTodayOver
                ? 'bg-red-500/10 border-red-500/25 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-300'
            }`}
          >
            {isTodayOver ? (
              <TrendingDown className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm space-y-0.5">
              <p className="font-semibold">{dailyPrimaryMessage}</p>
              <p className="opacity-90">{dailySecondaryMessage}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary Sheet (Section 2 style) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Budget Summary
            </span>
            <span className="text-xs font-mono text-emerald-500 font-semibold">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs sm:text-sm">
            <SummaryRow
              label="TOTAL BUDGET"
              value={formatCurrency(budget.totalMoney, cur, { decimals: 0 })}
            />
            <SummaryRow
              label="SAVINGS GOAL"
              value={formatCurrency(budget.savingsGoal, cur, { decimals: 0 })}
              valueClass="text-emerald-500"
            />
            <SummaryRow
              label="SPENDING BUDGET"
              value={formatCurrency(spendableBudget, cur, { decimals: 0 })}
            />
            <SummaryRow
              label="TOTAL SPENT"
              value={formatCurrency(totalExpenses, cur, { decimals: 0 })}
              valueClass={
                rawRemainingSpendable < 0
                  ? 'text-red-500'
                  : 'text-slate-900 dark:text-zinc-100'
              }
            />
            <SummaryRow
              label={rawRemainingSpendable < 0 ? 'OVERSPENT BY' : 'REMAINING'}
              value={formatCurrency(
                rawRemainingSpendable < 0 ? overspentTotal : remainingSpendable,
                cur,
                { decimals: 0 }
              )}
              valueClass={
                rawRemainingSpendable < 0
                  ? 'text-red-500 font-bold'
                  : 'text-emerald-500 font-bold'
              }
            />
            <SummaryRow
              label="TODAY'S ALLOWANCE"
              value={formatCurrency(todaySpendingLimit, cur, { decimals: 0 })}
            />
            <SummaryRow
              label="NEXT DAYS ALLOWANCE"
              value={
                status === 'active' && activeMetrics.daysRemainingAfterToday > 0
                  ? `${formatCurrency(futureDailyAllowance, cur, {
                      decimals: 0,
                    })}/day`
                  : '—'
              }
            />
          </div>
        </div>
      </div>

      {/* Spending Progress Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div>
            <h2 className="text-sm font-semibold">Budget Usage</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {formatCurrency(totalExpenses, cur, { decimals: 0 })} spent of{' '}
              {formatCurrency(spendableBudget, cur, { decimals: 0 })} spendable
              budget
            </p>
          </div>
          <span
            className={`text-lg font-bold font-mono ${
              usagePercentage >= 90
                ? 'text-red-500'
                : usagePercentage >= 75
                ? 'text-amber-500'
                : 'text-emerald-500'
            }`}
          >
            {usagePercentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden border border-slate-200 dark:border-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-xs text-slate-500 dark:text-zinc-400">
          <span>
            Day {daysElapsed} of {totalDays}
          </span>
          <span>
            {rawRemainingSpendable >= 0
              ? `${formatCurrency(remainingSpendable, cur, {
                  decimals: 0,
                })} spendable remaining`
              : `${formatCurrency(overspentTotal, cur, {
                  decimals: 0,
                })} over spendable budget`}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Actual Savings"
          value={formatCurrency(actualSavings, cur, { decimals: 0 })}
          subtitle={
            actualSavings >= budget.savingsGoal
              ? `Goal of ${formatCurrency(budget.savingsGoal, cur, {
                  decimals: 0,
                })} intact`
              : `Below goal (${formatCurrency(budget.savingsGoal, cur, {
                  decimals: 0,
                })})`
          }
          icon={PiggyBank}
          accent={actualSavings >= budget.savingsGoal ? 'emerald' : 'amber'}
        />
        <KpiCard
          title="Avg Daily Spend"
          value={formatCurrency(averageDailySpending, cur, { decimals: 0 })}
          subtitle={`Planned: ${formatCurrency(initialDailyBudget, cur, {
            decimals: 0,
          })}/day`}
          icon={
            averageDailySpending > initialDailyBudget ? Flame : TrendingUp
          }
          accent={
            averageDailySpending > initialDailyBudget ? 'amber' : 'emerald'
          }
        />
        <KpiCard
          title="Days Remaining"
          value={`${daysRemaining}`}
          subtitle={`${daysElapsed} elapsed · ${totalDays} total`}
          icon={CalendarClock}
          accent="neutral"
        />
        <KpiCard
          title="Budget Usage"
          value={`${Math.round(usagePercentage)}%`}
          subtitle={
            categoryBreakdown[0]
              ? `Top: ${categoryBreakdown[0].category}`
              : 'No expenses yet'
          }
          icon={Wallet}
          accent={
            usagePercentage >= 90
              ? 'red'
              : usagePercentage >= 75
              ? 'amber'
              : 'emerald'
          }
        />
      </div>

      {/* Chart + Category Breakdown + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Daily Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">
                Daily Spend vs Allowance
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Real daily expenses compared against rolling allowance
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500 dark:text-zinc-500">
              No daily history yet for this budget period.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.12)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
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
                    formatter={(val: number) =>
                      formatCurrency(val, cur, { decimals: 0 })
                    }
                  />
                  <Bar
                    dataKey="Allowance"
                    fill="#334155"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="Spent"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Spending by Category</h2>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400"
            >
              <span>All Expenses</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                No expenses recorded in this budget period yet.
              </p>
              <button
                type="button"
                onClick={onAddExpense}
                className="mt-3 text-xs font-semibold text-emerald-500 hover:text-emerald-400"
              >
                + Log your first expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-zinc-200">
                      {item.category} ({item.count})
                    </span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(item.amount, cur, { decimals: 0 })}{' '}
                      <span className="text-slate-400 dark:text-zinc-500 font-normal">
                        ({item.percentage.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: CATEGORY_COLORS[item.category],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Recent Expenses</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Latest transactions inside {budget.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('daily-history')}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400"
          >
            <span>Daily History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-500">
            No expenses yet for this budget. Tap &ldquo;Add Expense&rdquo; to
            log spending.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onEditExpense(exp)}
                className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIconBox category={exp.category} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {exp.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {exp.category} ·{' '}
                      {formatDisplayDate(exp.date, settings.dateFormat)} ·{' '}
                      {formatTime12h(exp.time)}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-semibold text-sm text-slate-900 dark:text-zinc-100 shrink-0">
                  {formatCurrency(exp.amount, cur, { decimals: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass = 'text-slate-900 dark:text-zinc-100' }) => (
  <div className="py-2 flex items-center justify-between gap-2">
    <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400">
      {label}
    </span>
    <span className={`font-mono font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const KpiCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'emerald' | 'amber' | 'red' | 'neutral';
}> = ({ title, value, subtitle, icon: Icon, accent }) => {
  const iconCls =
    accent === 'emerald'
      ? 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25'
      : accent === 'amber'
      ? 'bg-amber-500/12 text-amber-500 border-amber-500/25'
      : accent === 'red'
      ? 'bg-red-500/12 text-red-500 border-red-500/25'
      : 'bg-slate-500/12 text-slate-400 border-slate-500/25';

  return (
    <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${iconCls}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold font-mono mt-2">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
        {subtitle}
      </p>
    </div>
  );
};
