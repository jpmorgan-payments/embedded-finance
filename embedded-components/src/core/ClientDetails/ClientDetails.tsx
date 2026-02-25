/**
 * ClientDetails - Displays all information for a fully onboarded ACTIVE client
 * from GET /clients/:id. Supports summary, accordion and cards view modes.
 */

import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { useTranslationWithTokens } from '@/components/i18n';

import { CLIENT_DETAILS_DEFAULT_VIEW_MODE } from './ClientDetails.constants';
import type { ClientDetailsProps, ClientSection } from './ClientDetails.types';
import { AccordionView } from './components/AccordionView/AccordionView';
import { CardsView } from './components/CardsView/CardsView';
import { ClientDetailsSkeleton } from './components/ClientDetailsSkeleton';
import { ClientSummaryCard } from './components/Summary/ClientSummaryCard';
import type { SectionInfo } from './components/Summary/SectionList';
import { getSectionIcon } from './components/Summary/SectionList';
import {
  getBeneficialOwnerParties,
  getControllerParty,
  getOrganizationParty,
} from './utils/partyGrouping';

const DEFAULT_SECTIONS: ClientSection[] = ['identity', 'ownership'];

export function ClientDetails({
  clientId,
  viewMode = CLIENT_DETAILS_DEFAULT_VIEW_MODE,
  className,
  sections = DEFAULT_SECTIONS,
  enableDrillDown = true,
  onSectionClick,
  actions,
}: ClientDetailsProps) {
  const { t } = useTranslationWithTokens('client-details');

  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useSmbdoGetClient(clientId, {
    query: { enabled: !!clientId },
  });

  // Build section info for navigation - uses t() with template literals for dynamic keys
  const sectionInfos = useMemo(() => {
    if (!client) return [];

    const org = getOrganizationParty(client);
    const controller = getControllerParty(client);
    const beneficialOwners = getBeneficialOwnerParties(client);
    const kycStatus = client.results?.customerIdentityStatus;
    const pendingDocs = client.outstanding?.documentRequestIds?.length ?? 0;
    const pendingQuestions = client.outstanding?.questionIds?.length ?? 0;
    const totalPending = pendingDocs + pendingQuestions;

    const allSections: SectionInfo[] = [
      {
        id: 'identity',
        icon: getSectionIcon('identity'),
        description: org?.organizationDetails?.organizationName,
        status: org ? 'complete' : 'pending',
      },
      {
        id: 'verification',
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
        icon: getSectionIcon('ownership'),
        badge:
          beneficialOwners.length > 0
            ? `${beneficialOwners.length + (controller ? 1 : 0)}`
            : undefined,
        description: controller
          ? t('sectionDescriptions.controllerWithOwners', {
              count: beneficialOwners.length,
            })
          : undefined,
        status:
          beneficialOwners.length > 0 || controller ? 'complete' : 'pending',
      },
      {
        id: 'compliance',
        icon: getSectionIcon('compliance'),
        badge:
          totalPending > 0
            ? t('sectionDescriptions.pending', { count: totalPending })
            : undefined,
        status:
          totalPending > 0
            ? 'warning'
            : client.questionResponses?.length
              ? 'complete'
              : 'pending',
      },
      {
        id: 'accounts',
        icon: getSectionIcon('accounts'),
        description: t('sectionDescriptions.viewAccounts'),
      },
      {
        id: 'activity',
        icon: getSectionIcon('activity'),
        description: t('sectionDescriptions.viewTransactions'),
      },
    ];

    return allSections.filter((s) => sections.includes(s.id));
  }, [client, sections, t]);

  if (!clientId) {
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-rounded-lg eb-border eb-border-dashed eb-border-border eb-bg-muted/30 eb-p-6 eb-text-center eb-text-sm eb-text-muted-foreground',
          className
        )}
      >
        {t('errors.clientIdRequired')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <ClientDetailsSkeleton
        viewMode={viewMode}
        className={cn('eb-component', className)}
      />
    );
  }

  if (isError || !client) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message)
        : t('errors.loadFailed');
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

  // Summary view mode - compact card with built-in Dialog drill-down
  if (viewMode === 'summary') {
    // Priority: external handler > built-in dialog > not clickable
    // When onSectionClick is provided, use it (external navigation)
    // When enableDrillDown is true and no external handler, use built-in dialog
    const useExternalHandler = !!onSectionClick;
    const useBuiltInDialog = enableDrillDown && !onSectionClick;

    return (
      <ClientSummaryCard
        client={client}
        clientId={clientId}
        onSectionClick={useExternalHandler ? onSectionClick : undefined}
        sections={sections}
        sectionInfos={useBuiltInDialog ? sectionInfos : undefined}
        actions={actions}
        className={cn('eb-component', className)}
      />
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
          {t('title')}
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
