import type { BackupPayload, Expense } from '../types';

export function exportExpensesToCSV(expenses: Expense[], filename = 'moneymate-expenses.csv'): void {
  const headers = ['ID', 'Date', 'Time', 'Category', 'Amount', 'Payment Method', 'Description'];
  const escapeCSV = (val: string | number | undefined) => {
    const str = String(val ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const sorted = [...expenses].sort((a, b) =>
    b.date !== a.date ? b.date.localeCompare(a.date) : b.time.localeCompare(a.time)
  );

  const rows = [
    headers.join(','),
    ...sorted.map((e) =>
      [
        escapeCSV(e.id),
        escapeCSV(e.date),
        escapeCSV(e.time),
        escapeCSV(e.category),
        escapeCSV(e.amount),
        escapeCSV(e.paymentMethod ?? ''),
        escapeCSV(e.description),
      ].join(',')
    ),
  ];

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportBackupToJSON(payload: BackupPayload, filename = 'moneymate-backup.json'): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function validateBackupPayload(raw: unknown): raw is BackupPayload {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== 'MoneyMate') return false;
  if (!Array.isArray(obj.budgets)) return false;
  if (!Array.isArray(obj.expenses)) return false;
  if (!Array.isArray(obj.savingsGoals)) return false;
  if (!obj.settings || typeof obj.settings !== 'object') return false;
  return true;
}

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
