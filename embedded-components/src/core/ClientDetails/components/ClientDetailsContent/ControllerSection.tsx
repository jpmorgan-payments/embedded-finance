import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { getControllerParty } from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface ControllerSectionProps {
  client: ClientResponse;
  title?: string;
}

export function ControllerSection({
  client,
  title = 'Controller',
}: ControllerSectionProps) {
  const party = getControllerParty(client);
  if (!party) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-controller' : undefined}
    >
      {title ? (
        <h2
          id="client-details-controller"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      <PartyDetailsBlock party={party} subheading="Controller" />
    </section>
  );
}
