import type {
  AppSettings,
  BackupPayload,
  Budget,
  CategoryRecord,
  Expense,
  SavingsGoal,
} from '../types';
import { DEFAULT_CATEGORY_RECORDS } from '../utils/currency';

const DB_NAME = 'moneymate_db';
const DB_VERSION = 1;

const STORES = {
  BUDGETS: 'budgets',
  EXPENSES: 'expenses',
  SAVINGS_GOALS: 'savingsGoals',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  currency: 'PKR',
  dateFormat: 'MMM DD, YYYY',
  theme: 'dark',
  activeBudgetId: null,
  updatedAt: new Date().toISOString(),
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expStore.createIndex('date', 'date', { unique: false });
        expStore.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SAVINGS_GOALS)) {
        db.createObjectStore(STORES.SAVINGS_GOALS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const items = await reqToPromise<T[]>(store.getAll());
  await txDone(tx);
  return items;
}

async function putInStore<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(value);
  await txDone(tx);
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(id);
  await txDone(tx);
}

export async function initializeCategoriesIfEmpty(): Promise<CategoryRecord[]> {
  const existing = await getAllFromStore<CategoryRecord>(STORES.CATEGORIES);
  if (existing.length > 0) return existing;

  const db = await openDB();
  const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
  const store = tx.objectStore(STORES.CATEGORIES);
  for (const cat of DEFAULT_CATEGORY_RECORDS) {
    store.put(cat);
  }
  await txDone(tx);
  return DEFAULT_CATEGORY_RECORDS;
}

export async function getAllBudgets(): Promise<Budget[]> {
  const items = await getAllFromStore<Budget>(STORES.BUDGETS);
  return items.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function saveBudget(budget: Budget): Promise<void> {
  await putInStore(STORES.BUDGETS, budget);
}

export async function deleteBudget(id: string): Promise<void> {
  await deleteFromStore(STORES.BUDGETS, id);
}

export async function getAllExpenses(): Promise<Expense[]> {
  const items = await getAllFromStore<Expense>(STORES.EXPENSES);
  return items.sort((a, b) =>
    b.date !== a.date ? b.date.localeCompare(a.date) : b.time.localeCompare(a.time)
  );
}

export async function saveExpense(expense: Expense): Promise<void> {
  await putInStore(STORES.EXPENSES, expense);
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteFromStore(STORES.EXPENSES, id);
}

export async function getAllSavingsGoals(): Promise<SavingsGoal[]> {
  const items = await getAllFromStore<SavingsGoal>(STORES.SAVINGS_GOALS);
  return items.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
}

export async function saveSavingsGoal(goal: SavingsGoal): Promise<void> {
  await putInStore(STORES.SAVINGS_GOALS, goal);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await deleteFromStore(STORES.SAVINGS_GOALS, id);
}

export async function getSettings(): Promise<AppSettings> {
  const db = await openDB();
  const tx = db.transaction(STORES.SETTINGS, 'readonly');
  const found = await reqToPromise<AppSettings | undefined>(
    tx.objectStore(STORES.SETTINGS).get('settings')
  );
  await txDone(tx);
  if (found) return found;
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await putInStore(STORES.SETTINGS, settings);
}

export async function exportFullBackup(): Promise<BackupPayload> {
  const [budgets, expenses, savingsGoals, categories, settings] = await Promise.all([
    getAllBudgets(),
    getAllExpenses(),
    getAllSavingsGoals(),
    initializeCategoriesIfEmpty(),
    getSettings(),
  ]);

  return {
    app: 'MoneyMate',
    version: 1,
    exportedAt: new Date().toISOString(),
    budgets,
    expenses,
    savingsGoals,
    categories,
    settings,
  };
}

export async function importFullBackup(payload: BackupPayload): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(
    [STORES.BUDGETS, STORES.EXPENSES, STORES.SAVINGS_GOALS, STORES.CATEGORIES, STORES.SETTINGS],
    'readwrite'
  );

  tx.objectStore(STORES.BUDGETS).clear();
  tx.objectStore(STORES.EXPENSES).clear();
  tx.objectStore(STORES.SAVINGS_GOALS).clear();
  tx.objectStore(STORES.CATEGORIES).clear();
  tx.objectStore(STORES.SETTINGS).clear();

  for (const b of payload.budgets) tx.objectStore(STORES.BUDGETS).put(b);
  for (const e of payload.expenses) tx.objectStore(STORES.EXPENSES).put(e);
  for (const g of payload.savingsGoals) tx.objectStore(STORES.SAVINGS_GOALS).put(g);

  const cats =
    payload.categories && payload.categories.length > 0
      ? payload.categories
      : DEFAULT_CATEGORY_RECORDS;
  for (const c of cats) tx.objectStore(STORES.CATEGORIES).put(c);

  tx.objectStore(STORES.SETTINGS).put({
    ...DEFAULT_SETTINGS,
    ...payload.settings,
    id: 'settings',
  });

  await txDone(tx);
}

export async function clearAllDatabaseData(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(
    [STORES.BUDGETS, STORES.EXPENSES, STORES.SAVINGS_GOALS, STORES.CATEGORIES, STORES.SETTINGS],
    'readwrite'
  );

  tx.objectStore(STORES.BUDGETS).clear();
  tx.objectStore(STORES.EXPENSES).clear();
  tx.objectStore(STORES.SAVINGS_GOALS).clear();
  tx.objectStore(STORES.CATEGORIES).clear();
  tx.objectStore(STORES.SETTINGS).clear();

  for (const c of DEFAULT_CATEGORY_RECORDS) {
    tx.objectStore(STORES.CATEGORIES).put(c);
  }
  tx.objectStore(STORES.SETTINGS).put({
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
  });

  await txDone(tx);
}
