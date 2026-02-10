import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { getOrganizationParty } from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface OrganizationSectionProps {
  client: ClientResponse;
  title?: string;
}

export function OrganizationSection({
  client,
  title = 'Organization',
}: OrganizationSectionProps) {
  const party = getOrganizationParty(client);
  if (!party) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-organization' : undefined}
    >
      {title ? (
        <h2
          id="client-details-organization"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      <PartyDetailsBlock party={party} />
    </section>
  );
}
