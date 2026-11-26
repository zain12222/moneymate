import React, { useEffect, useMemo, useState } from 'react';
import type { Budget, CurrencyCode } from '../types';
import { CURRENCIES, formatCurrency } from '../utils/currency';
import {
  addDaysISO,
  getBudgetDurationDays,
  getMonthRangeISO,
  getTodayISO,
} from '../utils/dates';
import { Modal } from './Modal';

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  initialBudget?: Budget | null;
  defaultCurrency: CurrencyCode;
}

const DURATION_PRESETS = [
  { label: '5 Days', days: 5 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
] as const;

export const BudgetModal: React.FC<BudgetModalProps> = ({
  open,
  onClose,
  onSave,
  initialBudget,
  defaultCurrency,
}) => {
  const [name, setName] = useState('');
  const [totalMoney, setTotalMoney] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(addDaysISO(getTodayISO(), 13));
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initialBudget) {
      setName(initialBudget.name);
      setTotalMoney(String(initialBudget.totalMoney));
      setSavingsGoal(String(initialBudget.savingsGoal));
      setStartDate(initialBudget.startDate);
      setEndDate(initialBudget.endDate);
      setCurrency(initialBudget.currency);
    } else {
      const today = getTodayISO();
      const monthName = new Date().toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      setName(`${monthName} Pocket Money`);
      setTotalMoney('');
      setSavingsGoal('0');
      setStartDate(today);
      setEndDate(addDaysISO(today, 13)); // 14 days default
      setCurrency(defaultCurrency);
    }
  }, [open, initialBudget, defaultCurrency]);

  const applyPresetDays = (days: number) => {
    const base = startDate || getTodayISO();
    setStartDate(base);
    setEndDate(addDaysISO(base, days - 1));
  };

  const applyFullMonth = () => {
    const now = new Date();
    const { startDate: s, endDate: e, label } = getMonthRangeISO(
      now.getFullYear(),
      now.getMonth()
    );
    setStartDate(s);
    setEndDate(e);
    if (!initialBudget) {
      setName(`${label} Budget`);
    }
  };

  const preview = useMemo(() => {
    const total = Math.max(0, Number(totalMoney) || 0);
    const save = Math.max(0, Number(savingsGoal) || 0);
    const validRange = Boolean(startDate && endDate && endDate >= startDate);
    const days = validRange ? getBudgetDurationDays(startDate, endDate) : 0;
    const spendable = Math.max(0, total - save);
    const daily = days > 0 ? spendable / days : 0;
    return { total, save, days, spendable, daily, validRange };
  }, [totalMoney, savingsGoal, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(totalMoney);
    const save = Number(savingsGoal || 0);

    if (!name.trim()) {
      setError('Please enter a budget name.');
      return;
    }
    if (Number.isNaN(total) || total <= 0) {
      setError('Total available money must be greater than 0.');
      return;
    }
    if (Number.isNaN(save) || save < 0) {
      setError('Saving goal cannot be negative.');
      return;
    }
    if (save > total) {
      setError('Saving goal cannot exceed total available money.');
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      setError('End date must be on or after start date.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        id: initialBudget?.id,
        name: name.trim(),
        totalMoney: total,
        savingsGoal: save,
        startDate,
        endDate,
        currency,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialBudget ? 'Edit Budget' : 'Create New Budget'}
      subtitle={
        initialBudget
          ? 'Historical expense records will be preserved'
          : 'Set any duration and automatic daily allowance'
      }
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Budget Name *
          </label>
          <input
            type="text"
            placeholder="e.g., November Pocket Money, 14-Day Sprint"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Total Money *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              placeholder="11000"
              value={totalMoney}
              onChange={(e) => setTotalMoney(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Saving Goal
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="5000"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Quick Duration Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((preset) => {
              const active = preview.days === preset.days && preview.validRange;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => applyPresetDays(preset.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-500/40'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={applyFullMonth}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-500/40 transition-colors"
            >
              Full Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/25 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-zinc-400">Budget Duration</span>
            <span className="font-semibold text-slate-900 dark:text-zinc-100">
              {preview.validRange ? `${preview.days} ${preview.days === 1 ? 'day' : 'days'}` : 'Invalid range'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-zinc-400">
              Spendable Budget (Total - Saving Goal)
            </span>
            <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
              {formatCurrency(preview.spendable, currency, { decimals: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20">
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Initial Daily Budget
            </span>
            <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
              {formatCurrency(preview.daily, currency, { decimals: 2 })}/day
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50"
          >
            {submitting
              ? 'Saving...'
              : initialBudget
              ? 'Save Changes'
              : 'Create Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
