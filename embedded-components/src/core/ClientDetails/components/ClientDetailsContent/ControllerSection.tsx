import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { getControllerParty } from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface ControllerSectionProps {
  client: ClientResponse;
  title?: string;
  headingLevel?: HeadingLevel;
}

export function ControllerSection({
  client,
  title = 'Controller',
  headingLevel = 2,
}: ControllerSectionProps) {
  const party = getControllerParty(client);
  if (!party) return null;

  const Heading = getHeadingTag(headingLevel);

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-controller' : undefined}
    >
      {title ? (
        <Heading
          id="client-details-controller"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </Heading>
      ) : null}
      <PartyDetailsBlock party={party} subheading="Controller" />
    </section>
  );
}
