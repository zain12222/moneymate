import type { CurrencyCode, ExpenseCategory, PaymentMethod, CategoryRecord } from '../types';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  spaceAfterSymbol: boolean;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  PKR: { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee (PKR)', spaceAfterSymbol: true },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar (USD)', spaceAfterSymbol: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', spaceAfterSymbol: false },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', spaceAfterSymbol: false },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', spaceAfterSymbol: false },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', spaceAfterSymbol: true },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR)', spaceAfterSymbol: true },
};

export function sanitizeAmount(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 0;
  return Object.is(value, -0) ? 0 : value;
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'PKR',
  options?: { decimals?: number; showSign?: boolean }
): string {
  const safe = sanitizeAmount(amount);
  const abs = Math.abs(safe);
  const decimals = options?.decimals ?? (abs % 1 === 0 ? 0 : 2);
  const meta = CURRENCIES[currency] ?? CURRENCIES.PKR;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);

  const prefix = meta.spaceAfterSymbol ? `${meta.symbol} ` : meta.symbol;
  if (safe < 0) {
    return `-${prefix}${formattedNumber}`;
  }
  if (options?.showSign && safe > 0) {
    return `+${prefix}${formattedNumber}`;
  }
  return `${prefix}${formattedNumber}`;
}

export function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode = 'PKR'
): string {
  const safe = sanitizeAmount(amount);
  const meta = CURRENCIES[currency] ?? CURRENCIES.PKR;
  const prefix = meta.spaceAfterSymbol ? `${meta.symbol} ` : meta.symbol;
  if (Math.abs(safe) >= 1_000_000) {
    return `${prefix}${(safe / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(safe) >= 10_000) {
    return `${prefix}${(safe / 1_000).toFixed(1)}k`;
  }
  return formatCurrency(safe, currency, { decimals: 0 });
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'University',
  'Shopping',
  'Mobile & Internet',
  'Entertainment',
  'Personal',
  'Bills',
  'Health',
  'Other',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'JazzCash / EasyPaisa',
  'Card',
  'Bank Transfer',
  'Other',
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#10b981',
  Transport: '#3b82f6',
  University: '#8b5cf6',
  Shopping: '#ec4899',
  'Mobile & Internet': '#06b6d4',
  Entertainment: '#f59e0b',
  Personal: '#14b8a6',
  Bills: '#f97316',
  Health: '#ef4444',
  Other: '#64748b',
};

export const DEFAULT_CATEGORY_RECORDS: CategoryRecord[] = EXPENSE_CATEGORIES.map((name) => ({
  id: name,
  name,
  color: CATEGORY_COLORS[name],
}));
