/**
 * Client-facing formatters: utility functions for formatting values.
 * Labels and translations should be handled via i18n in components.
 */

import type { ClientQuestionResponse } from '@/api/generated/smbdo.schemas';

/**
 * Format EIN (Employer Identification Number) with dashes.
 * Input: 123456789 → Output: 12-3456789
 * @param ein - Raw EIN string (9 digits)
 */
export function formatEIN(ein: string | undefined): string | undefined {
  if (!ein) return undefined;
  // Remove any existing dashes/spaces
  const cleaned = ein.replace(/[-\s]/g, '');
  if (cleaned.length !== 9) return ein; // Return as-is if not 9 digits
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
}

/**
 * Format SSN (Social Security Number) with dashes.
 * Input: 123456789 → Output: 123-45-6789
 * @param ssn - Raw SSN string (9 digits)
 */
export function formatSSN(ssn: string | undefined): string | undefined {
  if (!ssn) return undefined;
  // Remove any existing dashes/spaces
  const cleaned = ssn.replace(/[-\s]/g, '');
  if (cleaned.length !== 9) return ssn; // Return as-is if not 9 digits
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

/**
 * Format ISO date string for display.
 * @param isoString - ISO date string
 * @param locale - Locale for formatting (e.g., 'en-US', 'fr-CA')
 */
export function formatDateTime(
  isoString: string | undefined,
  locale = 'en-US'
): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format currency value for display.
 * @param value - Numeric value
 * @param locale - Locale for formatting (e.g., 'en-US', 'fr-CA')
 * @param currency - Currency code (default: 'USD')
 */
export function formatCurrency(
  value: number,
  locale = 'en-US',
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format question response value for display (e.g. currency for known question IDs).
 * Note: Boolean values (true/false) are returned as-is; components should use i18n to translate.
 * @param response - Question response object
 * @param locale - Locale for formatting
 */
export function formatQuestionResponseValue(
  response: ClientQuestionResponse,
  locale = 'en-US'
): string {
  if (response.questionId === '30005') {
    return formatCurrency(Number(response.values?.[0]) || 0, locale);
  }
  return response.values?.join(', ') ?? '—';
}

/**
 * Job title for display: "Other" shows as "Other - {jobTitleDescription}"; otherwise title-cased label.
 */
export function formatJobTitleDisplay(
  individualDetails:
    | {
        jobTitle?: string;
        jobTitleDescription?: string;
      }
    | undefined
): string | undefined {
  if (!individualDetails?.jobTitle) return undefined;
  const { jobTitle, jobTitleDescription } = individualDetails;
  if (jobTitle === 'Other' && jobTitleDescription) {
    return `Other – ${jobTitleDescription}`;
  }
  return jobTitle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
