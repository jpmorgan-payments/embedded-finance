import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  ClipboardListIcon,
  Clock3Icon,
  NetworkIcon,
  PackagePlusIcon,
  PencilLineIcon,
  Undo2Icon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import type {
  MaintenanceClient,
  MaintenanceParty,
  MaintenanceStatus,
} from '../models/maintenanceApi.types';
import type { MaintenanceEntityTasks } from '../utils/buildMaintenanceEntityTasks';
import {
  formatMaintenanceRoles,
  getMaintenancePartyIdentity,
} from '../utils/maintenanceDisplay';
import { MaintenanceChangeStatusIcon } from './MaintenanceChangeStatusIcon';
import {
  MaintenanceProductFamily,
  type MaintenanceProductState,
  type MaintenanceSubProductItem,
} from './MaintenanceProductFamily';
import { MaintenanceSection } from './MaintenanceSection';
import { PartyAvatar } from './PartyAvatar';
import { ProductCancellationDialog } from './ProductCancellationDialog';

type MaintenanceProfileOverviewProps = {
  client: MaintenanceClient;
  entityTasks: MaintenanceEntityTasks;
  ownershipParties: MaintenanceParty[];
  hasActiveUpdate: boolean;
  updateScope: 'product' | 'maintenance' | 'combined';
  activeRequestStatus?: MaintenanceStatus;
  isDocumentDiscoveryPending: boolean;
  isEligible: boolean;
  canAddProduct: boolean;
  offerLimitedDda: boolean;
  canRequestLimitedDda: boolean;
  addProductUnavailableReason?: string;
  isAddingProduct: boolean;
  isCancellingProduct?: boolean;
  productCancellationError?: unknown;
  onSelectOrganization: () => void;
  onSelectParty: (partyId: string) => void;
  onSelectIntermediary: (partyId: string) => void;
  onAddProduct: () => void;
  onCancelProductAddition?: () => Promise<void>;
  onManageOwnership: () => void;
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
  ownershipParties,
  hasActiveUpdate,
  updateScope,
  activeRequestStatus,
  isDocumentDiscoveryPending,
  isEligible,
  canAddProduct,
  offerLimitedDda,
  canRequestLimitedDda,
  addProductUnavailableReason,
  isAddingProduct,
  isCancellingProduct = false,
  productCancellationError,
  onSelectOrganization,
  onSelectParty,
  onSelectIntermediary,
  onAddProduct,
  onCancelProductAddition,
  onManageOwnership,
  onReviewAndSubmit,
  onViewRequestDetails,
}: MaintenanceProfileOverviewProps) {
  const [isProductCancellationOpen, setIsProductCancellationOpen] =
    useState(false);
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const organizationName =
    entityTasks.organization.party?.organizationDetails?.organizationName ??
    tString('notProvided');
  const organizationDetails =
    entityTasks.organization.party?.organizationDetails;
  const organizationMeta = [
    organizationDetails?.organizationType
      ? tString(
          [
            `onboarding-overview:organizationTypes.${organizationDetails.organizationType}`,
          ] as unknown as TemplateStringsArray,
          {
            defaultValue: formatEnumLabel(organizationDetails.organizationType),
          }
        )
      : undefined,
    organizationDetails?.countryOfFormation
      ? tString(
          [
            `common:countries.${organizationDetails.countryOfFormation}`,
          ] as unknown as TemplateStringsArray,
          { defaultValue: organizationDetails.countryOfFormation }
        )
      : undefined,
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
        productCode: product,
        product: getProductToken('products', product),
        subProductCode:
          product === 'EMBEDDED_PAYMENTS' ? 'LIMITED_DDA' : undefined,
        subProduct:
          product === 'EMBEDDED_PAYMENTS'
            ? getProductToken('subProducts', 'LIMITED_DDA')
            : undefined,
        onboardingStatus: 'APPROVED',
      };
    }
    if (!product || typeof product !== 'object') return undefined;
    const productRecord = product as Record<string, unknown>;
    const productCode =
      typeof productRecord.product === 'string'
        ? productRecord.product
        : productRecord.subProduct === 'LIMITED_DDA' ||
            productRecord.subProduct === 'LIMITED_DDA_PAYMENTS'
          ? 'EMBEDDED_PAYMENTS'
          : undefined;
    const productLabel = productCode
      ? getProductToken('products', productCode)
      : undefined;
    const subProductLabel =
      typeof productRecord.subProduct === 'string'
        ? getProductToken('subProducts', productRecord.subProduct)
        : productRecord.product === 'EMBEDDED_PAYMENTS'
          ? getProductToken('subProducts', 'LIMITED_DDA')
          : undefined;
    if (!productLabel && !subProductLabel) return undefined;
    return {
      key: `${String(productRecord.product)}-${String(productRecord.subProduct)}-${index}`,
      productCode: productCode ?? String(productRecord.subProduct),
      product: productLabel ?? subProductLabel!,
      subProductCode:
        typeof productRecord.subProduct === 'string'
          ? productRecord.subProduct
          : productRecord.product === 'EMBEDDED_PAYMENTS'
            ? 'LIMITED_DDA'
            : undefined,
      subProduct: productLabel ? subProductLabel : undefined,
      onboardingStatus:
        typeof productRecord.onboardingStatus === 'string'
          ? productRecord.onboardingStatus
          : 'APPROVED',
    };
  };
  const products = productSource
    .map(getProductDisplay)
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product)
    );
  const productFamilies = Array.from(
    products
      .reduce<
        Map<
          string,
          {
            productCode: string;
            product: string;
            subProducts: typeof products;
          }
        >
      >((families, product) => {
        const family = families.get(product.productCode) ?? {
          productCode: product.productCode,
          product: product.product,
          subProducts: [],
        };
        if (
          !family.subProducts.some(
            (subProduct) => subProduct.subProductCode === product.subProductCode
          )
        ) {
          family.subProducts.push(product);
        }
        families.set(product.productCode, family);
        return families;
      }, new Map())
      .values()
  );
  const embeddedPaymentsFamily = productFamilies.find(
    (family) => family.productCode === 'EMBEDDED_PAYMENTS'
  );
  const hasConfiguredEmbeddedPayments = (client.products ?? []).some(
    (product) =>
      product === 'EMBEDDED_PAYMENTS' ||
      (typeof product === 'object' &&
        product !== null &&
        (product as Record<string, unknown>).product === 'EMBEDDED_PAYMENTS')
  );
  if (
    embeddedPaymentsFamily &&
    hasConfiguredEmbeddedPayments &&
    !embeddedPaymentsFamily.subProducts.some(
      (subProduct) => subProduct.subProductCode === 'LIMITED_DDA'
    )
  ) {
    embeddedPaymentsFamily.subProducts.unshift({
      key: 'EMBEDDED_PAYMENTS-LIMITED_DDA-configured',
      productCode: 'EMBEDDED_PAYMENTS',
      product: getProductToken('products', 'EMBEDDED_PAYMENTS'),
      subProductCode: 'LIMITED_DDA',
      subProduct: getProductToken('subProducts', 'LIMITED_DDA'),
      onboardingStatus: 'APPROVED',
    });
  }
  if (!embeddedPaymentsFamily && offerLimitedDda) {
    productFamilies.push({
      productCode: 'EMBEDDED_PAYMENTS',
      product: getProductToken('products', 'EMBEDDED_PAYMENTS'),
      subProducts: [],
    });
  }
  const getProductState = (status?: string): MaintenanceProductState => {
    switch (status) {
      case 'NEW':
        return 'pending';
      case 'REVIEW_IN_PROGRESS':
        return 'review';
      case 'INFORMATION_REQUESTED':
        return 'action';
      case 'DECLINED':
      case 'TERMINATED':
        return 'declined';
      default:
        return 'active';
    }
  };
  const getProductEyebrow = (state: MaintenanceProductState) =>
    tString([`productNode.${state}`] as unknown as TemplateStringsArray);
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
    ) ||
    entityTasks.intermediaryOrganizations.some(
      (task) =>
        task.unresolvedDocumentRequestIds.length > 0 ||
        task.documentRequests.some(
          (documentRequest) => documentRequest.status !== 'CLOSED'
        )
    );
  const summaryState =
    activeRequestStatus === 'INFORMATION_REQUESTED'
      ? 'action'
      : requiresAction && activeRequestStatus !== 'REVIEW_IN_PROGRESS'
        ? 'draftRequirements'
        : activeRequestStatus === 'REVIEW_IN_PROGRESS'
          ? 'submitted'
          : 'draft';
  const SummaryIcon =
    summaryState === 'action'
      ? AlertTriangleIcon
      : summaryState === 'draftRequirements'
        ? ClipboardListIcon
        : summaryState === 'submitted'
          ? Clock3Icon
          : PencilLineIcon;
  const summaryTitle =
    updateScope === 'maintenance'
      ? t(`requestSummary.${summaryState}.title`)
      : tString([
          `updateSummary.${updateScope}.${summaryState}.title`,
        ] as unknown as TemplateStringsArray);
  const summaryDescription =
    updateScope === 'maintenance'
      ? t(`requestSummary.${summaryState}.description`)
      : tString([
          `updateSummary.${updateScope}.${summaryState}.description`,
        ] as unknown as TemplateStringsArray);
  const summaryActionLabel =
    summaryState === 'draftRequirements'
      ? t('requestSummary.completeRequirements')
      : summaryState === 'action'
        ? t('requestSummary.completeRequiredActions')
        : t('requestSummary.viewSubmittedChanges');
  const relatedPartyTasks = [
    ...entityTasks.parties,
    ...entityTasks.intermediaryOrganizations,
  ];
  const renderPartyRows = () =>
    relatedPartyTasks.length > 0 ? (
      <ul className="eb-divide-y">
        {relatedPartyTasks.map((task) => {
          const displayedParty = task.proposedParty;
          const isIntermediary =
            displayedParty.roles?.includes('INTERMEDIARY_OWNER');
          const identity = isIntermediary
            ? {
                displayName:
                  displayedParty.organizationDetails?.organizationName ??
                  tString('notProvided'),
              }
            : getMaintenancePartyIdentity(
                displayedParty,
                undefined,
                tString('notProvided')
              );
          const relevantRoles = displayedParty.roles?.filter((role) =>
            ['CONTROLLER', 'BENEFICIAL_OWNER', 'INTERMEDIARY_OWNER'].includes(
              role
            )
          );
          const roleText = formatMaintenanceRoles(
            relevantRoles,
            (role, fallback) =>
              tString(
                [
                  `common:partyRoles.${role}`,
                ] as unknown as TemplateStringsArray,
                { defaultValue: fallback }
              ),
            tString('noRoles')
          );
          const ownershipNature = displayedParty.roles?.includes(
            'BENEFICIAL_OWNER'
          )
            ? displayedParty.individualDetails?.natureOfOwnership
            : undefined;
          const parentBusiness = ownershipParties.find(
            (party) => party.id === displayedParty.parentPartyId
          );
          const parentBusinessName =
            parentBusiness?.organizationDetails?.organizationName;
          const ownershipPath = ownershipNature
            ? ownershipNature === 'Indirect' && parentBusinessName
              ? tString('ownership.throughBusiness', {
                  name: parentBusinessName,
                })
              : tString(
                  [
                    `ownership.${ownershipNature.toLowerCase()}`,
                  ] as unknown as TemplateStringsArray,
                  { defaultValue: ownershipNature }
                )
            : undefined;
          const secondaryText = [roleText, ownershipPath]
            .filter(Boolean)
            .join(' · ');
          const hasUnresolvedDocuments =
            task.unresolvedDocumentRequestIds.length > 0;
          const hasOpenDocuments = task.documentRequests.some(
            (documentRequest) => documentRequest.status !== 'CLOSED'
          );
          const isPreparingDocuments =
            isDocumentDiscoveryPending &&
            task.validationTasks.some(
              (validationTask) => validationTask.documentRequestIds.length > 0
            );
          const isPendingRemoval = task.change?.removesParty ?? false;
          const changeStatus = task.change?.proposal.updateRequest?.status;
          const isAdditionUnderReview =
            task.isPendingAddition && changeStatus === 'REVIEW_IN_PROGRESS';
          const rowStatus = isPendingRemoval
            ? t('status.PENDING_REMOVAL')
            : task.isPendingAddition && !isAdditionUnderReview
              ? t('status.PENDING_ADDITION')
              : isPreparingDocuments
                ? t('flow.preparingDocuments')
                : hasUnresolvedDocuments || hasOpenDocuments
                  ? t('status.ACTION_REQUIRED')
                  : task.change
                    ? changeStatus === 'REVIEW_IN_PROGRESS'
                      ? t(
                          isAdditionUnderReview
                            ? 'changes.additionReviewTitle'
                            : 'changes.reviewTitle'
                        )
                      : tString([
                          `status.${changeStatus ?? 'NEW'}`,
                        ] as unknown as TemplateStringsArray)
                    : undefined;
          const isActionRequired =
            (hasUnresolvedDocuments || hasOpenDocuments) &&
            !isPreparingDocuments &&
            !isPendingRemoval &&
            !task.isPendingAddition;

          return (
            <li key={task.partyId}>
              <button
                type="button"
                className={cn(
                  'eb-flex eb-w-full eb-items-center eb-gap-3 eb-border-l-2 eb-border-transparent eb-px-4 eb-py-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring',
                  task.isPendingAddition &&
                    'eb-border-informative/60 eb-bg-informative-accent/40 hover:eb-bg-informative-accent/40',
                  isPendingRemoval &&
                    'eb-border-warning/60 eb-bg-warning-accent/40 hover:eb-bg-warning-accent/40'
                )}
                onClick={() =>
                  isIntermediary
                    ? onSelectIntermediary(task.partyId)
                    : onSelectParty(task.partyId)
                }
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
                    {secondaryText}
                  </span>
                </span>
                {rowStatus ? (
                  <span
                    className={cn(
                      'eb-flex eb-max-w-36 eb-items-center eb-gap-1.5 eb-text-right eb-text-xs eb-font-medium',
                      isActionRequired
                        ? 'eb-text-warning-foreground'
                        : isPendingRemoval
                          ? 'eb-text-warning-foreground'
                          : changeStatus === 'NEW' ||
                              changeStatus === 'REVIEW_IN_PROGRESS'
                            ? 'eb-text-informative'
                            : 'eb-text-muted-foreground'
                    )}
                  >
                    {isActionRequired ? (
                      <AlertTriangleIcon
                        className="eb-size-3.5 eb-shrink-0"
                        aria-hidden="true"
                      />
                    ) : isPendingRemoval ? (
                      <CircleMinusIcon
                        className="eb-size-3.5 eb-shrink-0"
                        aria-hidden="true"
                      />
                    ) : task.isPendingAddition && !isAdditionUnderReview ? (
                      <CirclePlusIcon
                        className="eb-size-3.5 eb-shrink-0"
                        aria-hidden="true"
                      />
                    ) : task.change ? (
                      <MaintenanceChangeStatusIcon
                        status={changeStatus}
                        className="eb-size-3.5 eb-shrink-0"
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
    );

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <div className="eb-min-w-0">
          <h2 className="eb-text-lg eb-font-semibold">{t('flow.title')}</h2>
          <p className="eb-mt-0.5 eb-truncate eb-text-sm">{organizationName}</p>
        </div>
      </header>

      {client.status !== 'APPROVED' ? (
        <section
          aria-labelledby="client-status-heading"
          className={cn(
            'eb-flex eb-items-start eb-gap-3 eb-border-b eb-px-4 eb-py-3.5',
            client.status === 'INFORMATION_REQUESTED'
              ? 'eb-border-warning/50 eb-bg-warning-accent'
              : client.status === 'DECLINED'
                ? 'eb-border-destructive/50 eb-bg-destructive-accent'
                : 'eb-border-informative/50 eb-bg-informative-accent'
          )}
        >
          {client.status === 'INFORMATION_REQUESTED' ||
          client.status === 'DECLINED' ? (
            <AlertTriangleIcon className="eb-mt-0.5 eb-size-5 eb-shrink-0 eb-text-warning" />
          ) : (
            <Clock3Icon className="eb-mt-0.5 eb-size-5 eb-shrink-0 eb-text-informative" />
          )}
          <div>
            <h3
              id="client-status-heading"
              className="eb-text-sm eb-font-semibold"
            >
              {tString(
                [
                  `clientStatusBanner.${client.status}.title`,
                ] as unknown as TemplateStringsArray,
                {
                  defaultValue: tString('clientStatus', {
                    status: formatEnumLabel(client.status),
                  }),
                }
              )}
            </h3>
            <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
              {tString(
                [
                  `clientStatusBanner.${client.status}.description`,
                ] as unknown as TemplateStringsArray,
                { defaultValue: tString('clientStatusBanner.default') }
              )}
            </p>
          </div>
        </section>
      ) : null}

      {hasActiveUpdate ? (
        <section
          aria-labelledby="maintenance-request-summary-heading"
          className={cn(
            'eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4 eb-border-b eb-px-4 eb-py-3',
            summaryState === 'action'
              ? 'eb-border-warning/50 eb-bg-warning-accent'
              : summaryState === 'draftRequirements'
                ? 'eb-border-warning/50 eb-bg-warning-accent'
                : summaryState === 'submitted'
                  ? 'eb-border-informative/50 eb-bg-informative-accent'
                  : 'eb-border-informative/50 eb-bg-informative-accent'
          )}
        >
          <div className="eb-flex eb-min-w-0 eb-items-start eb-gap-3">
            <SummaryIcon
              className={cn(
                'eb-mt-0.5 eb-size-4 eb-shrink-0',
                summaryState === 'action'
                  ? 'eb-text-warning-foreground'
                  : summaryState === 'draftRequirements'
                    ? 'eb-text-warning-foreground'
                    : summaryState === 'submitted'
                      ? 'eb-text-informative'
                      : 'eb-text-informative'
              )}
              aria-hidden="true"
            />
            <div className="eb-min-w-0">
              <h3
                id="maintenance-request-summary-heading"
                className="eb-text-sm eb-font-semibold"
              >
                {summaryTitle}
              </h3>
              <p className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                {summaryDescription}
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
                {t('submission.reviewAndSubmit')}
                <ArrowRightIcon />
              </Button>
            ) : (
              <Button size="sm" onClick={onViewRequestDetails}>
                {summaryActionLabel}
                <ArrowRightIcon />
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
          {entityTasks.organization.documentRequests.some(
            (documentRequest) => documentRequest.status !== 'CLOSED'
          ) ||
          entityTasks.organization.unresolvedDocumentRequestIds.length > 0 ? (
            <span className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-medium eb-text-warning-foreground">
              <AlertTriangleIcon
                className="eb-size-3.5 eb-shrink-0"
                aria-hidden="true"
              />
              {t('status.ACTION_REQUIRED')}
            </span>
          ) : null}
          <ChevronRightIcon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
        </button>
      </MaintenanceSection>

      <MaintenanceSection
        id="maintenance-products-heading"
        title={t('products')}
        caption={t('sectionCaption.products', {
          count: productFamilies.length,
        })}
        divided
        unframed
      >
        {productFamilies.length > 0 ? (
          <div className="eb-space-y-3">
            {productFamilies.map((family) => {
              const hasLimitedDdaPayments = family.subProducts.some(
                (subProduct) =>
                  subProduct.subProductCode === 'LIMITED_DDA_PAYMENTS'
              );
              const showAvailableUpgrade =
                family.productCode === 'EMBEDDED_PAYMENTS' &&
                !hasLimitedDdaPayments;
              const subProducts: MaintenanceSubProductItem[] =
                family.subProducts.map((subProduct) => {
                  const state = getProductState(subProduct.onboardingStatus);
                  return {
                    id:
                      subProduct.subProductCode
                        ?.toLowerCase()
                        .replaceAll('_', '-') ?? subProduct.key,
                    label: subProduct.subProduct ?? subProduct.product,
                    state,
                    eyebrow:
                      state === 'active' ? undefined : getProductEyebrow(state),
                    action:
                      subProduct.subProductCode === 'LIMITED_DDA_PAYMENTS' &&
                      state === 'pending' &&
                      onCancelProductAddition ? (
                        <Button
                          variant="outlineSurface"
                          size="sm"
                          className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                          onClick={() => setIsProductCancellationOpen(true)}
                        >
                          <Undo2Icon />
                          {t('productCancellation.action')}
                        </Button>
                      ) : undefined,
                  };
                });
              if (showAvailableUpgrade) {
                const isLimitedDdaAction = offerLimitedDda;
                const isAvailable = isLimitedDdaAction
                  ? canRequestLimitedDda
                  : canAddProduct;
                subProducts.push({
                  id: isLimitedDdaAction
                    ? 'limited-dda-available'
                    : 'limited-dda-payments-available',
                  label: getProductToken(
                    'subProducts',
                    isLimitedDdaAction ? 'LIMITED_DDA' : 'LIMITED_DDA_PAYMENTS'
                  ),
                  state: 'available',
                  presentation: 'action-only',
                  action: (
                    <Button
                      variant="outlineSurface"
                      size="sm"
                      onClick={onAddProduct}
                      disabled={!isAvailable || isAddingProduct}
                      title={addProductUnavailableReason}
                    >
                      <PackagePlusIcon />
                      {isLimitedDdaAction
                        ? t('productsAction.addLimitedDda')
                        : isAddingProduct
                          ? t('productsAction.adding')
                          : t('productsAction.add')}
                    </Button>
                  ),
                });
              }
              return (
                <MaintenanceProductFamily
                  key={family.productCode}
                  productName={family.product}
                  productLabel={t('product')}
                  subProductLabel={t('subProduct')}
                  subProducts={subProducts}
                />
              );
            })}
          </div>
        ) : (
          <p className="eb-rounded-md eb-border eb-bg-background eb-px-4 eb-py-3.5 eb-text-sm eb-text-muted-foreground">
            {t('noProducts')}
          </p>
        )}
      </MaintenanceSection>

      <MaintenanceSection
        id="maintenance-people-heading"
        title={t('people')}
        caption={t('peopleDescription')}
        divided
        footer={
          <div className="eb-flex eb-justify-end">
            <Button variant="ghost" size="sm" onClick={onManageOwnership}>
              <NetworkIcon />
              {t('ownership.viewStructure')}
            </Button>
          </div>
        }
      >
        {renderPartyRows()}
      </MaintenanceSection>

      {!isEligible && !hasActiveUpdate ? (
        <p className="eb-border-t eb-px-4 eb-py-3 eb-text-xs eb-text-muted-foreground">
          {t('errors.notEligibleDescription')}
        </p>
      ) : null}
      {onCancelProductAddition ? (
        <ProductCancellationDialog
          open={isProductCancellationOpen}
          isPending={isCancellingProduct}
          error={productCancellationError}
          hasMaintenanceChanges={updateScope === 'combined'}
          onOpenChange={setIsProductCancellationOpen}
          onConfirm={onCancelProductAddition}
        />
      ) : null}
    </div>
  );
}
