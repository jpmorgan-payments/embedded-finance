/**
 * PeopleDetailsContent - Displays people details following BusinessDetailsContent pattern
 * Uses Section/DetailRow pattern with Separator dividers for controllers and beneficial owners
 */

import { useState } from 'react';
import { useTranslationWithTokens } from '@/hooks';
import {
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { formatSSN } from '../../utils/formatClientFacing';
import {
  getBeneficialOwnerParties,
  getControllerParty,
} from '../../utils/partyGrouping';

interface PeopleDetailsContentProps {
  client: ClientResponse;
}

// Helper Components (matching BusinessDetailsContent pattern)
interface SectionProps {
  /** Either a title string or content to display as the section heading */
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="eb-space-y-3">
    <h3 className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-semibold eb-text-foreground">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

interface DetailRowProps {
  /** Label ID - used to derive label from t(`peopleLabels.${labelId}`) */
  labelId: string;
  value: React.ReactNode;
  small?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ labelId, value, small }) => {
  const { t } = useTranslationWithTokens('client-details');
  if (!value) return null;
  // Type assertion needed for dynamic keys
  const translatedLabel = t(
    `peopleLabels.${labelId}` as 'peopleLabels.jobTitle'
  );
  return (
    <div className="eb-flex eb-items-center eb-justify-between">
      <span
        className={cn('eb-text-muted-foreground', {
          'eb-text-xs': small,
          'eb-text-sm': !small,
        })}
      >
        {translatedLabel}
      </span>
      <span
        className={cn('eb-text-right eb-font-medium', {
          'eb-text-xs': small,
          'eb-text-sm': !small,
        })}
      >
        {value}
      </span>
    </div>
  );
};

interface MaskedValueProps {
  value: string;
  maskedValue: string;
}

/** Masked value display with show/hide toggle. Uses i18n internally for aria-labels. */
const MaskedValue: React.FC<MaskedValueProps> = ({ value, maskedValue }) => {
  const { tString } = useTranslationWithTokens('client-details');
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="eb-inline-flex eb-items-center eb-gap-1">
      <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide">
        {isVisible ? value : maskedValue}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="eb-h-6 eb-w-6"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={
          isVisible
            ? tString('maskedValue.hideValue')
            : tString('maskedValue.showValue')
        }
      >
        {isVisible ? (
          <EyeOffIcon className="eb-h-3.5 eb-w-3.5" />
        ) : (
          <EyeIcon className="eb-h-3.5 eb-w-3.5" />
        )}
      </Button>
    </span>
  );
};

interface PersonDetailsProps {
  party: PartyResponse;
  /** The role label to display - can be a translated ReactNode */
  roleLabel: React.ReactNode;
}

function PersonDetails({ party, roleLabel }: PersonDetailsProps) {
  const { t, tString } = useTranslationWithTokens('client-details');
  const individual = party.individualDetails;
  const address = individual?.addresses?.[0];
  const phone = individual?.phone;
  const ssn = individual?.individualIds?.find((id) => id.idType === 'SSN');

  // Get display name
  const displayName = [
    individual?.firstName,
    individual?.middleName,
    individual?.lastName,
    individual?.nameSuffix,
  ]
    .filter(Boolean)
    .join(' ');

  // Format address lines
  const addressLines = address
    ? [
        address.addressLines?.join(' '),
        [address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(', '),
        address.country,
      ].filter(Boolean)
    : null;

  return (
    <Section
      title={displayName || tString('labels.unknownPerson')}
      icon={<UserIcon className="eb-h-4 eb-w-4" />}
    >
      <div className="eb-space-y-3">
        {/* Role subtitle */}
        <p className="eb-text-xs eb-text-muted-foreground">{roleLabel}</p>

        {/* Basic Information */}
        {individual?.jobTitle && (
          <DetailRow labelId="jobTitle" value={individual.jobTitle} />
        )}
        {individual?.birthDate && (
          <DetailRow labelId="birthDate" value={individual.birthDate} />
        )}
        {ssn?.value && (
          <DetailRow
            labelId="ssn"
            value={
              <MaskedValue
                value={formatSSN(ssn.value) || ssn.value}
                maskedValue={`***-**-${ssn.value.slice(-4)}`}
              />
            }
          />
        )}

        {/* Contact Information */}
        {(party.email || phone?.phoneNumber) && (
          <div className="eb-space-y-2 eb-pt-1">
            {party.email && (
              <div className="eb-flex eb-items-center eb-gap-2">
                <MailIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                <a
                  href={`mailto:${party.email}`}
                  className="eb-text-sm eb-text-primary hover:eb-underline"
                >
                  {party.email}
                </a>
              </div>
            )}
            {phone?.phoneNumber && (
              <div className="eb-flex eb-items-center eb-gap-2">
                <PhoneIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                <span className="eb-text-sm">
                  {phone.countryCode} {phone.phoneNumber}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Address */}
        {addressLines && (
          <div className="eb-flex eb-gap-2 eb-pt-1">
            <MapPinIcon className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground" />
            <div className="eb-text-sm">
              {addressLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
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

export function PeopleDetailsContent({ client }: PeopleDetailsContentProps) {
  const { t } = useTranslationWithTokens('client-details');
  const people = getConsolidatedPeople(client);

  if (people.length === 0) {
    return (
      <p className="eb-text-sm eb-text-muted-foreground">
        {t('labels.noOwnershipInfo')}
      </p>
    );
  }

  return (
    <div className="eb-space-y-5">
      {people.map((person, index) => {
        // Build role label by combining individual role tokens
        const roles: React.ReactNode[] = [];
        if (person.roles.includes('Controller')) {
          roles.push(t('roles.CONTROLLER'));
        }
        if (person.roles.includes('Beneficial Owner')) {
          roles.push(t('roles.BENEFICIAL_OWNER'));
        }

        // Join with ' & ' separator, handling ReactNodes properly
        const roleLabel = roles.reduce<React.ReactNode[]>(
          (acc, role, i) => (i === 0 ? [role] : [...acc, ' & ', role]),
          []
        );

        return (
          <div key={person.party.id || `person-${index}`}>
            {index > 0 && <Separator className="eb-mb-5" />}
            <PersonDetails party={person.party} roleLabel={roleLabel} />
          </div>
        );
      })}
    </div>
  );
}
