import { Fragment } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { formatDateTime } from '../../utils/formatClientFacing';
import { DetailRow } from '../DetailRow/DetailRow';

interface ClientInfoSectionProps {
  client: ClientResponse;
  title?: string;
  headingLevel?: HeadingLevel;
}

export function ClientInfoSection({
  client,
  title,
  headingLevel = 2,
}: ClientInfoSectionProps) {
  const { t, i18n } = useTranslationWithTokens('client-details');
  const locale =
    i18n.resolvedLanguage
      ?.replace('_', '-')
      .replace('US', '-US')
      .replace('CA', '-CA') || 'en-US';

  const sectionTitle = title ?? t('sections.clientInfo');
  const Heading = getHeadingTag(headingLevel);

  // Format products using i18n — use Fragment interspersion so t() ReactNodes are preserved
  const productsDisplay = client.products?.length
    ? client.products.map((p, i) => (
        <Fragment key={p}>
          {i > 0 && ', '}
          {t(`products.${p}`, { defaultValue: p })}
        </Fragment>
      ))
    : t('emptyValue');

  // Format application status using i18n
  const statusDisplay = client.status
    ? t(`applicationStatuses.${client.status}`, { defaultValue: client.status })
    : t('emptyValue');

  return (
    <section
      className="eb-w-full"
      aria-labelledby={sectionTitle ? 'client-details-client-info' : undefined}
    >
      {sectionTitle ? (
        <Heading
          id="client-details-client-info"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {sectionTitle}
        </Heading>
      ) : null}
      <dl className="eb-divide-y eb-divide-border/60">
        <DetailRow
          label={t('labels.applicationStatus')}
          value={statusDisplay}
        />
        <DetailRow label={t('labels.products')} value={productsDisplay} />
        <DetailRow
          label={t('labels.created')}
          value={formatDateTime(client.createdAt, locale)}
        />
      </dl>
    </section>
  );
}
