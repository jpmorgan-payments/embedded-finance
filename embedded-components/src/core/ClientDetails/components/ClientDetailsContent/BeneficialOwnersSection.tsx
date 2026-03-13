import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import { getBeneficialOwnerParties } from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface BeneficialOwnersSectionProps {
  client: ClientResponse;
  title?: string;
  headingLevel?: HeadingLevel;
}

export function BeneficialOwnersSection({
  client,
  title = 'Beneficial owners',
  headingLevel = 2,
}: BeneficialOwnersSectionProps) {
  const parties = getBeneficialOwnerParties(client);
  if (parties.length === 0) return null;

  const Heading = getHeadingTag(headingLevel);

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-beneficial-owners' : undefined}
    >
      {title ? (
        <Heading
          id="client-details-beneficial-owners"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </Heading>
      ) : null}
      <div className="eb-flex eb-flex-col eb-gap-4 @md:eb-gap-5">
        {parties.map((party: PartyResponse, index: number) => (
          <PartyDetailsBlock
            key={`beneficial-owner-${index}`}
            party={party}
            subheading="Beneficial owner"
            compact
          />
        ))}
      </div>
    </section>
  );
}
