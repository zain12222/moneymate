import React, { useEffect, useRef, useState } from 'react';
import type { CurrencyCode, Expense, ExpenseCategory, PaymentMethod } from '../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, formatCurrency } from '../utils/currency';
import { getCurrentTimeHHMM, getTodayISO } from '../utils/dates';
import { CATEGORY_ICONS } from './CategoryBadge';
import { Modal } from './Modal';

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  initialExpense?: Expense | null;
  currency: CurrencyCode;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  open,
  onClose,
  onSave,
  initialExpense,
  currency,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(getTodayISO());
  const [time, setTime] = useState(getCurrentTimeHHMM());
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('Cash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initialExpense) {
      setAmount(String(initialExpense.amount));
      setCategory(initialExpense.category);
      setDate(initialExpense.date);
      setTime(initialExpense.time);
      setDescription(initialExpense.description);
      setPaymentMethod(initialExpense.paymentMethod ?? '');
    } else {
      setAmount('');
      setCategory('Food');
      setDate(getTodayISO());
      setTime(getCurrentTimeHHMM());
      setDescription('');
      setPaymentMethod('Cash');
    }
    setTimeout(() => amountInputRef.current?.focus(), 60);
  }, [open, initialExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!date) {
      setError('Please choose a valid date.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        id: initialExpense?.id,
        amount: Math.round(numeric * 100) / 100,
        category,
        date,
        time: time || '12:00',
        description: description.trim() || category,
        paymentMethod: paymentMethod || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialExpense ? 'Edit Expense' : 'Quick Add Expense'}
      subtitle={
        initialExpense
          ? 'Update expense details — all budget totals recalculate automatically'
          : 'Log an expense in seconds'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Amount ({currency}) *
          </label>
          <input
            ref={amountInputRef}
            type="number"
            step="any"
            min="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            required
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-emerald-500/15 hover:text-emerald-400 border border-slate-200 dark:border-zinc-700/70 transition-colors"
              >
                {formatCurrency(preset, currency, { decimals: 0 })}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g., Lunch at canteen, Rickshaw fare, Tea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Payment Method (optional)
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          >
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
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
              : initialExpense
              ? 'Update Expense'
              : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
