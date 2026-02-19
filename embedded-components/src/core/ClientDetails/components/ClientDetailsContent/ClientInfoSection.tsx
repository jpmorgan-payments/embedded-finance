import { useTranslation } from 'react-i18next';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { formatDateTime } from '../../utils/formatClientFacing';
import { DetailRow } from '../DetailRow/DetailRow';

interface ClientInfoSectionProps {
  client: ClientResponse;
  title?: string;
}

export function ClientInfoSection({ client, title }: ClientInfoSectionProps) {
  const { t, i18n } = useTranslation('client-details');
  const locale =
    i18n.resolvedLanguage
      ?.replace('_', '-')
      .replace('US', '-US')
      .replace('CA', '-CA') || 'en-US';

  const sectionTitle = title ?? t('sections.clientInfo');

  // Format products using i18n
  const productsDisplay = client.products?.length
    ? client.products
        .map((p) => t(`products.${p}`, { defaultValue: p }))
        .join(', ')
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
        <h2
          id="client-details-client-info"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {sectionTitle}
        </h2>
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
