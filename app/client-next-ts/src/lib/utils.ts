import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a `YYYY-MM-DD` date. Uses UTC so the day never shifts in US time zones. */
export function formatIsoDate(
  isoDate: string,
  month: 'long' | 'short' = 'long'
): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  });
}
