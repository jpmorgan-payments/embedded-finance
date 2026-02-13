/**
 * ClientDetails - Displays all information for a fully onboarded ACTIVE client
 * from GET /clients/:id. Supports summary, accordion and cards view modes.
 */

import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Skeleton } from '@/components/ui';

import { CLIENT_DETAILS_DEFAULT_VIEW_MODE } from './ClientDetails.constants';
import type { ClientDetailsProps, ClientSection } from './ClientDetails.types';
import { AccordionView } from './components/AccordionView/AccordionView';
import { CardsView } from './components/CardsView/CardsView';
import { SectionSheet } from './components/DrillDown/SectionSheet';
import { ClientSummaryCard } from './components/Summary/ClientSummaryCard';
import type { SectionInfo } from './components/Summary/SectionList';
import { getSectionIcon } from './components/Summary/SectionList';
import {
  getBeneficialOwnerParties,
  getControllerParty,
  getOrganizationParty,
} from './utils/partyGrouping';

const DEFAULT_TITLE = 'Client details';

const DEFAULT_SECTIONS: ClientSection[] = [
  'identity',
  'verification',
  'ownership',
  'compliance',
];

function buildSectionInfos(
  client: ClientResponse,
  enabledSections: ClientSection[]
): SectionInfo[] {
  const org = getOrganizationParty(client);
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);
  const kycStatus = client.results?.customerIdentityStatus;
  const pendingDocs = client.outstanding?.documentRequestIds?.length ?? 0;
  const pendingQuestions = client.outstanding?.questionIds?.length ?? 0;

  const allSections: SectionInfo[] = [
    {
      id: 'identity',
      label: 'Identity & Organization',
      icon: getSectionIcon('identity'),
      description: org?.organizationDetails?.organizationName,
      status: org ? 'complete' : 'pending',
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: getSectionIcon('verification'),
      description: kycStatus
        ? kycStatus.replace(/_/g, ' ').toLowerCase()
        : undefined,
      status:
        kycStatus === 'APPROVED'
          ? 'complete'
          : kycStatus === 'INFORMATION_REQUESTED'
            ? 'warning'
            : 'pending',
    },
    {
      id: 'ownership',
      label: 'Ownership',
      icon: getSectionIcon('ownership'),
      badge:
        beneficialOwners.length > 0
          ? `${beneficialOwners.length + (controller ? 1 : 0)}`
          : undefined,
      description: controller
        ? `Controller + ${beneficialOwners.length} beneficial owner${beneficialOwners.length !== 1 ? 's' : ''}`
        : undefined,
      status:
        beneficialOwners.length > 0 || controller ? 'complete' : 'pending',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: getSectionIcon('compliance'),
      badge:
        pendingDocs + pendingQuestions > 0
          ? `${pendingDocs + pendingQuestions} pending`
          : undefined,
      status:
        pendingDocs + pendingQuestions > 0
          ? 'warning'
          : client.questionResponses?.length
            ? 'complete'
            : 'pending',
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: getSectionIcon('accounts'),
      description: 'View linked accounts',
    },
    {
      id: 'activity',
      label: 'Recent Activity',
      icon: getSectionIcon('activity'),
      description: 'View transactions',
    },
  ];

  return allSections.filter((s) => enabledSections.includes(s.id));
}

export function ClientDetails({
  clientId,
  viewMode = CLIENT_DETAILS_DEFAULT_VIEW_MODE,
  title = DEFAULT_TITLE,
  className,
  sections = DEFAULT_SECTIONS,
  enableDrillDown = true,
  onSectionClick,
  actions,
}: ClientDetailsProps) {
  const [activeSection, setActiveSection] = useState<ClientSection | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data: client,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSmbdoGetClient(clientId, {
    query: { enabled: !!clientId },
  });

  // Build section info for navigation
  const sectionInfos = useMemo(
    () => (client ? buildSectionInfos(client, sections) : []),
    [client, sections]
  );

  const handleSectionClick = (section: ClientSection) => {
    // If external handler provided, call it
    if (onSectionClick) {
      onSectionClick(section);
      return;
    }

    // Otherwise, use built-in drill-down if enabled
    if (enableDrillDown) {
      setActiveSection(section);
      setSheetOpen(true);
    }
  };

  if (!clientId) {
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-rounded-lg eb-border eb-border-dashed eb-border-border eb-bg-muted/30 eb-p-6 eb-text-center eb-text-sm eb-text-muted-foreground',
          className
        )}
      >
        Client ID is required.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-space-y-4 eb-px-4 eb-py-4 @md:eb-px-6',
          className
        )}
      >
        <Skeleton className="eb-h-6 eb-w-40 eb-rounded" />
        <div className="eb-space-y-3">
          <Skeleton className="eb-h-4 eb-w-full eb-rounded" />
          <Skeleton className="eb-h-4 eb-w-5/6 eb-rounded" />
          <Skeleton className="eb-h-4 eb-w-4/6 eb-rounded" />
          <Skeleton className="eb-h-20 eb-w-full eb-rounded" />
        </div>
      </div>
    );
  }

  if (isError || !client) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message)
        : 'Failed to load client details.';
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-rounded-lg eb-border eb-border-destructive/50 eb-bg-destructive/10 eb-p-4 eb-text-sm eb-text-destructive',
          className
        )}
      >
        {message}
      </div>
    );
  }

  // Summary view mode - compact card with drill-down
  if (viewMode === 'summary') {
    return (
      <>
        <ClientSummaryCard
          client={client}
          onSectionClick={handleSectionClick}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
          sections={sections}
          actions={actions}
          className={cn('eb-component', className)}
        />
        {enableDrillDown && !onSectionClick && (
          <SectionSheet
            client={client}
            clientId={clientId}
            section={activeSection}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            sections={sectionInfos}
            onNavigate={setActiveSection}
          />
        )}
      </>
    );
  }

  // Accordion and Cards view modes - full detail views
  return (
    <div
      className={cn(
        'eb-component eb-flex eb-w-full eb-max-w-full eb-flex-col',
        className
      )}
    >
      <header className="eb-flex eb-min-h-[48px] eb-items-center eb-border-b eb-border-border eb-px-4 eb-py-3 @md:eb-px-6">
        <h1 className="eb-text-base eb-font-semibold eb-tracking-tight">
          {title}
        </h1>
      </header>
      <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-y-auto eb-p-4 @md:eb-px-6 @md:eb-py-5">
        {viewMode === 'accordion' ? (
          <AccordionView client={client} />
        ) : (
          <CardsView client={client} />
        )}
      </div>
    </div>
  );
}
