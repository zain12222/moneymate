import { useState } from 'react';
import { BudgetModal } from './components/BudgetModal';
import { ExpenseModal } from './components/ExpenseModal';
import { Layout } from './components/Layout';
import { useMoneyMateStore } from './hooks/useMoneyMateStore';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BudgetHistoryPage } from './pages/BudgetHistoryPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { DailyHistoryPage } from './pages/DailyHistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SavingsPage } from './pages/SavingsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { Budget, Expense, PageRoute } from './types';

export function App() {
  const store = useMoneyMateStore();
  const [currentPage, setCurrentPage] = useState<PageRoute>('dashboard');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const activeCurrency =
    store.activeBudget?.currency ?? store.settings.currency;

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const openEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseModalOpen(true);
  };

  const openCreateBudget = () => {
    setEditingBudget(null);
    setBudgetModalOpen(true);
  };

  const openEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setBudgetModalOpen(true);
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-[#090b0e] text-zinc-100 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-zinc-950 font-extrabold animate-pulse">
          M
        </div>
        <p className="text-sm text-zinc-400">Loading MoneyMate...</p>
      </div>
    );
  }

  if (store.error) {
    return (
      <div className="min-h-screen bg-[#090b0e] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-[#12161c] border border-red-500/30 p-6 text-center space-y-3">
          <h1 className="text-lg font-bold text-red-400">Database Error</h1>
          <p className="text-xs text-zinc-400">{store.error}</p>
          <button
            type="button"
            onClick={() => void store.reload()}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onQuickAddExpense={openAddExpense}
      activeBudget={store.activeBudget}
      remainingSpendable={store.activeMetrics?.remainingSpendable ?? 0}
      currency={activeCurrency}
      theme={store.settings.theme}
      onToggleTheme={() =>
        void store.updateSettings({
          theme: store.settings.theme === 'dark' ? 'light' : 'dark',
        })
      }
    >
      {currentPage === 'dashboard' && (
        <DashboardPage
          budgets={store.budgets}
          activeMetrics={store.activeMetrics}
          expenses={store.expenses}
          settings={store.settings}
          onSelectBudget={(id) => void store.setActiveBudgetId(id)}
          onCreateBudget={openCreateBudget}
          onEditBudget={openEditBudget}
          onAddExpense={openAddExpense}
          onEditExpense={openEditExpense}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'budgets' && (
        <BudgetsPage
          allMetrics={store.allBudgetMetrics}
          activeBudgetId={store.activeBudget?.id ?? null}
          settings={store.settings}
          onCreateBudget={openCreateBudget}
          onEditBudget={openEditBudget}
          onDeleteBudget={store.removeBudget}
          onSetActive={store.setActiveBudgetId}
        />
      )}

      {currentPage === 'expenses' && (
        <ExpensesPage
          expenses={store.expenses}
          currency={activeCurrency}
          settings={store.settings}
          onAddExpense={openAddExpense}
          onEditExpense={openEditExpense}
          onDeleteExpense={store.removeExpense}
        />
      )}

      {currentPage === 'daily-history' && (
        <DailyHistoryPage
          expenses={store.expenses}
          activeMetrics={store.activeMetrics}
          currency={activeCurrency}
          onAddExpense={openAddExpense}
          onEditExpense={openEditExpense}
          onDeleteExpense={store.removeExpense}
        />
      )}

      {currentPage === 'budget-history' && (
        <BudgetHistoryPage
          allMetrics={store.allBudgetMetrics}
          expenses={store.expenses}
          settings={store.settings}
          onEditBudget={openEditBudget}
        />
      )}

      {currentPage === 'savings' && (
        <SavingsPage
          goals={store.savingsGoals}
          currency={activeCurrency}
          settings={store.settings}
          onSaveGoal={store.upsertSavingsGoal}
          onContribute={store.contributeToSavingsGoal}
          onDeleteGoal={store.removeSavingsGoal}
        />
      )}

      {currentPage === 'analytics' && (
        <AnalyticsPage
          expenses={store.expenses}
          allMetrics={store.allBudgetMetrics}
          activeMetrics={store.activeMetrics}
          savingsGoals={store.savingsGoals}
          currency={activeCurrency}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          settings={store.settings}
          expenses={store.expenses}
          budgetsCount={store.budgets.length}
          goalsCount={store.savingsGoals.length}
          onUpdateSettings={store.updateSettings}
          onRestoreBackup={store.restoreFromBackup}
          onClearAllData={store.clearAllData}
        />
      )}

      <ExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={async (exp) => {
          await store.upsertExpense(exp);
        }}
        initialExpense={editingExpense}
        currency={activeCurrency}
      />

      <BudgetModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSave={async (b) => {
          await store.upsertBudget(b, !b.id);
        }}
        initialBudget={editingBudget}
        defaultCurrency={store.settings.currency}
      />
    </Layout>
  );
}

export default App;
