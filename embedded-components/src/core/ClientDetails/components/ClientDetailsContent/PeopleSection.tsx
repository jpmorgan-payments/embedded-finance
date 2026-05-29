/**
 * PeopleSection - Consolidated view of all individuals (controllers and beneficial owners)
 * Deduplicates individuals who have multiple roles, showing all roles for each person.
 */

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import {
  getBeneficialOwnerParties,
  getControllerParty,
} from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface PeopleSectionProps {
  client: ClientResponse;
  title?: string;
}

interface ConsolidatedPerson {
  party: PartyResponse;
  roles: string[];
}

/**
 * Consolidate controller and beneficial owners into a single list,
 * merging individuals who appear in both lists.
 */
function getConsolidatedPeople(client: ClientResponse): ConsolidatedPerson[] {
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);

  const peopleMap = new Map<string, ConsolidatedPerson>();

  // Add controller first
  if (controller) {
    const key = controller.id || 'controller';
    peopleMap.set(key, {
      party: controller,
      roles: ['Controller'],
    });
  }

  // Add beneficial owners, merging if same person
  beneficialOwners.forEach((owner, index) => {
    const key = owner.id || `owner-${index}`;

    if (peopleMap.has(key)) {
      // Same person - add the role
      const existing = peopleMap.get(key)!;
      if (!existing.roles.includes('Beneficial Owner')) {
        existing.roles.push('Beneficial Owner');
      }
    } else {
      // New person
      peopleMap.set(key, {
        party: owner,
        roles: ['Beneficial Owner'],
      });
    }
  });

  return Array.from(peopleMap.values());
}

export function PeopleSection({
  client,
  title = 'People',
}: PeopleSectionProps) {
  const people = getConsolidatedPeople(client);

  if (people.length === 0) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-people' : undefined}
    >
      {title ? (
        <h2
          id="client-details-people"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      <div className="eb-flex eb-flex-col eb-gap-4 @md:eb-gap-5">
        {people.map((person, index) => (
          <PartyDetailsBlock
            key={person.party.id || `person-${index}`}
            party={person.party}
            subheading={person.roles.join(' & ')}
            compact={people.length > 1}
          />
        ))}
      </div>
    </section>
  );
}
