const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD en hora local (no UTC, para que "hoy" sea tu hoy). */
export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDay(key: string, opts: { days?: number; months?: number; years?: number }): string {
  const d = parseDay(key);
  const target = new Date(
    d.getFullYear() + (opts.years ?? 0),
    d.getMonth() + (opts.months ?? 0),
    d.getDate() + (opts.days ?? 0),
  );
  return dayKey(target);
}

const longFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const longYearFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatDay(key: string): string {
  const today = dayKey();
  if (key === today) return 'Hoy';
  if (key === shiftDay(today, { days: -1 })) return 'Ayer';
  const d = parseDay(key);
  return cap((d.getFullYear() === new Date().getFullYear() ? longFmt : longYearFmt).format(d));
}

export function formatLongDate(d: Date = new Date()): string {
  return cap(longFmt.format(d));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Buenas noches';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Días seguidos con al menos una entrada, contando hoy o ayer como último día. */
export function streak(days: Set<string>): number {
  let cursor = dayKey();
  if (!days.has(cursor)) cursor = shiftDay(cursor, { days: -1 });
  let n = 0;
  while (days.has(cursor)) {
    n++;
    cursor = shiftDay(cursor, { days: -1 });
  }
  return n;
}
