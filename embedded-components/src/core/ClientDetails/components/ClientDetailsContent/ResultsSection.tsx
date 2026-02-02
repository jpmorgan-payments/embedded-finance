import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { formatCustomerIdentityStatus } from '../../utils/formatClientFacing';
import { DetailRow } from '../DetailRow/DetailRow';

interface ResultsSectionProps {
  client: ClientResponse;
  title?: string;
}

/**
 * Verification results = KYC / customer identity verification outcome
 * (e.g. APPROVED, NOT_STARTED, REVIEW_IN_PROGRESS, INFORMATION_REQUESTED).
 */
export function ResultsSection({
  client,
  title = 'Verification results',
}: ResultsSectionProps) {
  const results = client.results;
  if (!results) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-results' : undefined}
    >
      {title ? (
        <h2
          id="client-details-results"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      <dl className="eb-divide-y eb-divide-border/60">
        <DetailRow
          label="Customer identity status"
          value={formatCustomerIdentityStatus(results.customerIdentityStatus)}
        />
      </dl>
    </section>
  );
}
