import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import { getBeneficialOwnerParties } from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface BeneficialOwnersSectionProps {
  client: ClientResponse;
  title?: string;
}

export function BeneficialOwnersSection({
  client,
  title = 'Beneficial owners',
}: BeneficialOwnersSectionProps) {
  const parties = getBeneficialOwnerParties(client);
  if (parties.length === 0) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-beneficial-owners' : undefined}
    >
      {title ? (
        <h2
          id="client-details-beneficial-owners"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
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
