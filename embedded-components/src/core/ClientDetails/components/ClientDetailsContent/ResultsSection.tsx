import { useTranslation } from 'react-i18next';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { DetailRow } from '../DetailRow/DetailRow';

interface ResultsSectionProps {
  client: ClientResponse;
  title?: string;
}

/**
 * Verification results = KYC / customer identity verification outcome
 * (e.g. APPROVED, NOT_STARTED, REVIEW_IN_PROGRESS, INFORMATION_REQUESTED).
 */
export function ResultsSection({ client, title }: ResultsSectionProps) {
  const { t } = useTranslation('client-details');
  const { results } = client;
  if (!results) return null;

  const sectionTitle = title ?? t('sections.verificationResults');

  // Format identity status using i18n
  const statusDisplay = results.customerIdentityStatus
    ? t(`identityStatuses.${results.customerIdentityStatus}`, {
        defaultValue: results.customerIdentityStatus,
      })
    : t('emptyValue');

  return (
    <section
      className="eb-w-full"
      aria-labelledby={sectionTitle ? 'client-details-results' : undefined}
    >
      {sectionTitle ? (
        <h2
          id="client-details-results"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {sectionTitle}
        </h2>
      ) : null}
      <dl className="eb-divide-y eb-divide-border/60">
        <DetailRow
          label={t('labels.identityVerification')}
          value={statusDisplay}
        />
      </dl>
    </section>
  );
}
