/**
 * ClientDetails - Displays all information for a fully onboarded ACTIVE client
 * from GET /clients/:id. Supports summary, accordion and cards view modes.
 */

import { useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import {
  getChildHeadingLevel,
  getHeadingTag,
} from '@/lib/types/headingLevel.types';
import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  useServerError,
  type ServerErrorInfo,
} from '@/components/ServerErrorAlert';
import { Button } from '@/components/ui';

import { CLIENT_DETAILS_DEFAULT_VIEW_MODE } from './ClientDetails.constants';
import type { ClientDetailsProps } from './ClientDetails.types';
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

/** KYC identity status → section status indicator (defaults to 'pending'). */
const KYC_STATUS_TO_SECTION_STATUS: Record<string, SectionInfo['status']> = {
  APPROVED: 'complete',
  INFORMATION_REQUESTED: 'warning',
};

/** Party/count data derived from a client, consumed by the section builders. */
type ClientSectionData = {
  org: ReturnType<typeof getOrganizationParty>;
  controller: ReturnType<typeof getControllerParty>;
  beneficialOwners: ReturnType<typeof getBeneficialOwnerParties>;
  kycStatus: string | undefined;
  totalPending: number;
  questionResponsesCount: number;
};

/** Derives the party groups and outstanding-item counts used by the sections. */
const extractClientSectionData = (
  client: ClientResponse
): ClientSectionData => ({
  org: getOrganizationParty(client),
  controller: getControllerParty(client),
  beneficialOwners: getBeneficialOwnerParties(client),
  kycStatus: client.results?.customerIdentityStatus,
  totalPending:
    (client.outstanding?.documentRequestIds?.length ?? 0) +
    (client.outstanding?.questionIds?.length ?? 0),
  questionResponsesCount: client.questionResponses?.length ?? 0,
});

/** Identity section — always present (business details always exist). */
const buildIdentitySection = (data: ClientSectionData): SectionInfo => ({
  id: 'identity',
  icon: getSectionIcon('identity'),
  description: data.org?.organizationDetails?.organizationName,
  status: data.org ? 'complete' : 'pending',
});

/** Verification section — shown when a KYC status exists. */
const buildVerificationSection = (
  data: ClientSectionData
): SectionInfo | null => {
  if (!data.kycStatus) return null;
  return {
    id: 'verification',
    icon: getSectionIcon('verification'),
    description: data.kycStatus.replace(/_/g, ' ').toLowerCase(),
    status: KYC_STATUS_TO_SECTION_STATUS[data.kycStatus] ?? 'pending',
  };
};

/**
 * Ownership section — shown when beneficial owners or a controller exist.
 * `description` is resolved by the caller (which owns the `t` instance).
 */
const buildOwnershipSection = (
  data: ClientSectionData,
  description: SectionInfo['description']
): SectionInfo | null => {
  if (data.beneficialOwners.length === 0 && !data.controller) return null;
  const ownerCount = data.beneficialOwners.length + Number(!!data.controller);

  return {
    id: 'ownership',
    icon: getSectionIcon('ownership'),
    badge: data.beneficialOwners.length > 0 ? `${ownerCount}` : undefined,
    description,
    status: 'complete',
  };
};

/**
 * Compliance section — shown when pending items or question responses exist.
 * `badge` is resolved by the caller (which owns the `t` instance).
 */
const buildComplianceSection = (
  data: ClientSectionData,
  badge: SectionInfo['badge']
): SectionInfo | null => {
  if (data.totalPending === 0 && data.questionResponsesCount === 0) return null;
  return {
    id: 'compliance',
    icon: getSectionIcon('compliance'),
    badge,
    status: data.totalPending > 0 ? 'warning' : 'complete',
  };
};

/**
 * Expandable panel that renders the detailed reasons/context of a server
 * error. Shared by the summary and accordion/cards error states.
 */
const ClientErrorDetails: React.FC<{
  errorInfo: ServerErrorInfo | null;
  showDetails: boolean;
  onToggle: () => void;
}> = ({ errorInfo, showDetails, onToggle }) => {
  const { t } = useTranslationWithTokens('client-details');

  if (!errorInfo?.hasDetails) return null;

  return (
    <div className="eb-mt-4 eb-w-full eb-max-w-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="eb-text-xs eb-text-muted-foreground"
      >
        {showDetails ? (
          <ChevronUp className="eb-mr-1 eb-h-3 eb-w-3" />
        ) : (
          <ChevronDown className="eb-mr-1 eb-h-3 eb-w-3" />
        )}
        {showDetails ? t('errors.hideDetails') : t('errors.showDetails')}
      </Button>

      {showDetails && (
        <div className="eb-mt-2 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-3 eb-text-left eb-text-xs">
          {errorInfo.httpStatus && (
            <div className="eb-mb-2">
              <span className="eb-font-medium">Status:</span>{' '}
              {errorInfo.httpStatus}
              {errorInfo.title && ` - ${errorInfo.title}`}
            </div>
          )}
          {errorInfo.reasons.length > 0 && (
            <div className="eb-mb-2">
              <span className="eb-font-medium">Reasons:</span>
              <ul className="eb-mt-1 eb-list-inside eb-list-disc eb-space-y-1 eb-text-muted-foreground">
                {errorInfo.reasons.map((reason) => (
                  <li key={`${reason.field ?? ''}-${reason.message ?? reason}`}>
                    {reason.field && (
                      <span className="eb-font-medium">{reason.field}: </span>
                    )}
                    {reason.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errorInfo.context.length > 0 && (
            <div>
              <span className="eb-font-medium">Context:</span>
              <ul className="eb-mt-1 eb-list-inside eb-list-disc eb-space-y-1 eb-text-muted-foreground">
                {errorInfo.context.map((ctx) => (
                  <li key={`${ctx.field ?? ''}-${ctx.message ?? ''}`}>
                    {ctx.field && (
                      <span className="eb-font-medium">{ctx.field}: </span>
                    )}
                    {ctx.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function ClientDetails({
  clientId,
  viewMode = CLIENT_DETAILS_DEFAULT_VIEW_MODE,
  headingLevel = 2,
  className,
  actions,
}: ClientDetailsProps) {
  const { t } = useTranslationWithTokens('client-details');
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const Heading = getHeadingTag(headingLevel);
  const childHeadingLevel = getChildHeadingLevel(headingLevel);
  const ChildHeading = getHeadingTag(childHeadingLevel);

  const {
    data: client,
    isLoading,
    isError,
    error,
    refetch,
  } = useSmbdoGetClient(clientId, {
    query: { enabled: !!clientId },
  });

  // Parse error for custom rendering
  const errorInfo = useServerError(error);

  // Build section info for navigation. The pure builders above own the
  // structural include/exclude logic; here we only resolve the two i18n strings
  // (single-level `t` usage, keeping this memo's cognitive complexity low).
  const sectionInfos = useMemo(() => {
    if (!client) return [];

    const data = extractClientSectionData(client);

    const ownershipDescription = data.controller
      ? t('sectionDescriptions.controllerWithOwners', {
          count: data.beneficialOwners.length,
        })
      : undefined;
    const complianceBadge =
      data.totalPending > 0
        ? t('sectionDescriptions.pending', { count: data.totalPending })
        : undefined;

    // Note: accounts and activity sections are intentionally excluded
    // as they require additional API calls and are future enhancements
    return [
      buildIdentitySection(data),
      buildVerificationSection(data),
      buildOwnershipSection(data, ownershipDescription),
      buildComplianceSection(data, complianceBadge),
    ].filter((section): section is SectionInfo => section !== null);
  }, [client, t]);

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
    // Custom error content using useServerError hook
    const errorMessage = errorInfo?.getErrorMessage({
      '400': t('errors.badRequest'),
      '401': t('errors.unauthorized'),
      '403': t('errors.forbidden'),
      '404': t('errors.notFound'),
      '500': t('errors.serverError'),
      default: t('errors.loadFailedDefault'),
    });

    // Simple, unified error state for summary view
    if (viewMode === 'summary') {
      return (
        <div
          className={cn(
            'eb-component eb-w-full eb-overflow-hidden eb-rounded-lg eb-border eb-border-border eb-bg-card eb-shadow-sm eb-@container',
            className
          )}
        >
          <div className="eb-flex eb-flex-col eb-items-center eb-px-6 eb-py-10 eb-text-center">
            <div className="eb-mb-4 eb-flex eb-h-14 eb-w-14 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
              <AlertCircle className="eb-h-7 eb-w-7 eb-text-destructive" />
            </div>
            <ChildHeading className="eb-text-lg eb-font-semibold eb-text-foreground">
              {t('errors.unableToLoad')}
            </ChildHeading>
            <p className="eb-mt-2 eb-max-w-xs eb-text-sm eb-text-muted-foreground">
              {errorMessage}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="eb-mt-5"
            >
              <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4" />
              {t('errors.tryAgain')}
            </Button>

            {/* Expandable details */}
            <ClientErrorDetails
              errorInfo={errorInfo}
              showDetails={showErrorDetails}
              onToggle={() => setShowErrorDetails(!showErrorDetails)}
            />
          </div>
        </div>
      );
    }

    // Accordion and Cards view modes - simple centered error
    return (
      <div
        className={cn(
          'eb-component eb-flex eb-w-full eb-max-w-full eb-flex-col',
          className
        )}
      >
        <header className="eb-flex eb-min-h-[48px] eb-items-center eb-border-b eb-border-border eb-px-4 eb-py-3 @md:eb-px-6">
          <Heading className="eb-text-base eb-font-semibold eb-tracking-tight">
            {t('title')}
          </Heading>
        </header>
        <div className="eb-flex eb-flex-1 eb-flex-col eb-items-center eb-justify-center eb-px-4 eb-py-12 eb-text-center @md:eb-px-6">
          <div className="eb-mb-4 eb-flex eb-h-14 eb-w-14 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
            <AlertCircle className="eb-h-7 eb-w-7 eb-text-destructive" />
          </div>
          <ChildHeading className="eb-text-lg eb-font-semibold eb-text-foreground">
            {t('errors.unableToLoad')}
          </ChildHeading>
          <p className="eb-mt-2 eb-max-w-xs eb-text-sm eb-text-muted-foreground">
            {errorMessage}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="eb-mt-5"
          >
            <RefreshCw className="eb-mr-2 eb-h-4 eb-w-4" />
            {t('errors.tryAgain')}
          </Button>

          {/* Expandable details */}
          <ClientErrorDetails
            errorInfo={errorInfo}
            showDetails={showErrorDetails}
            onToggle={() => setShowErrorDetails(!showErrorDetails)}
          />
        </div>
      </div>
    );
  }

  // Summary view mode - compact card with built-in Dialog drill-down
  if (viewMode === 'summary') {
    return (
      <ClientSummaryCard
        client={client}
        clientId={clientId}
        headingLevel={headingLevel}
        sectionInfos={sectionInfos}
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
        <Heading className="eb-text-base eb-font-semibold eb-tracking-tight">
          {t('title')}
        </Heading>
      </header>
      <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-y-auto eb-p-4 @md:eb-px-6 @md:eb-py-5">
        {viewMode === 'accordion' ? (
          <AccordionView client={client} headingLevel={childHeadingLevel} />
        ) : (
          <CardsView client={client} headingLevel={childHeadingLevel} />
        )}
      </div>
    </div>
  );
}
