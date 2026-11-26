export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'University'
  | 'Shopping'
  | 'Mobile & Internet'
  | 'Entertainment'
  | 'Personal'
  | 'Bills'
  | 'Health'
  | 'Other';

export type PaymentMethod =
  | 'Cash'
  | 'Card'
  | 'Bank Transfer'
  | 'JazzCash / EasyPaisa'
  | 'Other';

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED' | 'SAR';

export type DateFormatOption =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'MMM DD, YYYY';

export type ThemeMode = 'dark' | 'light';

export type PageRoute =
  | 'dashboard'
  | 'budgets'
  | 'expenses'
  | 'daily-history'
  | 'budget-history'
  | 'savings'
  | 'analytics'
  | 'settings';

export interface Budget {
  id: string;
  name: string;
  totalMoney: number;
  savingsGoal: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  type: 'deposit' | 'withdraw';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  createdDate: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD
  notes?: string;
  contributions: SavingsContribution[];
  updatedAt: string;
}

export interface CategoryRecord {
  id: ExpenseCategory;
  name: ExpenseCategory;
  color: string;
}

export interface AppSettings {
  id: 'settings';
  currency: CurrencyCode;
  dateFormat: DateFormatOption;
  theme: ThemeMode;
  activeBudgetId: string | null;
  updatedAt: string;
}

export interface DailyBudgetPoint {
  date: string;
  spent: number;
  allowance: number;
  remaining: number; // positive = left, negative = overspent
  withinBudget: boolean;
  expenses: Expense[];
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
}

export interface BudgetAlert {
  id: string;
  level: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

export interface BudgetMetrics {
  budget: Budget;
  status: 'upcoming' | 'active' | 'completed';
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number; // includes today when active
  daysRemainingAfterToday: number;
  spendableBudget: number;
  initialDailyBudget: number;
  totalExpenses: number;
  rawRemainingSpendable: number;
  remainingSpendable: number;
  overspentTotal: number;
  actualSavings: number;
  todayExpenses: number;
  todaySpendingLimit: number;
  rawTodayRemaining: number;
  todayRemainingAllowance: number;
  todayOverspent: number;
  futureDailyAllowance: number;
  averageDailySpending: number;
  usagePercentage: number;
  categoryBreakdown: CategoryBreakdown[];
  dailyHistory: DailyBudgetPoint[];
  daysUnderBudget: number;
  daysOverBudget: number;
  alerts: BudgetAlert[];
  dailyPrimaryMessage: string;
  dailySecondaryMessage: string;
}

export interface BackupPayload {
  app: 'MoneyMate';
  version: number;
  exportedAt: string;
  budgets: Budget[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  categories: CategoryRecord[];
  settings: AppSettings;
}
