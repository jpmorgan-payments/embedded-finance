import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  Building,
  CheckCircle2,
  CircleDotIcon,
  Loader2Icon,
  PencilIcon,
  User,
} from 'lucide-react';

import {
  getSmbdoGetClientQueryKey,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { asPlainString } from '@/core/OnboardingFlow/utils/dataUtils';

type PartyCompletionStatus = 'not-started' | 'incomplete' | 'complete';

function getIndirectParties(clientData?: ClientResponse): PartyResponse[] {
  if (!clientData?.parties) return [];
  return clientData.parties.filter(
    (party) =>
      party.active &&
      party.roles?.includes('BENEFICIAL_OWNER') &&
      party.parentPartyId !== undefined
  );
}

function getPartyCompletionStatus(party: PartyResponse): PartyCompletionStatus {
  if (party.partyType === 'ORGANIZATION') {
    const org = party.organizationDetails;
    if (!org) return 'not-started';
    // Requires: organizationType, organizationIds, addresses, countryOfFormation
    const hasType = !!org.organizationType;
    const hasIds =
      org.organizationIds && org.organizationIds.length > 0;
    const hasAddress = org.addresses && org.addresses.length > 0;
    const hasCountry = !!org.countryOfFormation;
    if (hasType && hasIds && hasAddress && hasCountry) return 'complete';
    if (hasType || hasIds || hasAddress || hasCountry) return 'incomplete';
    return 'not-started';
  }

  // Individual beneficial owners — check standard fields
  const ind = party.individualDetails;
  if (!ind) return 'not-started';
  const hasDob = !!ind.birthDate;
  const hasAddress =
    ind.addresses && ind.addresses.length > 0;
  const hasCountry = !!ind.countryOfResidence;
  if (hasDob && hasAddress && hasCountry) return 'complete';
  if (hasDob || hasAddress || hasCountry) return 'incomplete';
  return 'not-started';
}

function getPartyDisplayName(party: PartyResponse): string {
  if (party.partyType === 'ORGANIZATION') {
    return (
      party.organizationDetails?.organizationName || 'Unnamed Organization'
    );
  }
  const first = party.individualDetails?.firstName || '';
  const last = party.individualDetails?.lastName || '';
  return `${first} ${last}`.trim() || 'Unnamed Owner';
}

const statusConfig: Record<
  PartyCompletionStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }
> = {
  'not-started': {
    label: 'Not started',
    variant: 'outline',
    className: 'eb-border-muted-foreground/50 eb-text-muted-foreground',
  },
  incomplete: {
    label: 'Incomplete',
    variant: 'secondary',
    className: 'eb-border-orange-300 eb-bg-orange-50 eb-text-orange-700',
  },
  complete: {
    label: 'Complete',
    variant: 'default',
    className: 'eb-border-green-300 eb-bg-green-50 eb-text-green-700',
  },
};

export const IndirectOwnerDetailsScreen = () => {
  const { clientData } = useOnboardingContext();
  const { goTo, goBack } = useFlowContext();
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  const indirectParties = getIndirectParties(clientData);

  const individualParties = indirectParties.filter(
    (p) => p.partyType === 'INDIVIDUAL'
  );
  const orgParties = indirectParties.filter(
    (p) => p.partyType === 'ORGANIZATION'
  );

  const allComplete = indirectParties.every(
    (p) => getPartyCompletionStatus(p) === 'complete'
  );

  const handleEditIndividual = (partyId: string) => {
    goTo('owner-stepper', {
      editingPartyId: partyId,
      shortLabelOverride: 'Edit owner details',
    });
  };

  const handleEditOrganization = (partyId: string) => {
    goTo('intermediary-stepper', {
      editingPartyId: partyId,
      shortLabelOverride: 'Edit intermediary details',
    });
  };

  const handleContinue = () => {
    goTo('additional-questions-section');
  };

  return (
    <StepLayout
      title="Provide Details for Owners & Entities"
      subTitle={
        <Button
          variant="link"
          onClick={() => goBack()}
          className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
        >
          <ArrowLeftIcon className="eb-size-3.5" />
          Back to ownership structure
        </Button>
      }
      description="Please provide the required information for each owner and intermediary entity identified in your ownership structure."
    >
      <div className="eb-mt-6 eb-space-y-6">
        {/* Individual Beneficial Owners */}
        {individualParties.length > 0 && (
          <section className="eb-space-y-3">
            <h3 className="eb-text-sm eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground">
              Beneficial Owners
            </h3>
            {individualParties.map((party) => {
              const status = getPartyCompletionStatus(party);
              const config = statusConfig[status];
              return (
                <PartyCard
                  key={party.id}
                  party={party}
                  statusLabel={config.label}
                  statusClassName={config.className}
                  icon={<User className="eb-size-5 eb-text-primary" />}
                  onEdit={() => party.id && handleEditIndividual(party.id)}
                />
              );
            })}
          </section>
        )}

        {/* Intermediary Organizations */}
        {orgParties.length > 0 && (
          <section className="eb-space-y-3">
            <h3 className="eb-text-sm eb-font-semibold eb-uppercase eb-tracking-wide eb-text-muted-foreground">
              Intermediary Entities
            </h3>
            {orgParties.map((party) => {
              const status = getPartyCompletionStatus(party);
              const config = statusConfig[status];
              return (
                <PartyCard
                  key={party.id}
                  party={party}
                  statusLabel={config.label}
                  statusClassName={config.className}
                  icon={<Building className="eb-size-5 eb-text-primary" />}
                  onEdit={() => party.id && handleEditOrganization(party.id)}
                />
              );
            })}
          </section>
        )}

        {indirectParties.length === 0 && (
          <Card className="eb-p-6 eb-text-center eb-text-muted-foreground">
            No indirect parties found. Please go back and complete your
            ownership structure first.
          </Card>
        )}
      </div>

      {/* Continue Button */}
      <div className="eb-mt-6">
        <Button
          type="button"
          variant="default"
          size="lg"
          className="eb-h-auto eb-min-h-11 eb-w-full eb-text-wrap eb-text-lg"
          onClick={handleContinue}
          disabled={!allComplete && indirectParties.length > 0}
        >
          {allComplete
            ? 'Save and Continue'
            : `Complete all details to continue (${indirectParties.filter((p) => getPartyCompletionStatus(p) === 'complete').length}/${indirectParties.length})`}
        </Button>
      </div>
    </StepLayout>
  );
};

// ── PartyCard sub-component ──────────────────────────────────────────────

interface PartyCardProps {
  party: PartyResponse;
  statusLabel: string;
  statusClassName: string;
  icon: React.ReactNode;
  onEdit: () => void;
}

const PartyCard: React.FC<PartyCardProps> = ({
  party,
  statusLabel,
  statusClassName,
  icon,
  onEdit,
}) => {
  const name = getPartyDisplayName(party);
  const status = getPartyCompletionStatus(party);
  const isOrg = party.partyType === 'ORGANIZATION';
  const roleLabel = isOrg ? 'Intermediary Entity' : 'Indirect Beneficial Owner';

  return (
    <Card className="eb-flex eb-items-center eb-justify-between eb-rounded-lg eb-border eb-p-4">
      <div className="eb-flex eb-items-center eb-gap-3">
        <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
          {icon}
        </div>
        <div className="eb-space-y-1">
          <CardTitle className="eb-text-base eb-font-semibold eb-tracking-tight">
            {name}
          </CardTitle>
          <p className="eb-text-xs eb-text-muted-foreground">{roleLabel}</p>
        </div>
      </div>
      <div className="eb-flex eb-items-center eb-gap-3">
        <Badge variant="outline" className={statusClassName}>
          {status === 'complete' && (
            <CheckCircle2 className="eb-mr-1 eb-size-3" />
          )}
          {status === 'incomplete' && (
            <CircleDotIcon className="eb-mr-1 eb-size-3" />
          )}
          {statusLabel}
        </Badge>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <PencilIcon className="eb-size-3.5" />
          {status === 'not-started' ? 'Start' : 'Edit'}
        </Button>
      </div>
    </Card>
  );
};
