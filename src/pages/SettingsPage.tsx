import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Info,
  Moon,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { exportFullBackup } from '../database/db';
import type {
  AppSettings,
  BackupPayload,
  CurrencyCode,
  DateFormatOption,
  Expense,
} from '../types';
import { CURRENCIES, formatCurrency } from '../utils/currency';
import { formatDisplayDate, getTodayISO } from '../utils/dates';
import {
  exportBackupToJSON,
  exportExpensesToCSV,
  validateBackupPayload,
} from '../utils/export';

interface SettingsPageProps {
  settings: AppSettings;
  expenses: Expense[];
  budgetsCount: number;
  goalsCount: number;
  onUpdateSettings: (
    partial: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>
  ) => Promise<void>;
  onRestoreBackup: (payload: BackupPayload) => Promise<void>;
  onClearAllData: () => Promise<void>;
}

const DATE_FORMATS: DateFormatOption[] = [
  'MMM DD, YYYY',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  expenses,
  budgetsCount,
  goalsCount,
  onUpdateSettings,
  onRestoreBackup,
  onClearAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExportJSON = async () => {
    try {
      const payload = await exportFullBackup();
      exportBackupToJSON(
        payload,
        `moneymate-backup-${getTodayISO()}.json`
      );
      setStatusMessage({
        type: 'success',
        text: 'Full JSON backup exported successfully.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to export JSON backup.',
      });
    }
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(expenses, `moneymate-expenses-${getTodayISO()}.csv`);
    setStatusMessage({
      type: 'success',
      text: `Exported ${expenses.length} expenses as CSV.`,
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!validateBackupPayload(parsed)) {
        setStatusMessage({
          type: 'error',
          text: 'Invalid MoneyMate backup file format.',
        });
        return;
      }
      await onRestoreBackup(parsed);
      setStatusMessage({
        type: 'success',
        text: `Restored ${parsed.budgets.length} budgets, ${parsed.expenses.length} expenses, and ${parsed.savingsGoals.length} savings goals.`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Could not read backup JSON file.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleClearData = async () => {
    await onClearAllData();
    setConfirmClear(false);
    setStatusMessage({
      type: 'success',
      text: 'All MoneyMate data has been cleared.',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Configure currency, date formatting, theme, and local backups
        </p>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs sm:text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Preferences */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 space-y-5">
        <h2 className="text-sm font-semibold">Preferences</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Default Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) =>
                void onUpdateSettings({
                  currency: e.target.value as CurrencyCode,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 font-mono">
              Preview:{' '}
              {formatCurrency(1000, settings.currency, { decimals: 0 })} ·{' '}
              {formatCurrency(12500, settings.currency, { decimals: 0 })} ·{' '}
              {formatCurrency(100000, settings.currency, { decimals: 0 })}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) =>
                void onUpdateSettings({
                  dateFormat: e.target.value as DateFormatOption,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
            >
              {DATE_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt} ({formatDisplayDate(getTodayISO(), fmt)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <div>
            <p className="text-sm font-medium">Appearance Theme</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Dark mode is enabled by default for comfortable viewing
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void onUpdateSettings({ theme: 'dark' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                settings.theme === 'dark'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => void onUpdateSettings({ theme: 'light' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                settings.theme === 'light'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold">Backup, Export & Restore</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => void handleExportJSON()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import JSON Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void handleImportFile(e)}
            className="hidden"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-red-400 font-medium">
                This permanently deletes all budgets, expenses, and savings
                goals from your browser. Are you sure?
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleClearData()}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold"
                >
                  Yes, Clear Everything
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Information */}
      <div className="rounded-2xl bg-white dark:bg-[#12161c] border border-slate-200 dark:border-zinc-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold">App Information</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
            <span className="text-slate-500 dark:text-zinc-400 block">App</span>
            <span className="font-semibold mt-0.5 block">MoneyMate v1.0</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
            <span className="text-slate-500 dark:text-zinc-400 block">
              Storage
            </span>
            <span className="font-semibold mt-0.5 block">IndexedDB Local</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
            <span className="text-slate-500 dark:text-zinc-400 block">
              Saved Budgets
            </span>
            <span className="font-mono font-semibold mt-0.5 block">
              {budgetsCount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
            <span className="text-slate-500 dark:text-zinc-400 block">
              Expenses / Goals
            </span>
            <span className="font-mono font-semibold mt-0.5 block">
              {expenses.length} / {goalsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
