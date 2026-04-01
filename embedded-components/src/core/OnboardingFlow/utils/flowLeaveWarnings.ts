import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { ClientStatus } from '@/api/generated/smbdo.schemas';

/**
 * SMBDO OpenAPI `ClientStatus` (`embedded-finance-pub-smbdo` ClientStatus schema):
 * APPROVED, DECLINED, INFORMATION_REQUESTED, NEW, REVIEW_IN_PROGRESS, SUSPENDED, TERMINATED.
 *
 * Leave/back prompts (`alertOnExit` / `alertOnPreviousStep`) apply only while the application
 * is in an editable pipeline state: draft (`NEW`) or responding to requests (`INFORMATION_REQUESTED`).
 * For every other status, sections are treated as read-only or terminal from a host UX perspective,
 * so we suppress unsaved-change prompts.
 *
 * When `clientData` is missing (e.g. before client create), we do not suppress.
 */
export function shouldSuppressOnboardingLeaveWarnings(
  clientData: ClientResponse | undefined
): boolean {
  const status = clientData?.status;
  if (status === undefined) {
    return false;
  }
  return (
    status !== ClientStatus.NEW && status !== ClientStatus.INFORMATION_REQUESTED
  );
}
