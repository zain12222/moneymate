import React, { useState } from 'react';
import {
  Archive,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import type { Budget, CurrencyCode, PageRoute, ThemeMode } from '../types';
import { formatCurrency } from '../utils/currency';

interface LayoutProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onQuickAddExpense: () => void;
  activeBudget: Budget | null;
  remainingSpendable: number;
  currency: CurrencyCode;
  theme: ThemeMode;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: PageRoute;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'budgets', label: 'Budgets', shortLabel: 'Budgets', icon: Wallet },
  { id: 'expenses', label: 'Expenses', shortLabel: 'Expenses', icon: Receipt },
  { id: 'daily-history', label: 'Daily History', shortLabel: 'Daily', icon: CalendarDays },
  { id: 'budget-history', label: 'Budget History', shortLabel: 'History', icon: Archive },
  { id: 'savings', label: 'Savings Goals', shortLabel: 'Savings', icon: PiggyBank },
  { id: 'analytics', label: 'Analytics', shortLabel: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  onQuickAddExpense,
  activeBudget,
  remainingSpendable,
  currency,
  theme,
  onToggleTheme,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobilePrimary: PageRoute[] = ['dashboard', 'expenses', 'daily-history', 'analytics'];

  const handleNav = (page: PageRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090b0e] text-slate-900 dark:text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-68 shrink-0 flex-col border-r border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#0d1014] sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20">
              M
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block leading-none">
                MoneyMate
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Smart Pocket Budget
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Add Button */}
        <div className="p-4">
          <button
            type="button"
            onClick={onQuickAddExpense}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm shadow-lg shadow-emerald-500/15 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Budget Pill at bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80">
          {activeBudget ? (
            <button
              type="button"
              onClick={() => handleNav('budgets')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/40 transition-colors"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold">
                Active Budget
              </p>
              <p className="text-sm font-semibold truncate mt-0.5 text-slate-900 dark:text-zinc-100">
                {activeBudget.name}
              </p>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(remainingSpendable, activeBudget.currency, {
                  decimals: 0,
                })}{' '}
                left
              </p>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav('budgets')}
              className="w-full text-left p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-600 dark:text-amber-300 font-medium"
            >
              No active budget. Tap to create one.
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#0d1014]/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-zinc-950 font-extrabold text-sm">
              M
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">MoneyMate</h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[160px]">
                {activeBudget
                  ? `${activeBudget.name} · ${formatCurrency(
                      remainingSpendable,
                      currency,
                      { decimals: 0 }
                    )}`
                  : 'No active budget'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Open navigation menu"
              className="p-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[57px] bottom-0 z-40 bg-white dark:bg-[#0d1014] p-4 overflow-y-auto border-t border-slate-200 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-2.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium border ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 md:pb-10">
          {children}
        </main>
      </div>

      {/* Floating '+' Quick Expense Button on Mobile */}
      <button
        type="button"
        onClick={onQuickAddExpense}
        aria-label="Quick add expense"
        className="md:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-xl shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0d1014]/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 pb-safe">
        <div className="grid grid-cols-5 px-1 pt-1.5">
          {NAV_ITEMS.filter((item) => mobilePrimary.includes(item.id)).map(
            (item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`flex flex-col items-center gap-1 py-1.5 rounded-lg text-[11px] font-medium ${
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.shortLabel}</span>
                </button>
              );
            }
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 py-1.5 rounded-lg text-[11px] font-medium ${
              !mobilePrimary.includes(currentPage)
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
