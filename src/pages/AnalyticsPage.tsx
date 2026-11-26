import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  BudgetMetrics,
  CurrencyCode,
  Expense,
  ExpenseCategory,
  SavingsGoal,
} from '../types';
import { CATEGORY_COLORS, formatCurrency } from '../utils/currency';
import {
  addDaysISO,
  enumerateDatesISO,
  formatShortDate,
  getMonthRangeISO,
  getTodayISO,
} from '../utils/dates';

interface AnalyticsPageProps {
  expenses: Expense[];
  allMetrics: BudgetMetrics[];
  activeMetrics: BudgetMetrics | null;
  savingsGoals: SavingsGoal[];
  currency: CurrencyCode;
}

type RangePreset = '7d' | '14d' | '30d' | 'this-month' | 'prev-month' | 'custom';

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  expenses,
  allMetrics,
  activeMetrics,
  savingsGoals,
  currency,
}) => {
  const todayISO = getTodayISO();
  const [range, setRange] = useState<RangePreset>('14d');
  const [customStart, setCustomStart] = useState(addDaysISO(todayISO, -13));
  const [customEnd, setCustomEnd] = useState(todayISO);

  const dateWindow = useMemo(() => {
    const now = new Date();
    switch (range) {
      case '7d':
        return { start: addDaysISO(todayISO, -6), end: todayISO };
      case '14d':
        return { start: addDaysISO(todayISO, -13), end: todayISO };
      case '30d':
        return { start: addDaysISO(todayISO, -29), end: todayISO };
      case 'this-month': {
        const { startDate, endDate } = getMonthRangeISO(
          now.getFullYear(),
          now.getMonth()
        );
        return { start: startDate, end: endDate };
      }
      case 'prev-month': {
        const { startDate, endDate } = getMonthRangeISO(
          now.getFullYear(),
          now.getMonth() - 1
        );
        return { start: startDate, end: endDate };
      }
      case 'custom':
      default:
        return {
          start: customStart <= customEnd ? customStart : customEnd,
          end: customEnd >= customStart ? customEnd : customStart,
        };
    }
  }, [range, todayISO, customStart, customEnd]);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter(
        (e) => e.date >= dateWindow.start && e.date <= dateWindow.end
      ),
    [expenses, dateWindow]
  );

  // 1. Daily Expenses Line Chart (real data across the selected window)
  const dailySeries = useMemo(() => {
    const sums = new Map<string, number>();
    for (const e of filteredExpenses) {
      sums.set(e.date, (sums.get(e.date) ?? 0) + e.amount);
    }
    const dates = enumerateDatesISO(dateWindow.start, dateWindow.end);
    return dates.map((d) => ({
      date: d,
      label: formatShortDate(d),
      spent: Math.round((sums.get(d) ?? 0) * 100) / 100,
    }));
  }, [filteredExpenses, dateWindow]);

  // 2. Expenses by Category Pie Chart
  const categoryData = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of filteredExpenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: CATEGORY_COLORS[name],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // 3. Budget vs Expenses Bar Chart
  const budgetVsExpensesData = useMemo(
    () =>
      allMetrics.slice(0, 8).map((m) => ({
        name:
          m.budget.name.length > 14
            ? `${m.budget.name.slice(0, 14)}…`
            : m.budget.name,
        Budget: Math.round(m.spendableBudget),
        Spent: Math.round(m.totalExpenses),
      })),
    [allMetrics]
  );

  // 4. Monthly Spending Comparison
  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const ym = e.date.slice(0, 7);
      map.set(ym, (map.get(ym) ?? 0) + e.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([ym, total]) => {
        const [y, m] = ym.split('-').map(Number);
        const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(
          'en-US',
          { month: 'short', year: '2-digit', timeZone: 'UTC' }
        );
        return { month: label, Spent: Math.round(total) };
      });
  }, [expenses]);

  // 5. Savings Progress Chart
  const savingsChartData = useMemo(
    () =>
      savingsGoals.map((g) => ({
        name: g.name.length > 14 ? `${g.name.slice(0, 14)}…` : g.name,
        Saved: Math.round(g.savedAmount),
        Remaining: Math.round(Math.max(0, g.targetAmount - g.savedAmount)),
      })),
    [savingsGoals]
  );

  // Statistics
  const stats = useMemo(() => {
    const totalSpent = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const numDays = Math.max(1, dailySeries.length);
    const avgDaily = totalSpent / numDays;

    const nonZeroDays = dailySeries.filter((d) => d.spent > 0);
    const highestDay =
      nonZeroDays.length > 0
        ? nonZeroDays.reduce((max, d) => (d.spent > max.spent ? d : max))
        : null;
    const lowestDay =
      nonZeroDays.length > 0
        ? nonZeroDays.reduce((min, d) => (d.spent < min.spent ? d : min))
        : null;

    const topCategory = categoryData[0] ?? null;

    // Days under/over budget from active budget (or matching window)
    const underDays = activeMetrics?.daysUnderBudget ?? 0;
    const overDays = activeMetrics?.daysOverBudget ?? 0;

    return {
      totalSpent,
      avgDaily,
      highestDay,
      lowestDay,
      topCategory,
      underDays,
      overDays,
    };
  }, [filteredExpenses, dailySeries, categoryData, activeMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Real spending trends, category shares, and budget performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['7d', 'Last 7d'],
              ['14d', 'Last 14d'],
              ['30d', 'Last 30d'],
              ['this-month', 'This Month'],
              ['prev-month', 'Prev Month'],
              ['custom', 'Custom'],
            ] as [RangePreset, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                range === id
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                  : 'bg-white dark:bg-[#12161c] border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-zinc-400">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-zinc-400">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
            />
          </div>
        </div>
      )}

      {/* Key Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile
          label="Total Spent"
          value={formatCurrency(stats.totalSpent, currency, { decimals: 0 })}
        />
        <StatTile
          label="Avg Daily"
          value={formatCurrency(stats.avgDaily, currency, { decimals: 0 })}
        />
        <StatTile
          label="Highest Day"
          value={
            stats.highestDay
              ? formatCurrency(stats.highestDay.spent, currency, { decimals: 0 })
              : '—'
          }
          sub={stats.highestDay ? stats.highestDay.label : undefined}
        />
        <StatTile
          label="Lowest Day"
          value={
            stats.lowestDay
              ? formatCurrency(stats.lowestDay.spent, currency, { decimals: 0 })
              : '—'
          }
          sub={stats.lowestDay ? stats.lowestDay.label : undefined}
        />
        <StatTile
          label="Top Category"
          value={stats.topCategory ? stats.topCategory.name : '—'}
          sub={
            stats.topCategory
              ? formatCurrency(stats.topCategory.value, currency, {
                  decimals: 0,
                })
              : undefined
          }
        />
        <StatTile
          label="Under / Over Days"
          value={`${stats.underDays} / ${stats.overDays}`}
          sub="Active budget"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 1. Daily Expenses Line Chart */}
        <ChartCard
          className="lg:col-span-7"
          title="Daily Expenses Trend"
          subtitle={`${formatShortDate(dateWindow.start)} – ${formatShortDate(
            dateWindow.end
          )}`}
          empty={filteredExpenses.length === 0}
          emptyText="No expenses in the selected date range."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161c',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f4f4f5',
                }}
                formatter={(v: number) =>
                  formatCurrency(v, currency, { decimals: 0 })
                }
              />
              <Line
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Expenses by Category Pie Chart */}
        <ChartCard
          className="lg:col-span-5"
          title="Expenses by Category"
          subtitle="Share of spending by category"
          empty={categoryData.length === 0}
          emptyText="No categorized expenses in this range."
        >
          <div className="h-full flex flex-col sm:flex-row items-center gap-2">
            <div className="w-full sm:w-1/2 h-48 sm:h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12161c',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f4f4f5',
                    }}
                    formatter={(v: number) =>
                      formatCurrency(v, currency, { decimals: 0 })
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-1.5 overflow-y-auto max-h-52 pr-1">
              {categoryData.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name}</span>
                  </div>
                  <span className="font-mono font-medium shrink-0">
                    {formatCurrency(c.value, currency, { decimals: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 3. Budget vs Expenses Bar Chart */}
        <ChartCard
          className="lg:col-span-6"
          title="Budget vs Expenses"
          subtitle="Spendable budget compared to actual spent"
          empty={budgetVsExpensesData.length === 0}
          emptyText="Create a budget to compare budgets vs expenses."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetVsExpensesData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161c',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f4f4f5',
                }}
                formatter={(v: number) =>
                  formatCurrency(v, currency, { decimals: 0 })
                }
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Budget" fill="#334155" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Spent" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Monthly Spending Comparison */}
        <ChartCard
          className="lg:col-span-6"
          title="Monthly Spending Comparison"
          subtitle="Total expenses recorded per month"
          empty={monthlyData.length === 0}
          emptyText="No monthly expense history yet."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161c',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f4f4f5',
                }}
                formatter={(v: number) =>
                  formatCurrency(v, currency, { decimals: 0 })
                }
              />
              <Bar dataKey="Spent" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Savings Progress Chart */}
        <ChartCard
          className="lg:col-span-12"
          title="Savings Goals Progress"
          subtitle="Saved vs remaining target across your savings goals"
          empty={savingsChartData.length === 0}
          emptyText="Add savings goals on the Savings page to track progress here."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={savingsChartData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161c',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f4f4f5',
                }}
                formatter={(v: number) =>
                  formatCurrency(v, currency, { decimals: 0 })
                }
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="Saved"
                stackId="a"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Remaining"
                stackId="a"
                fill="#1e293b"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-3.5">
    <p className="text-[11px] text-slate-500 dark:text-zinc-400">{label}</p>
    <p className="text-base sm:text-lg font-bold font-mono mt-1 truncate">
      {value}
    </p>
    {sub && (
      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
        {sub}
      </p>
    )}
  </div>
);

const ChartCard: React.FC<{
  className?: string;
  title: string;
  subtitle: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}> = ({ className = '', title, subtitle, empty, emptyText, children }) => (
  <div
    className={`rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 ${className}`}
  >
    <div className="mb-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>
    </div>
    {empty ? (
      <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-slate-500 dark:text-zinc-500 gap-2">
        <BarChart3 className="w-7 h-7 opacity-40" />
        <span>{emptyText}</span>
      </div>
    ) : (
      <div className="h-60">{children}</div>
    )}
  </div>
);
