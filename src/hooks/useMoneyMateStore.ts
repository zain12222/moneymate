import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearAllDatabaseData,
  DEFAULT_SETTINGS,
  deleteBudget,
  deleteExpense,
  deleteSavingsGoal,
  getAllBudgets,
  getAllExpenses,
  getAllSavingsGoals,
  getSettings,
  importFullBackup,
  initializeCategoriesIfEmpty,
  saveBudget,
  saveExpense,
  saveSavingsGoal,
  saveSettings,
} from '../database/db';
import type {
  AppSettings,
  BackupPayload,
  Budget,
  BudgetMetrics,
  Expense,
  SavingsContribution,
  SavingsGoal,
} from '../types';
import { calculateBudgetMetrics } from '../utils/calculations';
import { getTodayISO } from '../utils/dates';
import { generateId } from '../utils/export';

export function useMoneyMateStore() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await initializeCategoriesIfEmpty();
      const [loadedBudgets, loadedExpenses, loadedGoals, loadedSettings] =
        await Promise.all([
          getAllBudgets(),
          getAllExpenses(),
          getAllSavingsGoals(),
          getSettings(),
        ]);

      setBudgets(loadedBudgets);
      setExpenses(loadedExpenses);
      setSavingsGoals(loadedGoals);
      setSettings(loadedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Apply dark/light class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Pick active budget: configured activeBudgetId, or currently covering today, or latest
  const activeBudget = useMemo<Budget | null>(() => {
    if (budgets.length === 0) return null;
    if (settings.activeBudgetId) {
      const match = budgets.find((b) => b.id === settings.activeBudgetId);
      if (match) return match;
    }
    const today = getTodayISO();
    const current = budgets.find(
      (b) => b.startDate <= today && b.endDate >= today
    );
    return current ?? budgets[0];
  }, [budgets, settings.activeBudgetId]);

  const activeMetrics = useMemo<BudgetMetrics | null>(() => {
    if (!activeBudget) return null;
    return calculateBudgetMetrics(activeBudget, expenses, getTodayISO());
  }, [activeBudget, expenses]);

  const allBudgetMetrics = useMemo<BudgetMetrics[]>(() => {
    const today = getTodayISO();
    return budgets.map((b) => calculateBudgetMetrics(b, expenses, today));
  }, [budgets, expenses]);

  const updateSettings = useCallback(
    async (partial: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>) => {
      const next: AppSettings = {
        ...settings,
        ...partial,
        id: 'settings',
        updatedAt: new Date().toISOString(),
      };
      setSettings(next);
      await saveSettings(next);
    },
    [settings]
  );

  const setActiveBudgetId = useCallback(
    async (budgetId: string | null) => {
      await updateSettings({ activeBudgetId: budgetId });
    },
    [updateSettings]
  );

  const upsertBudget = useCallback(
    async (
      input: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
      setAsActive = true
    ): Promise<Budget> => {
      const now = new Date().toISOString();
      const existing = input.id ? budgets.find((b) => b.id === input.id) : undefined;
      const record: Budget = {
        id: existing?.id ?? generateId('budget'),
        name: input.name.trim(),
        totalMoney: Math.max(0, input.totalMoney),
        savingsGoal: Math.max(0, input.savingsGoal),
        startDate: input.startDate,
        endDate: input.endDate,
        currency: input.currency,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await saveBudget(record);
      setBudgets((prev) => {
        const filtered = prev.filter((b) => b.id !== record.id);
        return [record, ...filtered].sort((a, b) =>
          b.startDate.localeCompare(a.startDate)
        );
      });
      if (setAsActive) {
        await updateSettings({ activeBudgetId: record.id });
      }
      return record;
    },
    [budgets, updateSettings]
  );

  const removeBudget = useCallback(
    async (id: string) => {
      await deleteBudget(id);
      const remaining = budgets.filter((b) => b.id !== id);
      setBudgets(remaining);
      if (settings.activeBudgetId === id) {
        await updateSettings({
          activeBudgetId: remaining[0]?.id ?? null,
        });
      }
    },
    [budgets, settings.activeBudgetId, updateSettings]
  );

  const upsertExpense = useCallback(
    async (
      input: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): Promise<Expense> => {
      const now = new Date().toISOString();
      const existing = input.id ? expenses.find((e) => e.id === input.id) : undefined;
      const record: Expense = {
        id: existing?.id ?? generateId('exp'),
        amount: Math.max(0, input.amount),
        category: input.category,
        date: input.date,
        time: input.time,
        description: input.description.trim(),
        paymentMethod: input.paymentMethod,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await saveExpense(record);
      setExpenses((prev) => {
        const filtered = prev.filter((e) => e.id !== record.id);
        return [record, ...filtered].sort((a, b) =>
          b.date !== a.date
            ? b.date.localeCompare(a.date)
            : b.time.localeCompare(a.time)
        );
      });
      return record;
    },
    [expenses]
  );

  const removeExpense = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const upsertSavingsGoal = useCallback(
    async (
      input: Omit<SavingsGoal, 'id' | 'contributions' | 'updatedAt'> & {
        id?: string;
        contributions?: SavingsContribution[];
      }
    ): Promise<SavingsGoal> => {
      const now = new Date().toISOString();
      const existing = input.id
        ? savingsGoals.find((g) => g.id === input.id)
        : undefined;
      const record: SavingsGoal = {
        id: existing?.id ?? generateId('goal'),
        name: input.name.trim(),
        targetAmount: Math.max(0, input.targetAmount),
        savedAmount: Math.max(0, input.savedAmount),
        createdDate: existing?.createdDate ?? input.createdDate,
        targetDate: input.targetDate || undefined,
        notes: input.notes?.trim() || undefined,
        contributions: input.contributions ?? existing?.contributions ?? [],
        updatedAt: now,
      };
      await saveSavingsGoal(record);
      setSavingsGoals((prev) => {
        const filtered = prev.filter((g) => g.id !== record.id);
        return [record, ...filtered].sort((a, b) =>
          b.createdDate.localeCompare(a.createdDate)
        );
      });
      return record;
    },
    [savingsGoals]
  );

  const contributeToSavingsGoal = useCallback(
    async (
      goalId: string,
      amount: number,
      type: 'deposit' | 'withdraw',
      note?: string
    ) => {
      const target = savingsGoals.find((g) => g.id === goalId);
      if (!target || amount <= 0) return;

      const delta = type === 'deposit' ? amount : -amount;
      const nextSaved = Math.max(0, target.savedAmount + delta);
      const entry: SavingsContribution = {
        id: generateId('contrib'),
        amount,
        date: getTodayISO(),
        note: note?.trim() || undefined,
        type,
      };
      const updated: SavingsGoal = {
        ...target,
        savedAmount: nextSaved,
        contributions: [entry, ...target.contributions],
        updatedAt: new Date().toISOString(),
      };
      await saveSavingsGoal(updated);
      setSavingsGoals((prev) =>
        prev.map((g) => (g.id === goalId ? updated : g))
      );
    },
    [savingsGoals]
  );

  const removeSavingsGoal = useCallback(async (id: string) => {
    await deleteSavingsGoal(id);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const restoreFromBackup = useCallback(
    async (payload: BackupPayload) => {
      await importFullBackup(payload);
      await loadAll();
    },
    [loadAll]
  );

  const clearAllData = useCallback(async () => {
    await clearAllDatabaseData();
    await loadAll();
  }, [loadAll]);

  return {
    budgets,
    expenses,
    savingsGoals,
    settings,
    loading,
    error,
    activeBudget,
    activeMetrics,
    allBudgetMetrics,
    updateSettings,
    setActiveBudgetId,
    upsertBudget,
    removeBudget,
    upsertExpense,
    removeExpense,
    upsertSavingsGoal,
    contributeToSavingsGoal,
    removeSavingsGoal,
    restoreFromBackup,
    clearAllData,
    reload: loadAll,
  };
}
