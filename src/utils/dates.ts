import type { DateFormatOption } from '../types';

const MS_PER_DAY = 86_400_000;

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function parseISODateUTC(iso: string): number {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return NaN;
  }
  const [y, m, d] = parts;
  return Date.UTC(y, m - 1, d);
}

export function addDaysISO(iso: string, days: number): string {
  const utc = parseISODateUTC(iso);
  if (Number.isNaN(utc)) return iso;
  const next = new Date(utc + days * MS_PER_DAY);
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, '0');
  const d = String(next.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysSigned(startISO: string, endISO: string): number {
  const start = parseISODateUTC(startISO);
  const end = parseISODateUTC(endISO);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / MS_PER_DAY);
}

export function getBudgetDurationDays(startISO: string, endISO: string): number {
  const diff = diffDaysSigned(startISO, endISO);
  return Math.max(1, diff + 1);
}

export function enumerateDatesISO(startISO: string, endISO: string): string[] {
  const total = diffDaysSigned(startISO, endISO) + 1;
  if (total <= 0) return [];
  const capped = Math.min(total, 1825); // safety cap ~5 years
  const result: string[] = [];
  for (let i = 0; i < capped; i++) {
    result.push(addDaysISO(startISO, i));
  }
  return result;
}

export function getMonthRangeISO(year: number, monthIndexZeroBased: number): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const start = new Date(Date.UTC(year, monthIndexZeroBased, 1));
  const end = new Date(Date.UTC(year, monthIndexZeroBased + 1, 0));
  const toISO = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate()
    ).padStart(2, '0')}`;
  const label = start.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return { startDate: toISO(start), endDate: toISO(end), label };
}

export function formatDisplayDate(
  iso: string,
  format: DateFormatOption = 'MMM DD, YYYY'
): string {
  const utc = parseISODateUTC(iso);
  if (Number.isNaN(utc)) return iso;
  const d = new Date(utc);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`;
    case 'MMM DD, YYYY':
    default:
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
  }
}

export function formatLongMonthDay(iso: string): string {
  const utc = parseISODateUTC(iso);
  if (Number.isNaN(utc)) return iso;
  return new Date(utc).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(iso: string): string {
  const utc = parseISODateUTC(iso);
  if (Number.isNaN(utc)) return iso;
  return new Date(utc).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatRelativeDayLabel(iso: string, todayISO: string = getTodayISO()): string {
  const diff = diffDaysSigned(iso, todayISO);
  if (diff === 0) {
    return `TODAY — ${formatLongMonthDay(iso)}`;
  }
  if (diff === 1) {
    return `YESTERDAY — ${formatLongMonthDay(iso)}`;
  }
  const utc = parseISODateUTC(iso);
  if (Number.isNaN(utc)) return iso;
  return new Date(utc).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}
