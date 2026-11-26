import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { CategoryBadge, CategoryIconBox } from '../components/CategoryBadge';
import type { AppSettings, CurrencyCode, Expense, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES, formatCurrency } from '../utils/currency';
import { formatDisplayDate, formatTime12h } from '../utils/dates';
import { exportExpensesToCSV } from '../utils/export';

interface ExpensesPageProps {
  expenses: Expense[];
  currency: CurrencyCode;
  settings: AppSettings;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  currency,
  settings,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((exp) => {
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) {
        return false;
      }
      if (dateFrom && exp.date < dateFrom) return false;
      if (dateTo && exp.date > dateTo) return false;
      if (q) {
        const matchesDesc = exp.description.toLowerCase().includes(q);
        const matchesCat = exp.category.toLowerCase().includes(q);
        const matchesPm = (exp.paymentMethod ?? '').toLowerCase().includes(q);
        const matchesAmt = String(exp.amount).includes(q);
        if (!matchesDesc && !matchesCat && !matchesPm && !matchesAmt) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, search, categoryFilter, dateFrom, dateTo]);

  const totalFiltered = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  // Daily totals map for quick inline daily total tag
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of filtered) {
      map.set(exp.date, (map.get(exp.date) ?? 0) + exp.amount);
    }
    return map;
  }, [filtered]);

  const hasFilters = Boolean(
    search || categoryFilter !== 'ALL' || dateFrom || dateTo
  );

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Search, filter, edit, or export your recorded expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportExpensesToCSV(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-xs sm:text-sm font-medium disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as ExpenseCategory | 'ALL')
            }
            aria-label="Filter by category"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="ALL">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
          <span className="text-slate-500 dark:text-zinc-400">
            Showing <strong className="text-slate-900 dark:text-zinc-100">{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'expense' : 'expenses'} · Total:{' '}
            <strong className="font-mono text-emerald-500">
              {formatCurrency(totalFiltered, currency, { decimals: 0 })}
            </strong>
          </span>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Expense List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-10 text-center">
          <Receipt className="w-10 h-10 mx-auto text-slate-400 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-semibold">
            {hasFilters ? 'No matching expenses found' : 'No expenses logged yet'}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {hasFilters
              ? 'Try clearing your search or date filters.'
              : 'Tap "Add Expense" to record your first spending entry.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80">
          {filtered.map((exp) => (
            <div key={exp.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIconBox category={exp.category} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {exp.description}
                      </p>
                      <CategoryBadge category={exp.category} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {formatDisplayDate(exp.date, settings.dateFormat)} ·{' '}
                      {formatTime12h(exp.time)}
                      {exp.paymentMethod ? ` · ${exp.paymentMethod}` : ''}
                      {' · '}
                      <span className="text-slate-400 dark:text-zinc-500">
                        Day total:{' '}
                        {formatCurrency(dailyTotals.get(exp.date) ?? exp.amount, currency, {
                          decimals: 0,
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-sm sm:text-base">
                    {formatCurrency(exp.amount, currency, { decimals: 0 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditExpense(exp)}
                    aria-label="Edit expense"
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(exp.id)}
                    aria-label="Delete expense"
                    className="p-2 rounded-lg text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {confirmDeleteId === exp.id && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2 text-xs">
                  <span className="text-red-400">Delete this expense?</span>
                  <div className="flex items-center gap-2">
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
                        await onDeleteExpense(exp.id);
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
          ))}
        </div>
      )}
    </div>
  );
};
