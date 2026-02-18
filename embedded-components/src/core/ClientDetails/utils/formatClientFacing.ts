/**
 * Client-facing formatters: no internal IDs, human-readable labels and values.
 */

import type {
  ClientProductList,
  ClientQuestionResponse,
} from '@/api/generated/smbdo.schemas';

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  INFORMATION_REQUESTED: 'Information requested',
  NEW: 'New',
  REVIEW_IN_PROGRESS: 'Review in progress',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
};

const CUSTOMER_IDENTITY_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approved',
  INFORMATION_REQUESTED: 'Information requested',
  NOT_STARTED: 'Not started',
  REVIEW_IN_PROGRESS: 'Review in progress',
};

const PRODUCT_LABELS: Record<string, string> = {
  EMBEDDED_PAYMENTS: 'Embedded Payments',
  MERCHANT_SERVICES: 'Merchant Services',
};

export function formatApplicationStatus(status: string | undefined): string {
  if (!status) return '—';
  return (
    STATUS_LABELS[status] ??
    status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function formatProducts(
  products: ClientProductList | undefined
): string {
  if (!products?.length) return '—';
  return products
    .map(
      (p) =>
        PRODUCT_LABELS[p] ??
        p
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(', ');
}

export function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatCustomerIdentityStatus(
  status: string | undefined
): string {
  if (!status) return '—';
  return (
    CUSTOMER_IDENTITY_STATUS_LABELS[status] ??
    status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format question response value for display (e.g. currency for known question IDs).
 */
export function formatQuestionResponseValue(
  response: ClientQuestionResponse
): string {
  if (response.questionId === '30005') {
    return currencyFormatter.format(Number(response.values?.[0]) || 0);
  }
  const raw = response.values?.join(', ') ?? '—';
  if (raw === 'false') return 'No';
  if (raw === 'true') return 'Yes';
  return raw;
}

/** Role labels for C2 client-facing display (no internal enum raw values). */
const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  CONTROLLER: 'Controller',
  BENEFICIAL_OWNER: 'Beneficial owner',
};

export function formatRoleLabels(
  roles: string[] | undefined
): string | undefined {
  if (!roles?.length) return undefined;
  return roles
    .map(
      (r) =>
        ROLE_LABELS[r] ??
        r
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(', ');
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
