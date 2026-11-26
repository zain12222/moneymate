import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  PiggyBank,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import type { AppSettings, CurrencyCode, SavingsGoal } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDisplayDate, getTodayISO } from '../utils/dates';

interface SavingsPageProps {
  goals: SavingsGoal[];
  currency: CurrencyCode;
  settings: AppSettings;
  onSaveGoal: (
    goal: Omit<SavingsGoal, 'id' | 'contributions' | 'updatedAt'> & {
      id?: string;
    }
  ) => Promise<SavingsGoal>;
  onContribute: (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    note?: string
  ) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

const GOAL_SUGGESTIONS = [
  'New Phone',
  'Laptop',
  'Emergency Savings',
  'Personal Goal',
];

export const SavingsPage: React.FC<SavingsPageProps> = ({
  goals,
  currency,
  settings,
  onSaveGoal,
  onContribute,
  onDeleteGoal,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contribModal, setContribModal] = useState<{
    goal: SavingsGoal;
    type: 'deposit' | 'withdraw';
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Goal Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [createdDate, setCreatedDate] = useState(getTodayISO());
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Contribution Form state
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const totals = useMemo(() => {
    const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const remaining = Math.max(0, totalTarget - totalSaved);
    const pct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
    return { totalSaved, totalTarget, remaining, pct };
  }, [goals]);

  const openNewGoal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setSavedAmount('0');
    setCreatedDate(getTodayISO());
    setTargetDate('');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setSavedAmount(String(goal.savedAmount));
    setCreatedDate(goal.createdDate);
    setTargetDate(goal.targetDate ?? '');
    setNotes(goal.notes ?? '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(targetAmount);
    const s = Number(savedAmount || 0);

    if (!name.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }
    if (Number.isNaN(t) || t <= 0) {
      setFormError('Target amount must be greater than 0.');
      return;
    }
    if (Number.isNaN(s) || s < 0) {
      setFormError('Saved amount cannot be negative.');
      return;
    }

    await onSaveGoal({
      id: editingGoal?.id,
      name: name.trim(),
      targetAmount: t,
      savedAmount: s,
      createdDate: createdDate || getTodayISO(),
      targetDate: targetDate || undefined,
      notes: notes.trim() || undefined,
    });
    setModalOpen(false);
  };

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribModal) return;
    const amt = Number(contribAmount);
    if (Number.isNaN(amt) || amt <= 0) return;

    await onContribute(contribModal.goal.id, amt, contribModal.type, contribNote);
    setContribAmount('');
    setContribNote('');
    setContribModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Savings Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Keep savings separate from your daily spending budget
          </p>
        </div>
        <button
          type="button"
          onClick={openNewGoal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Overall Savings Summary */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Total Saved in Goals
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">
              {formatCurrency(totals.totalSaved, currency, { decimals: 0 })}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Total Target
            </span>
            <p className="text-2xl font-bold font-mono mt-1">
              {formatCurrency(totals.totalTarget, currency, { decimals: 0 })}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Remaining to Target
            </span>
            <p className="text-2xl font-bold font-mono mt-1">
              {formatCurrency(totals.remaining, currency, { decimals: 0 })}
            </p>
          </div>
        </div>
        {goals.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500 dark:text-zinc-400">
                Overall Progress
              </span>
              <span className="font-mono font-semibold text-emerald-500">
                {totals.pct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${totals.pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-10 text-center">
          <PiggyBank className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
          <h2 className="text-base font-semibold">No savings goals yet</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            Create goals for a new phone, laptop, emergency fund, or anything
            you are saving toward.
          </p>
          <button
            type="button"
            onClick={openNewGoal}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
                : 0;
            const completed = goal.savedAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {goal.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Created{' '}
                          {formatDisplayDate(
                            goal.createdDate,
                            settings.dateFormat
                          )}
                          {goal.targetDate
                            ? ` · Target: ${formatDisplayDate(
                                goal.targetDate,
                                settings.dateFormat
                              )}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditGoal(goal)}
                        aria-label={`Edit ${goal.name}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(goal.id)}
                        aria-label={`Delete ${goal.name}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-zinc-400 block">
                        Target
                      </span>
                      <span className="font-mono font-semibold text-sm">
                        {formatCurrency(goal.targetAmount, currency, {
                          decimals: 0,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-400 block">
                        Saved
                      </span>
                      <span className="font-mono font-semibold text-sm text-emerald-500">
                        {formatCurrency(goal.savedAmount, currency, {
                          decimals: 0,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-400 block">
                        Remaining
                      </span>
                      <span className="font-mono font-semibold text-sm">
                        {formatCurrency(remaining, currency, { decimals: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span
                        className={`font-medium ${
                          completed ? 'text-emerald-500' : 'text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        {completed ? 'Goal Reached!' : 'Progress'}
                      </span>
                      <span className="font-mono font-semibold">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContribAmount('');
                      setContribNote('');
                      setContribModal({ goal, type: 'deposit' });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 text-xs font-semibold transition-colors"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Add Savings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContribAmount('');
                      setContribNote('');
                      setContribModal({ goal, type: 'withdraw' });
                    }}
                    disabled={goal.savedAmount <= 0}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>
                </div>

                {confirmDeleteId === goal.id && (
                  <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2 text-xs">
                    <span className="text-red-400">Delete this savings goal?</span>
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
                          await onDeleteGoal(goal.id);
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

      {/* Create / Edit Goal Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        subtitle="Keep long-term savings goals separate from pocket money spending"
      >
        <form onSubmit={handleSubmitGoal} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Goal Name *
            </label>
            <input
              type="text"
              placeholder="e.g., New Phone, Laptop, Emergency Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
            {!editingGoal && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {GOAL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setName(s)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-emerald-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Target Amount ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="100000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Amount Saved ({currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="15000"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Created Date
              </label>
              <input
                type="date"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
            >
              {editingGoal ? 'Save Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit / Withdraw Modal */}
      <Modal
        open={Boolean(contribModal)}
        onClose={() => setContribModal(null)}
        title={
          contribModal?.type === 'deposit'
            ? `Add Savings to ${contribModal.goal.name}`
            : `Withdraw from ${contribModal?.goal.name ?? ''}`
        }
      >
        <form onSubmit={handleSubmitContribution} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Saved from monthly pocket money"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setContribModal(null)}
              className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
            >
              Confirm
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
