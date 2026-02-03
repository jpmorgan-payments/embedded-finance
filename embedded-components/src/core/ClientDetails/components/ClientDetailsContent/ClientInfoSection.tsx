import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import {
  formatApplicationStatus,
  formatDateTime,
  formatProducts,
} from '../../utils/formatClientFacing';
import { DetailRow } from '../DetailRow/DetailRow';

interface ClientInfoSectionProps {
  client: ClientResponse;
  title?: string;
}

export function ClientInfoSection({
  client,
  title = 'Client information',
}: ClientInfoSectionProps) {
  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-client-info' : undefined}
    >
      {title ? (
        <h2
          id="client-details-client-info"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      <dl className="eb-divide-y eb-divide-border/60">
        <DetailRow
          label="Application status"
          value={formatApplicationStatus(client.status)}
        />
        <DetailRow label="Products" value={formatProducts(client.products)} />
        <DetailRow label="Created" value={formatDateTime(client.createdAt)} />
      </dl>
    </section>
  );
}
