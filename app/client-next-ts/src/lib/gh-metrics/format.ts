import { format, parseISO } from 'date-fns';

export const formatNumber = (n: number) => n.toLocaleString('en-US');

export const formatDay = (iso: string) => format(parseISO(iso), 'MMM d, yyyy');

export const formatShortDay = (iso: string) => format(parseISO(iso), 'MMM d');

export const formatMonth = (month: string) =>
  format(parseISO(`${month}-01`), 'MMM yyyy');

export function formatSpan(from: string, to: string): string {
  if (from === to) return formatDay(from);
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${formatShortDay(from)} – ${formatDay(to)}`;
  }
  return `${formatDay(from)} – ${formatDay(to)}`;
}

/** `+25%`, `−40%`, or `3.2×` once a value has at least doubled. */
export function formatChange(change: number): string {
  if (change >= 1) return `${(change + 1).toFixed(1)}×`;
  const pct = Math.round(Math.abs(change) * 100);
  if (pct === 0) return '0%';
  return `${change > 0 ? '+' : '−'}${pct}%`;
}
