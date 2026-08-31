import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  Clock3Icon,
  PlusIcon,
  SendIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import type {
  MaintenanceClient,
  MaintenanceStatus,
} from '../models/maintenanceApi.types';
import type { MaintenanceEntityTasks } from '../utils/buildMaintenanceEntityTasks';
import {
  formatMaintenanceRoles,
  getMaintenancePartyIdentity,
} from '../utils/maintenanceDisplay';
import { MaintenanceSection } from './MaintenanceSection';
import { PartyAvatar } from './PartyAvatar';
import { UnavailableMaintenanceAction } from './UnavailableMaintenanceAction';

type MaintenanceProfileOverviewProps = {
  client: MaintenanceClient;
  entityTasks: MaintenanceEntityTasks;
  activeRequestId?: string;
  activeRequestStatus?: MaintenanceStatus;
  isDocumentDiscoveryPending: boolean;
  isEligible: boolean;
  onSelectOrganization: () => void;
  onSelectParty: (partyId: string) => void;
  onReviewAndSubmit: () => void;
  onViewRequestDetails: () => void;
};

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (character) => character.toUpperCase());

export function MaintenanceProfileOverview({
  client,
  entityTasks,
  activeRequestId,
  activeRequestStatus,
  isDocumentDiscoveryPending,
  isEligible,
  onSelectOrganization,
  onSelectParty,
  onReviewAndSubmit,
  onViewRequestDetails,
}: MaintenanceProfileOverviewProps) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const organizationName =
    entityTasks.organization.party?.organizationDetails?.organizationName ??
    tString('notProvided');
  const organizationDetails =
    entityTasks.organization.party?.organizationDetails;
  const organizationMeta = [
    organizationDetails?.organizationType
      ? formatEnumLabel(organizationDetails.organizationType)
      : undefined,
    organizationDetails?.countryOfFormation,
  ]
    .filter(Boolean)
    .join(' · ');
  const productSource =
    client.productDetails && client.productDetails.length > 0
      ? client.productDetails
      : (client.products ?? []);
  const getProductToken = (
    tokenGroup: 'products' | 'subProducts',
    code: string
  ) =>
    tString(
      [`common:${tokenGroup}.${code}`] as unknown as TemplateStringsArray,
      { defaultValue: formatEnumLabel(code) }
    );
  const getProductDisplay = (product: unknown, index: number) => {
    if (typeof product === 'string') {
      return {
        key: `${product}-${index}`,
        product: getProductToken('products', product),
      };
    }
    if (!product || typeof product !== 'object') return undefined;
    const productRecord = product as Record<string, unknown>;
    const productLabel =
      typeof productRecord.product === 'string'
        ? getProductToken('products', productRecord.product)
        : undefined;
    const subProductLabel =
      typeof productRecord.subProduct === 'string'
        ? getProductToken('subProducts', productRecord.subProduct)
        : undefined;
    if (!productLabel && !subProductLabel) return undefined;
    return {
      key: `${String(productRecord.product)}-${String(productRecord.subProduct)}-${index}`,
      product: productLabel ?? subProductLabel!,
      subProduct: productLabel ? subProductLabel : undefined,
    };
  };
  const products = productSource
    .map(getProductDisplay)
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product)
    );
  const requiresAction =
    isDocumentDiscoveryPending ||
    entityTasks.organization.unresolvedDocumentRequestIds.length > 0 ||
    entityTasks.organization.documentRequests.some(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    ) ||
    entityTasks.parties.some(
      (task) =>
        task.unresolvedDocumentRequestIds.length > 0 ||
        task.documentRequests.some(
          (documentRequest) => documentRequest.status !== 'CLOSED'
        )
    );
  const summaryState =
    requiresAction || activeRequestStatus === 'INFORMATION_REQUESTED'
      ? 'action'
      : activeRequestStatus === 'REVIEW_IN_PROGRESS'
        ? 'submitted'
        : 'draft';
  const SummaryIcon =
    summaryState === 'action'
      ? AlertTriangleIcon
      : summaryState === 'submitted'
        ? Clock3Icon
        : SendIcon;

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <div className="eb-min-w-0">
          <h2 className="eb-text-lg eb-font-semibold">{t('flow.title')}</h2>
          <p className="eb-mt-0.5 eb-truncate eb-text-sm">{organizationName}</p>
        </div>
      </header>

      {activeRequestId ? (
        <section
          aria-labelledby="maintenance-request-summary-heading"
          className={cn(
            'eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4 eb-border-b eb-px-4 eb-py-3',
            summaryState === 'action'
              ? 'eb-border-warning/50 eb-bg-warning-accent'
              : summaryState === 'submitted'
                ? 'eb-border-informative/50 eb-bg-informative-accent'
                : 'eb-bg-muted/20'
          )}
        >
          <div className="eb-flex eb-min-w-0 eb-items-start eb-gap-3">
            <SummaryIcon
              className={cn(
                'eb-mt-0.5 eb-size-4 eb-shrink-0',
                summaryState === 'action'
                  ? 'eb-text-warning-foreground'
                  : summaryState === 'submitted'
                    ? 'eb-text-informative'
                    : 'eb-text-muted-foreground'
              )}
              aria-hidden="true"
            />
            <div className="eb-min-w-0">
              <h3
                id="maintenance-request-summary-heading"
                className="eb-text-sm eb-font-semibold"
              >
                {t(`requestSummary.${summaryState}.title`)}
              </h3>
              <p className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                {t(`requestSummary.${summaryState}.description`)}
              </p>
              <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
                {t('flow.changeSet', { requestId: activeRequestId })}
              </p>
            </div>
          </div>
          <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
            {summaryState === 'draft' ? (
              <Button
                size="sm"
                className="eb-shadow-sm"
                onClick={onReviewAndSubmit}
              >
                <SendIcon />
                {t('submission.reviewAndSubmit')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  summaryState === 'action'
                    ? 'eb-border-warning/50 eb-bg-transparent eb-text-warning hover:eb-bg-warning/10 hover:eb-text-warning'
                    : 'eb-border-informative/50 eb-bg-transparent eb-text-informative hover:eb-bg-informative-accent hover:eb-text-informative'
                )}
                onClick={onViewRequestDetails}
              >
                <ClipboardListIcon />
                {t('requestSummary.viewRequestDetails')}
              </Button>
            )}
          </div>
        </section>
      ) : null}

      <MaintenanceSection
        id="maintenance-organization-heading"
        title={t('organization')}
        caption={t('sectionCaption.organization')}
      >
        <button
          type="button"
          className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-4 eb-py-3.5 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
          onClick={onSelectOrganization}
        >
          <div className="eb-min-w-0 eb-flex-1">
            <p className="eb-truncate eb-text-sm eb-font-medium">
              {organizationName}
            </p>
            {organizationMeta ? (
              <p className="eb-truncate eb-text-xs eb-text-muted-foreground">
                {organizationMeta}
              </p>
            ) : null}
          </div>
          {entityTasks.organization.documentRequests.length > 0 ||
          entityTasks.organization.unresolvedDocumentRequestIds.length > 0 ? (
            <span className="eb-text-xs eb-font-medium eb-text-warning-foreground">
              {t('status.ACTION_REQUIRED')}
            </span>
          ) : null}
          <ChevronRightIcon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
        </button>
      </MaintenanceSection>

      <MaintenanceSection
        id="maintenance-products-heading"
        title={t('products')}
        caption={t('sectionCaption.products', { count: products.length })}
        divided
        footer={
          <UnavailableMaintenanceAction icon={<PlusIcon />}>
            {t('placeholders.requestProduct')}
          </UnavailableMaintenanceAction>
        }
      >
        {products.length > 0 ? (
          <ul className="eb-divide-y">
            {products.map((product) => (
              <li key={product.key} className="eb-px-4 eb-py-3.5">
                <dl className="eb-grid eb-gap-x-8 eb-gap-y-3 sm:eb-grid-cols-2">
                  <div className="eb-min-w-0">
                    <dt className="eb-text-xs eb-text-muted-foreground">
                      {t('product')}
                    </dt>
                    <dd className="eb-mt-0.5 eb-text-sm eb-font-medium">
                      {product.product}
                    </dd>
                  </div>
                  {product.subProduct ? (
                    <div className="eb-min-w-0">
                      <dt className="eb-text-xs eb-text-muted-foreground">
                        {t('subProduct')}
                      </dt>
                      <dd className="eb-mt-0.5 eb-text-sm eb-font-medium">
                        {product.subProduct}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="eb-px-4 eb-py-3.5 eb-text-sm eb-text-muted-foreground">
            {t('noProducts')}
          </p>
        )}
      </MaintenanceSection>

      <MaintenanceSection
        id="maintenance-people-heading"
        title={t('people')}
        caption={t('sectionCaption.people', {
          count: entityTasks.parties.length,
        })}
        divided
        footer={
          <UnavailableMaintenanceAction icon={<PlusIcon />}>
            {t('placeholders.addPerson')}
          </UnavailableMaintenanceAction>
        }
      >
        {entityTasks.parties.length > 0 ? (
          <ul className="eb-divide-y">
            {entityTasks.parties.map((task) => {
              const identity = getMaintenancePartyIdentity(
                task.party,
                undefined,
                tString('notProvided')
              );
              const roles = formatMaintenanceRoles(
                task.party.roles,
                (role, fallback) =>
                  tString(
                    [
                      `common:partyRoles.${role}`,
                    ] as unknown as TemplateStringsArray,
                    { defaultValue: fallback }
                  ),
                tString('noRoles')
              );
              const hasUnresolvedDocuments =
                task.unresolvedDocumentRequestIds.length > 0;
              const hasOpenDocuments = task.documentRequests.some(
                (documentRequest) => documentRequest.status !== 'CLOSED'
              );
              const isPreparingDocuments =
                isDocumentDiscoveryPending &&
                task.validationTasks.some(
                  (validationTask) =>
                    validationTask.documentRequestIds.length > 0
                );
              const rowStatus = isPreparingDocuments
                ? t('flow.preparingDocuments')
                : hasUnresolvedDocuments || hasOpenDocuments
                  ? t('status.ACTION_REQUIRED')
                  : undefined;

              return (
                <li key={task.partyId}>
                  <button
                    type="button"
                    className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-4 eb-py-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                    onClick={() => onSelectParty(task.partyId)}
                    data-party-id={task.partyId}
                  >
                    <PartyAvatar
                      name={identity.displayName}
                      className="eb-size-9 eb-text-xs"
                    />
                    <span className="eb-min-w-0 eb-flex-1">
                      <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
                        {identity.displayName}
                      </span>
                      <span className="eb-block eb-truncate eb-text-xs eb-text-muted-foreground">
                        {roles}
                      </span>
                    </span>
                    {rowStatus ? (
                      <span
                        className={cn(
                          'eb-flex eb-max-w-36 eb-items-center eb-gap-1.5 eb-text-right eb-text-xs eb-font-medium',
                          hasOpenDocuments && !isPreparingDocuments
                            ? 'eb-text-warning-foreground'
                            : 'eb-text-muted-foreground'
                        )}
                      >
                        {hasOpenDocuments && !isPreparingDocuments ? (
                          <AlertTriangleIcon
                            className="eb-size-3.5 eb-shrink-0"
                            aria-hidden="true"
                          />
                        ) : null}
                        {rowStatus}
                      </span>
                    ) : null}
                    <ChevronRightIcon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="eb-px-4 eb-py-3.5 eb-text-sm eb-text-muted-foreground">
            {t('noPeople')}
          </p>
        )}
      </MaintenanceSection>

      {!isEligible && !activeRequestId ? (
        <p className="eb-border-t eb-px-4 eb-py-3 eb-text-xs eb-text-muted-foreground">
          {t('errors.notEligibleDescription')}
        </p>
      ) : null}
    </div>
  );
}
