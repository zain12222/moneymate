import type {
  Budget,
  BudgetAlert,
  BudgetMetrics,
  CategoryBreakdown,
  DailyBudgetPoint,
  Expense,
  ExpenseCategory,
} from '../types';
import { formatCurrency, sanitizeAmount, EXPENSE_CATEGORIES } from './currency';
import {
  addDaysISO,
  diffDaysSigned,
  enumerateDatesISO,
  getBudgetDurationDays,
  getTodayISO,
} from './dates';

export function filterExpensesForBudget(expenses: Expense[], budget: Budget): Expense[] {
  return expenses.filter(
    (exp) => exp.date >= budget.startDate && exp.date <= budget.endDate
  );
}

export function calculateBudgetMetrics(
  budget: Budget,
  allExpenses: Expense[],
  referenceDateISO: string = getTodayISO()
): BudgetMetrics {
  const totalMoney = Math.max(0, sanitizeAmount(budget.totalMoney));
  const savingsGoal = Math.max(0, sanitizeAmount(budget.savingsGoal));
  const spendableBudget = Math.max(0, totalMoney - savingsGoal);
  const totalDays = getBudgetDurationDays(budget.startDate, budget.endDate);
  const initialDailyBudget = totalDays > 0 ? spendableBudget / totalDays : 0;

  let status: BudgetMetrics['status'] = 'active';
  if (referenceDateISO < budget.startDate) {
    status = 'upcoming';
  } else if (referenceDateISO > budget.endDate) {
    status = 'completed';
  }

  let daysElapsed = 0;
  let daysRemaining = 0;
  let daysRemainingAfterToday = 0;

  if (status === 'upcoming') {
    daysElapsed = 0;
    daysRemaining = totalDays;
    daysRemainingAfterToday = totalDays;
  } else if (status === 'completed') {
    daysElapsed = totalDays;
    daysRemaining = 0;
    daysRemainingAfterToday = 0;
  } else {
    daysElapsed = Math.max(1, diffDaysSigned(budget.startDate, referenceDateISO) + 1);
    daysRemaining = Math.max(1, diffDaysSigned(referenceDateISO, budget.endDate) + 1);
    daysRemainingAfterToday = Math.max(0, daysRemaining - 1);
  }

  const budgetExpenses = filterExpensesForBudget(allExpenses, budget);
  const byDate = new Map<string, Expense[]>();
  let totalExpenses = 0;

  for (const exp of budgetExpenses) {
    const amt = Math.max(0, sanitizeAmount(exp.amount));
    totalExpenses += amt;
    const list = byDate.get(exp.date);
    if (list) {
      list.push(exp);
    } else {
      byDate.set(exp.date, [exp]);
    }
  }

  const rawRemainingSpendable = spendableBudget - totalExpenses;
  const remainingSpendable = Math.max(0, rawRemainingSpendable);
  const overspentTotal = Math.max(0, -rawRemainingSpendable);
  const actualSavings = Math.max(0, totalMoney - totalExpenses);

  // Today's expenses and allowance (dynamically recomputed at start of today)
  const todayExpenses =
    status === 'active'
      ? (byDate.get(referenceDateISO) ?? []).reduce(
          (sum, e) => sum + Math.max(0, sanitizeAmount(e.amount)),
          0
        )
      : 0;

  const yesterdayISO = addDaysISO(referenceDateISO, -1);
  const spentBeforeToday =
    status === 'active'
      ? budgetExpenses
          .filter((e) => e.date <= yesterdayISO)
          .reduce((sum, e) => sum + Math.max(0, sanitizeAmount(e.amount)), 0)
      : totalExpenses;

  const remainingAtStartOfToday = Math.max(0, spendableBudget - spentBeforeToday);

  const todaySpendingLimit =
    status === 'active'
      ? daysRemaining > 0
        ? remainingAtStartOfToday / daysRemaining
        : 0
      : status === 'upcoming'
      ? initialDailyBudget
      : 0;

  const rawTodayRemaining = todaySpendingLimit - todayExpenses;
  const todayRemainingAllowance = Math.max(0, rawTodayRemaining);
  const todayOverspent = Math.max(0, -rawTodayRemaining);

  const futureDailyAllowance =
    status === 'active'
      ? daysRemainingAfterToday > 0
        ? remainingSpendable / daysRemainingAfterToday
        : 0
      : status === 'upcoming'
      ? initialDailyBudget
      : 0;

  const averageDailySpending =
    status === 'upcoming' ? 0 : totalExpenses / Math.max(1, daysElapsed);

  const usagePercentage =
    spendableBudget > 0
      ? (totalExpenses / spendableBudget) * 100
      : totalExpenses > 0
      ? 100
      : 0;

  // Build rolling daily history up to endDate (or referenceDateISO if active/upcoming)
  const historyEndDate =
    status === 'completed'
      ? budget.endDate
      : status === 'active'
      ? referenceDateISO
      : budget.startDate;

  const dailyHistory: DailyBudgetPoint[] = [];
  let daysUnderBudget = 0;
  let daysOverBudget = 0;

  if (status !== 'upcoming') {
    const dates = enumerateDatesISO(budget.startDate, historyEndDate);
    let cumulativeSpentBeforeDay = 0;

    for (const date of dates) {
      const dayExpenses = (byDate.get(date) ?? []).slice().sort((a, b) =>
        b.time.localeCompare(a.time)
      );
      const spent = dayExpenses.reduce(
        (sum, e) => sum + Math.max(0, sanitizeAmount(e.amount)),
        0
      );
      const remainingDaysFromThisDay = Math.max(
        1,
        diffDaysSigned(date, budget.endDate) + 1
      );
      const remainingBeforeDay = Math.max(0, spendableBudget - cumulativeSpentBeforeDay);
      const allowance = remainingBeforeDay / remainingDaysFromThisDay;
      const remaining = allowance - spent;
      const withinBudget = spent <= allowance + 0.01;

      if (withinBudget) {
        daysUnderBudget += 1;
      } else {
        daysOverBudget += 1;
      }

      dailyHistory.push({
        date,
        spent,
        allowance,
        remaining,
        withinBudget,
        expenses: dayExpenses,
      });

      cumulativeSpentBeforeDay += spent;
    }
  }

  // Category breakdown
  const catSums = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const cat of EXPENSE_CATEGORIES) {
    catSums.set(cat, { amount: 0, count: 0 });
  }
  for (const exp of budgetExpenses) {
    const entry = catSums.get(exp.category) ?? { amount: 0, count: 0 };
    entry.amount += Math.max(0, sanitizeAmount(exp.amount));
    entry.count += 1;
    catSums.set(exp.category, entry);
  }

  const categoryBreakdown: CategoryBreakdown[] = Array.from(catSums.entries())
    .filter(([, v]) => v.count > 0)
    .map(([category, v]) => ({
      category,
      amount: v.amount,
      count: v.count,
      percentage: totalExpenses > 0 ? (v.amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Friendly status messages
  const cur = budget.currency;
  let dailyPrimaryMessage = '';
  let dailySecondaryMessage = '';

  if (status === 'upcoming') {
    dailyPrimaryMessage = `Budget starts soon (${totalDays} days planned).`;
    dailySecondaryMessage = `Planned daily budget is ${formatCurrency(
      initialDailyBudget,
      cur,
      { decimals: 0 }
    )}/day.`;
  } else if (status === 'completed') {
    dailyPrimaryMessage =
      rawRemainingSpendable >= 0
        ? `Budget period completed with ${formatCurrency(remainingSpendable, cur, {
            decimals: 0,
          })} unspent.`
        : `Budget period ended ${formatCurrency(overspentTotal, cur, {
            decimals: 0,
          })} over spendable limit.`;
    dailySecondaryMessage = `Average daily spending was ${formatCurrency(
      averageDailySpending,
      cur,
      { decimals: 0 }
    )}/day.`;
  } else {
    if (todayExpenses <= todaySpendingLimit + 0.01) {
      dailyPrimaryMessage = `You are under budget today. You have ${formatCurrency(
        todayRemainingAllowance,
        cur,
        { decimals: 0 }
      )} left for today.`;
    } else {
      dailyPrimaryMessage = `You spent ${formatCurrency(todayOverspent, cur, {
        decimals: 0,
      })} over today's allowance.`;
    }

    if (rawRemainingSpendable <= 0 && spendableBudget > 0) {
      dailySecondaryMessage =
        'Your spendable budget is exhausted for this period. Every extra rupee comes from your savings.';
    } else if (daysRemainingAfterToday > 0) {
      dailySecondaryMessage = `Your daily allowance for the remaining ${daysRemainingAfterToday} ${
        daysRemainingAfterToday === 1 ? 'day' : 'days'
      } is ${formatCurrency(futureDailyAllowance, cur, { decimals: 0 })}.`;
    } else {
      dailySecondaryMessage = 'Today is the final day of this budget period.';
    }
  }

  // Alerts & warnings (Section 10)
  const alerts: BudgetAlert[] = [];

  if (spendableBudget > 0 && rawRemainingSpendable <= 0) {
    alerts.push({
      id: 'budget-exhausted',
      level: 'danger',
      title: 'Spending Budget Exhausted',
      message:
        overspentTotal > 0
          ? `You have exceeded your spendable budget by ${formatCurrency(
              overspentTotal,
              cur,
              { decimals: 0 }
            )}.`
          : 'You have used 100% of your spendable budget.',
    });
  } else if (usagePercentage >= 90) {
    alerts.push({
      id: 'budget-90',
      level: 'danger',
      title: 'Critical Budget Alert (90%+)',
      message: `Warning: You have used ${Math.round(
        usagePercentage
      )}% of your spending budget. Keep daily expenses minimal.`,
    });
  } else if (usagePercentage >= 75) {
    alerts.push({
      id: 'budget-75',
      level: 'warning',
      title: 'High Budget Usage (75%+)',
      message: `Warning: You have used ${Math.round(
        usagePercentage
      )}% of your budget. Consider reducing your daily expenses.`,
    });
  } else if (usagePercentage >= 50) {
    alerts.push({
      id: 'budget-50',
      level: 'info',
      title: 'Halfway Through Budget (50%+)',
      message: `Heads up: You have spent ${Math.round(
        usagePercentage
      )}% of your spendable budget so far.`,
    });
  }

  if (status === 'active' && todayExpenses > todaySpendingLimit + 0.01) {
    alerts.push({
      id: 'daily-limit-exceeded',
      level: 'danger',
      title: 'Daily Limit Exceeded',
      message: `You spent ${formatCurrency(todayOverspent, cur, {
        decimals: 0,
      })} over today's allowance of ${formatCurrency(todaySpendingLimit, cur, {
        decimals: 0,
      })}.`,
    });
  }

  if (
    status === 'active' &&
    daysElapsed >= 2 &&
    initialDailyBudget > 0 &&
    averageDailySpending > initialDailyBudget * 1.15 &&
    rawRemainingSpendable > 0
  ) {
    alerts.push({
      id: 'fast-burn-rate',
      level: 'warning',
      title: 'Spending Pace Too Fast',
      message: `Your average daily spend (${formatCurrency(averageDailySpending, cur, {
        decimals: 0,
      })}/day) is above your planned pace (${formatCurrency(initialDailyBudget, cur, {
        decimals: 0,
      })}/day).`,
    });
  }

  return {
    budget,
    status,
    totalDays,
    daysElapsed,
    daysRemaining,
    daysRemainingAfterToday,
    spendableBudget,
    initialDailyBudget,
    totalExpenses,
    rawRemainingSpendable,
    remainingSpendable,
    overspentTotal,
    actualSavings,
    todayExpenses,
    todaySpendingLimit,
    rawTodayRemaining,
    todayRemainingAllowance,
    todayOverspent,
    futureDailyAllowance,
    averageDailySpending,
    usagePercentage,
    categoryBreakdown,
    dailyHistory,
    daysUnderBudget,
    daysOverBudget,
    alerts,
    dailyPrimaryMessage,
    dailySecondaryMessage,
  };
}
