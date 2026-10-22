import { useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  Clock3Icon,
  FileTextIcon,
  InfoIcon,
  PackagePlusIcon,
  PencilLineIcon,
  Undo2Icon,
  UserRoundCogIcon,
  UserRoundPlusIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui';

import { useMaintenanceRequestSummary } from '../hooks/useMaintenanceRequestSummary';
import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import type { MaintenanceEntityTasks } from '../utils/buildMaintenanceEntityTasks';
import {
  getMaintenanceMedallionTone,
  getMaintenancePartyStatus,
} from '../utils/getMaintenancePartyStatus';
import { getMaintenanceRequestSummaryState } from '../utils/getMaintenanceRequestSummaryState';
import {
  formatMaintenanceRoles,
  getMaintenancePartyIdentity,
} from '../utils/maintenanceDisplay';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import { MaintenancePartyStatusLabel } from './MaintenancePartyStatusLabel';
import {
  MaintenanceProductFamily,
  type MaintenanceProductState,
  type MaintenanceSubProductItem,
} from './MaintenanceProductFamily';
import { ProductCancellationDialog } from './ProductCancellationDialog';

type MaintenanceProfileOverviewProps = {
  client: MaintenanceClient;
  entityTasks: MaintenanceEntityTasks;
  ownershipParties: MaintenanceParty[];
  hasActiveUpdate: boolean;
  updateScope: 'product' | 'maintenance' | 'combined';
  activeRequestStatus?: KycUpdateRequestStatus;
  isDocumentDiscoveryPending: boolean;
  /** Whether the eligibility matrix allows the Limited DDA Payments upgrade at all. */
  canOfferProductUpgrade: boolean;
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
  /** Omitted when the business has no ownership structure, such as a sole proprietorship. */
  onManageOwnership?: () => void;
  /** Shortcuts to common changes; each is omitted when the change isn't allowed. */
  onEditBusiness?: () => void;
  onAddBeneficialOwner?: () => void;
  onReplaceController?: () => void;
  /** Whether the ownership structure allows adding, moving, or removing businesses. */
  canRestructureOwnership?: boolean;
  onReviewAndSubmit: () => void;
  onViewRequestDetails: () => void;
};

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (character) => character.toUpperCase());

function OverviewPanel({
  id,
  title,
  caption,
  children,
}: {
  id: string;
  title: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="eb-min-w-0">
      <div className="eb-mb-2.5">
        <h3
          id={id}
          className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
        >
          {title}
        </h3>
        {caption ? (
          <p className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
            {caption}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const CARD_CLASS =
  'eb-overflow-hidden eb-rounded-md eb-border eb-bg-background';

export function MaintenanceProfileOverview({
  client,
  entityTasks,
  ownershipParties,
  hasActiveUpdate,
  updateScope,
  activeRequestStatus,
  isDocumentDiscoveryPending,
  canOfferProductUpgrade,
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
  onEditBusiness,
  onAddBeneficialOwner,
  onReplaceController,
  canRestructureOwnership = false,
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
  // Limited DDA itself is a host action; Limited DDA Payments follows the matrix.
  const offeredSubProduct = offerLimitedDda
    ? 'LIMITED_DDA'
    : 'LIMITED_DDA_PAYMENTS';
  const showsUpgrade =
    productFamilies.some(
      (family) => family.productCode === 'EMBEDDED_PAYMENTS'
    ) &&
    !products.some(
      (product) => product.subProductCode === 'LIMITED_DDA_PAYMENTS'
    ) &&
    (offerLimitedDda || canOfferProductUpgrade);
  const isUpgradeAvailable = offerLimitedDda
    ? canRequestLimitedDda
    : canAddProduct;
  const summaryState = getMaintenanceRequestSummaryState({
    activeRequestStatus,
    entityTasks,
    isDocumentDiscoveryPending,
  });
  const {
    Icon: SummaryIcon,
    title: summaryTitle,
    description: summaryDescription,
    actionLabel: summaryActionLabel,
  } = useMaintenanceRequestSummary(summaryState, updateScope);
  const relatedPartyTasks = [
    ...entityTasks.parties,
    ...entityTasks.intermediaryOrganizations,
  ];
  const hasOpenDocuments = (task: {
    documentRequests: Array<{ status?: string }>;
  }) =>
    task.documentRequests.some(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    );
  const changeBreakdown: Array<{
    id: string;
    Icon: LucideIcon;
    iconClassName: string;
    label: string;
    count: number;
  }> = [
    {
      id: 'added',
      Icon: CirclePlusIcon,
      iconClassName: 'eb-text-informative',
      label: tString('submission.groups.added'),
      count: relatedPartyTasks.filter((task) => task.isPendingAddition).length,
    },
    {
      id: 'updated',
      Icon: PencilLineIcon,
      iconClassName: 'eb-text-muted-foreground',
      label: tString('submission.groups.updated'),
      count:
        (entityTasks.organization.change ? 1 : 0) +
        relatedPartyTasks.filter(
          (task) =>
            task.change && !task.change.removesParty && !task.isPendingAddition
        ).length,
    },
    {
      id: 'removed',
      Icon: CircleMinusIcon,
      iconClassName: 'eb-text-destructive',
      label: tString('submission.groups.removed'),
      count: relatedPartyTasks.filter((task) => task.change?.removesParty)
        .length,
    },
    {
      id: 'documents',
      Icon: FileTextIcon,
      iconClassName: 'eb-text-warning-foreground',
      label: tString('submission.groups.documents'),
      count: [entityTasks.organization, ...relatedPartyTasks].filter(
        hasOpenDocuments
      ).length,
    },
  ].filter((item) => item.count > 0);
  const homeTasks = [
    onEditBusiness && {
      id: 'edit-business',
      Icon: PencilLineIcon,
      title: t('home.tasks.editBusiness.title'),
      description: t('home.tasks.editBusiness.description'),
      onClick: onEditBusiness,
    },
    onAddBeneficialOwner && {
      id: 'add-owner',
      Icon: UserRoundPlusIcon,
      title: t('home.tasks.addOwner.title'),
      description: t('home.tasks.addOwner.description'),
      onClick: onAddBeneficialOwner,
    },
    onReplaceController && {
      id: 'replace-controller',
      Icon: UserRoundCogIcon,
      title: t('home.tasks.replaceController.title'),
      description: t('home.tasks.replaceController.description'),
      onClick: onReplaceController,
    },
  ].filter((task) => Boolean(task)) as Array<{
    id: string;
    Icon: LucideIcon;
    title: ReactNode;
    description: ReactNode;
    onClick: () => void;
  }>;
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
          const ownershipNature = displayedParty.roles?.includes(
            'BENEFICIAL_OWNER'
          )
            ? (displayedParty.individualDetails?.natureOfOwnership ??
              (displayedParty.parentPartyId &&
              displayedParty.parentPartyId !== client.partyId
                ? 'Indirect'
                : 'Direct'))
            : undefined;
          const roleText = formatMaintenanceRoles(
            relevantRoles,
            (role, fallback) =>
              role === 'BENEFICIAL_OWNER' && ownershipNature
                ? tString(
                    ownershipNature === 'Indirect'
                      ? 'ownership.indirectOwner'
                      : 'ownership.directOwner'
                  )
                : tString(
                    [
                      `common:partyRoles.${role}`,
                    ] as unknown as TemplateStringsArray,
                    { defaultValue: fallback }
                  ),
            tString('noRoles')
          );
          const parentBusiness = ownershipParties.find(
            (party) => party.id === displayedParty.parentPartyId
          );
          const parentBusinessName =
            parentBusiness?.organizationDetails?.organizationName;
          const ownershipPath =
            ownershipNature === 'Indirect' && parentBusinessName
              ? tString('ownership.throughBusiness', {
                  name: parentBusinessName,
                })
              : undefined;
          const secondaryText = [roleText, ownershipPath]
            .filter(Boolean)
            .join(' · ');
          const partyStatus = getMaintenancePartyStatus(
            task,
            isDocumentDiscoveryPending
          );

          return (
            <li key={task.partyId}>
              <button
                type="button"
                className={cn(
                  'eb-flex eb-w-full eb-items-center eb-gap-3 eb-border-l-2 eb-border-transparent eb-px-4 eb-py-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring',
                  task.isPendingAddition && 'eb-border-informative',
                  task.change?.removesParty && 'eb-border-destructive'
                )}
                onClick={() =>
                  isIntermediary
                    ? onSelectIntermediary(task.partyId)
                    : onSelectParty(task.partyId)
                }
                data-party-id={task.partyId}
              >
                <MaintenanceEntityMedallion
                  kind={isIntermediary ? 'business' : 'person'}
                  tone={getMaintenanceMedallionTone(partyStatus)}
                  size="lg"
                />
                <span className="eb-min-w-0 eb-flex-1">
                  <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
                    {identity.displayName}
                  </span>
                  <span className="eb-block eb-truncate eb-text-xs eb-text-muted-foreground">
                    {secondaryText}
                  </span>
                </span>
                {partyStatus ? (
                  <MaintenancePartyStatusLabel
                    status={partyStatus}
                    className="eb-max-w-36 eb-text-right"
                  />
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
  const peoplePanel = (
    <OverviewPanel
      id="maintenance-people-heading"
      title={t('people')}
      caption={t('peopleDescription')}
    >
      <div className={CARD_CLASS}>{renderPartyRows()}</div>
    </OverviewPanel>
  );
  // Shortcuts, not profile content: no card, no micro heading, descriptions for assistive tech only.
  const tasksPanel =
    homeTasks.length > 0 ? (
      <section
        aria-labelledby="maintenance-home-tasks-heading"
        data-home-tasks=""
        className="eb-min-w-0 eb-rounded-md eb-bg-muted/40 eb-p-3"
      >
        <h3
          id="maintenance-home-tasks-heading"
          className="eb-text-sm eb-font-medium"
        >
          {t('home.changesTitle')}
        </h3>
        <p className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
          {t('home.changesCaption')}
        </p>
        <ul className="-eb-mx-1.5 eb-mt-2">
          {homeTasks.map(({ id, Icon, title, description, onClick }) => (
            <li key={id}>
              <button
                type="button"
                data-home-task={id}
                aria-describedby={`maintenance-home-task-${id}-description`}
                className="eb-group eb-flex eb-w-full eb-items-center eb-gap-2 eb-rounded eb-px-1.5 eb-py-1.5 eb-text-left eb-text-sm hover:eb-bg-background focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring"
                onClick={onClick}
              >
                <Icon
                  aria-hidden="true"
                  className="group-hover:eb-text-foreground eb-size-4 eb-shrink-0 eb-text-muted-foreground"
                />
                <span className="eb-min-w-0 eb-flex-1 eb-truncate">
                  {title}
                </span>
                <span
                  id={`maintenance-home-task-${id}-description`}
                  className="eb-sr-only"
                >
                  {description}
                </span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="group-hover:eb-opacity-100 group-focus-visible:eb-opacity-100 eb-size-3.5 eb-shrink-0 eb-text-muted-foreground eb-opacity-0"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background eb-@container">
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
          {client.status === 'INFORMATION_REQUESTED' ? (
            <AlertTriangleIcon className="eb-mt-0.5 eb-size-5 eb-shrink-0 eb-text-warning-foreground" />
          ) : client.status === 'DECLINED' ? (
            <AlertTriangleIcon className="eb-mt-0.5 eb-size-5 eb-shrink-0 eb-text-destructive" />
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
            summaryState === 'action' || summaryState === 'draftRequirements'
              ? 'eb-border-warning/50 eb-bg-warning-accent'
              : 'eb-border-informative/50 eb-bg-informative-accent'
          )}
        >
          <div className="eb-flex eb-min-w-0 eb-items-start eb-gap-3">
            <SummaryIcon
              className={cn(
                'eb-mt-0.5 eb-size-4 eb-shrink-0',
                summaryState === 'action' ||
                  summaryState === 'draftRequirements'
                  ? 'eb-text-warning-foreground'
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
              {changeBreakdown.length > 0 ? (
                <ul
                  data-request-breakdown=""
                  className="eb-mt-2.5 eb-flex eb-flex-wrap eb-gap-1.5"
                >
                  {changeBreakdown.map(
                    ({ id, Icon, iconClassName, label, count }) => (
                      <li
                        key={id}
                        className="eb-inline-flex eb-items-center eb-gap-1.5 eb-rounded-full eb-border eb-border-border/60 eb-bg-background eb-px-2.5 eb-py-0.5 eb-text-xs eb-font-medium"
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn('eb-size-3.5', iconClassName)}
                        />
                        {label}
                        <span className="eb-tabular-nums eb-text-muted-foreground">
                          {count}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              ) : null}
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

      <div
        data-overview-layout=""
        className="eb-grid eb-gap-6 eb-bg-muted/20 eb-px-4 eb-py-5 @[56rem]:eb-grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @[56rem]:eb-px-5"
      >
        {/* Shown quietly while it can't be requested, so it doesn't compete with the work that's due. */}
        {showsUpgrade ? (
          <section
            aria-labelledby="maintenance-upgrade-heading"
            data-product-upgrade={offeredSubProduct}
            data-upgrade-available={isUpgradeAvailable ? 'true' : 'false'}
            className={cn(
              'eb-flex eb-flex-col eb-gap-4 eb-rounded-md eb-border eb-bg-background @[40rem]:eb-flex-row @[40rem]:eb-items-center @[56rem]:eb-col-span-2',
              isUpgradeAvailable ? 'eb-border-primary/50 eb-p-4' : 'eb-p-3'
            )}
          >
            <div className="eb-flex eb-min-w-0 eb-flex-1 eb-items-start eb-gap-3">
              <MaintenanceEntityMedallion
                kind="product"
                icon={PackagePlusIcon}
                size={isUpgradeAvailable ? 'lg' : 'md'}
                className={cn(
                  isUpgradeAvailable &&
                    'eb-bg-primary eb-text-primary-foreground'
                )}
              />
              <div className="eb-min-w-0">
                <p
                  className={cn(
                    'eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider',
                    isUpgradeAvailable
                      ? 'eb-text-primary'
                      : 'eb-text-muted-foreground'
                  )}
                >
                  {t('upgrade.eyebrow')}
                </p>
                <h3
                  id="maintenance-upgrade-heading"
                  className={cn(
                    'eb-mt-0.5 eb-font-semibold',
                    isUpgradeAvailable ? 'eb-text-base' : 'eb-text-sm'
                  )}
                >
                  {getProductToken('subProducts', offeredSubProduct)}
                </h3>
                <p className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                  {t([
                    `upgrade.description.${offeredSubProduct}`,
                  ] as unknown as TemplateStringsArray)}
                </p>
                {!isUpgradeAvailable && addProductUnavailableReason ? (
                  <p className="eb-mt-2 eb-flex eb-items-start eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                    <InfoIcon
                      aria-hidden="true"
                      className="eb-mt-px eb-size-3.5 eb-shrink-0"
                    />
                    {addProductUnavailableReason}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              variant={isUpgradeAvailable ? 'default' : 'outline'}
              size={isUpgradeAvailable ? 'default' : 'sm'}
              className="eb-shrink-0 eb-self-start @[40rem]:eb-self-center"
              onClick={onAddProduct}
              disabled={!isUpgradeAvailable || isAddingProduct}
            >
              <PackagePlusIcon />
              {offerLimitedDda
                ? t('productsAction.addLimitedDda')
                : isAddingProduct
                  ? t('productsAction.adding')
                  : t('productsAction.add')}
            </Button>
          </section>
        ) : null}
        <div className="eb-min-w-0 eb-space-y-6">
          <OverviewPanel
            id="maintenance-organization-heading"
            title={t('organization')}
          >
            <div className={CARD_CLASS}>
              <button
                type="button"
                className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-4 eb-py-3.5 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                onClick={onSelectOrganization}
              >
                <MaintenanceEntityMedallion
                  kind="business"
                  tone={getMaintenanceMedallionTone(
                    getMaintenancePartyStatus(
                      entityTasks.organization,
                      isDocumentDiscoveryPending
                    )
                  )}
                  size="lg"
                />
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
                entityTasks.organization.unresolvedDocumentRequestIds.length >
                  0 ? (
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
              {onManageOwnership ? (
                // One entry for viewing and changing the structure, described by what's allowed.
                <button
                  type="button"
                  data-ownership-entry=""
                  aria-labelledby="maintenance-ownership-entry-title"
                  aria-describedby="maintenance-ownership-entry-description"
                  className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-border-t eb-px-4 eb-py-3.5 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                  onClick={onManageOwnership}
                >
                  <MaintenanceEntityMedallion kind="structure" size="lg" />
                  <span className="eb-min-w-0 eb-flex-1">
                    <span
                      id="maintenance-ownership-entry-title"
                      className="eb-block eb-text-sm eb-font-medium"
                    >
                      {t('ownership.viewStructure')}
                    </span>
                    <span
                      id="maintenance-ownership-entry-description"
                      className="eb-block eb-text-xs eb-leading-4 eb-text-muted-foreground"
                    >
                      {t(
                        canRestructureOwnership
                          ? 'home.ownershipEntry.editable'
                          : 'home.ownershipEntry.readOnly'
                      )}
                    </span>
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="eb-size-4 eb-shrink-0 eb-text-muted-foreground"
                  />
                </button>
              ) : null}
            </div>
          </OverviewPanel>
          {peoplePanel}
        </div>

        <div className="eb-min-w-0 eb-space-y-6">
          <OverviewPanel
            id="maintenance-products-heading"
            title={t('products')}
            caption={t('sectionCaption.products', {
              count: productFamilies.length,
            })}
          >
            {productFamilies.length > 0 ? (
              <div className="eb-space-y-3">
                {productFamilies.map((family) => {
                  const subProducts: MaintenanceSubProductItem[] =
                    family.subProducts.map((subProduct) => {
                      const state = getProductState(
                        subProduct.onboardingStatus
                      );
                      return {
                        id:
                          subProduct.subProductCode
                            ?.toLowerCase()
                            .replaceAll('_', '-') ?? subProduct.key,
                        label: subProduct.subProduct ?? subProduct.product,
                        state,
                        eyebrow:
                          state === 'active'
                            ? undefined
                            : getProductEyebrow(state),
                        menu:
                          subProduct.subProductCode ===
                            'LIMITED_DDA_PAYMENTS' &&
                          state === 'pending' &&
                          onCancelProductAddition
                            ? {
                                label: tString('submission.changeMenu', {
                                  name:
                                    subProduct.subProduct ?? subProduct.product,
                                }),
                                actions: [
                                  {
                                    id: 'cancel-product',
                                    label: tString(
                                      'productCancellation.action'
                                    ),
                                    icon: <Undo2Icon />,
                                    destructive: true,
                                    onSelect: () =>
                                      setIsProductCancellationOpen(true),
                                  },
                                ],
                              }
                            : undefined,
                      };
                    });
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
          </OverviewPanel>
          {tasksPanel}
        </div>
      </div>

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
