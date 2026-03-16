import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { getOrganizationParty } from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface OrganizationSectionProps {
  client: ClientResponse;
  title?: string;
  headingLevel?: HeadingLevel;
}

export function OrganizationSection({
  client,
  title = 'Organization',
  headingLevel = 2,
}: OrganizationSectionProps) {
  const party = getOrganizationParty(client);
  if (!party) return null;

  const Heading = getHeadingTag(headingLevel);

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-organization' : undefined}
    >
      {title ? (
        <Heading
          id="client-details-organization"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </Heading>
      ) : null}
      <PartyDetailsBlock party={party} />
    </section>
  );
}
