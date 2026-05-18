import type {
  ClientResponse,
  ClientStatus,
} from '@/api/generated/smbdo.schemas';

/**
 * Whether the host may start / continue linking for the current client.
 * Must match `OverviewScreen` and `FlowRenderer` so the timeline and overview stay in sync.
 *
 * When `linkAccountEnabledStatuses` is omitted, mirrors overview: allow for post-submitted
 * review states as well as `APPROVED` (not `APPROVED`-only).
 */
export function getLinkAccountEnabled(
  clientData: ClientResponse | undefined,
  linkAccountEnabledStatuses: ClientStatus[] | undefined
): boolean {
  const status = clientData?.status as ClientStatus | undefined;
  if (!status) return false;

  if (linkAccountEnabledStatuses?.length) {
    return linkAccountEnabledStatuses.includes(status);
  }

  return (
    status === 'APPROVED' ||
    status === 'INFORMATION_REQUESTED' ||
    status === 'REVIEW_IN_PROGRESS'
  );
}
