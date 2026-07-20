import { useMemo, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  ClipboardListIcon,
  Clock9Icon,
  DownloadIcon,
  InfoIcon,
  LockIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';

import {
  canVerifyMicrodeposits,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  MAJOR_STOCK_EXCHANGES,
  PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES,
} from '@/core/OnboardingFlow/consts/stockExchanges';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import {
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { getLinkAccountEnabled } from '@/core/OnboardingFlow/utils/getLinkAccountEnabled';
import { RecipientAccountDisplayCard } from '@/core/RecipientWidgets/components/RecipientAccountDisplayCard/RecipientAccountDisplayCard';
import { RecipientDetailsDialog } from '@/core/RecipientWidgets/components/RecipientDetailsDialog/RecipientDetailsDialog';
import { RejectedAccountsAccordion } from '@/core/RecipientWidgets/components/RejectedAccountsAccordion/RejectedAccountsAccordion';
import { RemoveAccountDialogTrigger } from '@/core/RecipientWidgets/components/RemoveAccountDialog/RemoveAccountDialog';
import { StatusAlert } from '@/core/RecipientWidgets/components/StatusAlert/StatusAlert';
import { MicrodepositsFormDialogTrigger } from '@/core/RecipientWidgets/forms/MicrodepositsForm/MicrodepositsForm';
import { LINKED_ACCOUNT_USER_JOURNEYS } from '@/core/RecipientWidgets/RecipientWidgets.constants';
import { invalidateRecipientQueries } from '@/core/RecipientWidgets/utils/invalidateRecipientQueries';

import { getFlowProgress } from '../../utils/flowUtils';

/**
 * Resolve the review-in-progress description key based on document-request state.
 */
const getReviewInProgressDescriptionKey = (
  docRequestsClosed: boolean,
  hasAnyDocumentRequests: boolean
) => {
  if (!docRequestsClosed) {
    return 'screens.overview.verifyBusinessSection.reviewInProgress.description';
  }
  if (hasAnyDocumentRequests) {
    return 'screens.overview.verifyBusinessSection.documentsReceived.description';
  }
  return 'screens.overview.verifyBusinessSection.applicationSubmitted.description';
};

/**
 * Status-driven informational/warning alerts for the Verify Business section.
 */
const VerifyBusinessStatusAlerts = ({
  status,
  docRequestsClosed,
  hasAnyDocumentRequests,
}: {
  status: string | undefined;
  docRequestsClosed: boolean;
  hasAnyDocumentRequests: boolean;
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  if (status === 'REVIEW_IN_PROGRESS') {
    const descriptionKey = getReviewInProgressDescriptionKey(
      docRequestsClosed,
      hasAnyDocumentRequests
    );
    return (
      <Alert variant="informative" density="sm" className="eb-mb-6" noTitle>
        <Clock9Icon className="eb-size-4" />
        <AlertDescription>{t(descriptionKey)}</AlertDescription>
      </Alert>
    );
  }

  if (status === 'INFORMATION_REQUESTED') {
    return (
      <Alert variant="warning" density="sm" className="eb-mb-6" noTitle>
        <AlertTriangleIcon className="eb-size-4" />
        <AlertDescription>
          {t(
            'screens.overview.verifyBusinessSection.informationRequested.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'DECLINED') {
    return (
      <Alert variant="destructive" density="sm" noTitle>
        <AlertCircleIcon className="eb-size-4" />
        <AlertDescription>
          {t('screens.overview.verifyBusinessSection.declined.description')}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'APPROVED') {
    return (
      <Alert variant="success" density="sm" noTitle>
        <CheckIcon className="eb-size-4" />
        <AlertDescription>
          {t('screens.overview.verifyBusinessSection.approved.description')}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

/**
 * Business-type summary card shown for NEW clients — self-contained: consumes
 * onboarding/flow contexts and derives PTC display info internally.
 */
const BusinessTypeNewSection = () => {
  const { organizationType, clientData, enablePubliclyTradedCompanies } =
    useOnboardingContext();
  const { goTo } = useFlowContext();
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  const organizationTypeText = t(`organizationTypes.${organizationType!}`);

  const orgParty = getOrganizationParty(clientData);
  const publiclyTraded = enablePubliclyTradedCompanies
    ? orgParty?.organizationDetails?.publiclyTraded
    : undefined;
  const isSubsidiary = orgParty?.organizationDetails?.isSubsidiary;
  const stockExchangeDisplayName = useMemo(() => {
    if (!publiclyTraded?.stockExchange) return undefined;
    if (publiclyTraded.stockExchange === 'Other') {
      return publiclyTraded.stockExchangeName ?? 'Other';
    }
    const match = MAJOR_STOCK_EXCHANGES.find(
      ([code]) => code === publiclyTraded.stockExchange
    );
    return match ? `${match[1]} (${match[0]})` : publiclyTraded.stockExchange;
  }, [publiclyTraded?.stockExchange, publiclyTraded?.stockExchangeName]);

  return (
    <div className="eb-space-y-3 eb-rounded eb-bg-accent eb-px-4 eb-py-3">
      <p className="eb-text-xs eb-font-semibold eb-tracking-normal eb-text-muted-foreground">
        {t('screens.overview.verifyBusinessSection.businessTypeLabel')}
      </p>
      <div>
        <span
          id="business-structure"
          className="eb-inline-flex eb-h-10 eb-w-full eb-items-center eb-justify-between eb-gap-2 eb-rounded-input eb-border eb-py-2 eb-pl-3 eb-text-sm"
        >
          <span className="eb-flex eb-text-start eb-font-sans eb-text-sm eb-font-normal eb-normal-case eb-text-foreground">
            {organizationTypeText}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo('gateway')}
            aria-label="Edit business type"
            className="eb-rounded-input hover:eb-bg-black/5"
          >
            <PencilIcon />
            {t('screens.overview.verifyBusinessSection.editBusinessType')}
          </Button>
        </span>

        {publiclyTraded ? (
          <div className="eb-mt-2 eb-space-y-1 eb-text-xs eb-text-muted-foreground">
            <p className="eb-font-medium">
              {isSubsidiary
                ? t('screens.overview.verifyBusinessSection.ptcSubsidiaryLabel')
                : t('screens.overview.verifyBusinessSection.ptcLabel')}
            </p>
            <p>
              {t('screens.overview.verifyBusinessSection.ptcTicker', {
                ticker: publiclyTraded.tickerSymbol,
              })}
            </p>
            {stockExchangeDisplayName && (
              <p>
                {t('screens.overview.verifyBusinessSection.ptcExchange', {
                  exchange: stockExchangeDisplayName,
                })}
              </p>
            )}
          </div>
        ) : (
          enablePubliclyTradedCompanies &&
          PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES.includes(
            organizationType as any
          ) && (
            <p className="eb-mt-2 eb-text-xs eb-text-muted-foreground">
              {t('screens.overview.verifyBusinessSection.ptcHint')}
            </p>
          )
        )}

        <p className="eb-mt-3 eb-flex eb-gap-2 eb-text-xs eb-italic eb-text-muted-foreground">
          <span className="eb-sr-only">{t('common:warning')}:</span>
          <AlertTriangleIcon className="eb-size-4" aria-hidden="true" />
          {t('screens.overview.verifyBusinessSection.changeWarning')}
        </p>
      </div>
    </div>
  );
};

/** Multi-account overview: summary + "manage linked accounts" CTA. */
const MultiLinkedAccountsView = ({
  linkedAccounts,
  linkAccountEnabled,
  successAlert,
  lockedMessage,
  onManage,
}: {
  linkedAccounts: Recipient[];
  linkAccountEnabled: boolean;
  successAlert: ReactNode;
  lockedMessage: ReactNode;
  onManage: () => void;
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  return (
    <>
      {successAlert}
      {lockedMessage}
      <Card className="eb-rounded-md eb-border eb-bg-card eb-p-4">
        <p className="eb-text-sm eb-text-foreground">
          {linkedAccounts.length === 1
            ? t(
                'screens.overview.bankAccountSection.multiAccountOverviewDescriptionSingular',
                'You have 1 linked account for payouts. Open the bank linking step to add another account or manage details.'
              )
            : t(
                'screens.overview.bankAccountSection.multiAccountOverviewDescriptionPlural',
                'You have {{count}} linked accounts for payouts. Open the bank linking step to add another account or manage details.',
                { count: linkedAccounts.length }
              )}
        </p>
        <div className="eb-mt-4 eb-flex eb-justify-end">
          <Button
            variant={linkAccountEnabled ? 'default' : 'secondary'}
            size="sm"
            disabled={!linkAccountEnabled}
            data-testid="overview-manage-linked-accounts"
            onClick={onManage}
          >
            {t(
              'screens.overview.bankAccountSection.manageLinkedAccountsButton',
              'Manage linked accounts'
            )}
            <ChevronRightIcon />
          </Button>
        </div>
      </Card>
    </>
  );
};

/** Single-account overview: the linked account card with verify/details/remove actions. */
const SingleLinkedAccountView = ({
  recipient,
  successAlert,
  hideLinkedAccountRemoval,
  onRemoveSuccess,
}: {
  recipient: Recipient;
  successAlert: ReactNode;
  hideLinkedAccountRemoval: boolean;
  onRemoveSuccess: () => void;
}) => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);
  const displayName = getRecipientDisplayName(recipient);

  const verifyAction = canVerifyMicrodeposits(recipient) ? (
    <MicrodepositsFormDialogTrigger recipientId={recipient.id}>
      <Button
        variant="default"
        size="sm"
        data-user-event={LINKED_ACCOUNT_USER_JOURNEYS.VERIFY_STARTED}
        aria-label={`${tString('linked-accounts:actions.verifyAccount')} for ${displayName}`}
      >
        <span>{t('linked-accounts:actions.verifyAccount')}</span>
        <ArrowRightIcon className="eb-ml-2 eb-h-4 eb-w-4" aria-hidden="true" />
      </Button>
    </MicrodepositsFormDialogTrigger>
  ) : undefined;

  const statusAlertNode =
    recipient.status && recipient.status !== 'ACTIVE' ? (
      <StatusAlert status={recipient.status} action={verifyAction} />
    ) : undefined;

  return (
    <>
      {successAlert}
      <RecipientAccountDisplayCard
        recipient={recipient}
        statusAlert={statusAlertNode}
        showAccountToggle
        showPaymentMethods
        allowDetailedPaymentMethods={false}
        actionsContent={
          <div
            className="eb-flex eb-items-center eb-gap-2"
            role="group"
            aria-label="Account actions"
          >
            <RecipientDetailsDialog recipient={recipient}>
              <Button
                variant="ghost"
                size="sm"
                className="eb-gap-1.5"
                aria-label={`${tString('linked-accounts:actions.viewDetails')} for ${displayName}`}
              >
                <ClipboardListIcon
                  className="eb-h-4 eb-w-4"
                  aria-hidden="true"
                />
                <span>{t('linked-accounts:actions.viewDetails')}</span>
              </Button>
            </RecipientDetailsDialog>
            {!hideLinkedAccountRemoval ? (
              <RemoveAccountDialogTrigger
                recipient={recipient}
                i18nNamespace="linked-accounts"
                onRemoveSuccess={onRemoveSuccess}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="eb-gap-1.5 eb-text-destructive hover:eb-text-destructive"
                  data-user-event={LINKED_ACCOUNT_USER_JOURNEYS.REMOVE_STARTED}
                  aria-label={`${tString('linked-accounts:actions.remove')} ${displayName}`}
                >
                  <TrashIcon className="eb-h-4 eb-w-4" aria-hidden="true" />
                  <span>{t('linked-accounts:actions.remove')}</span>
                </Button>
              </RemoveAccountDialogTrigger>
            ) : null}
          </div>
        }
      />
    </>
  );
};

/** Not-started overview: rejected-accounts accordion + "link account" start card. */
const NoLinkedAccountView = ({
  clientId,
  linkAccountEnabled,
  lockedMessage,
  onStart,
}: {
  clientId?: string;
  linkAccountEnabled: boolean;
  lockedMessage: ReactNode;
  onStart: () => void;
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  return (
    <div className="eb-space-y-3">
      <RejectedAccountsAccordion
        recipientType="LINKED_ACCOUNT"
        queryParams={{ clientId }}
      />
      {lockedMessage}
      <Card
        className={cn('eb-rounded-md eb-border eb-bg-card eb-p-3', {
          'eb-border-dashed eb-border-muted-foreground': !linkAccountEnabled,
        })}
      >
        <div className="eb-flex eb-w-full eb-justify-between">
          <div className="eb-flex eb-items-center eb-gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.5 4V3H6.5V4H5.5Z" fill="#4C5157" fillOpacity="0.4" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 0L12 6H10V11H12V12H0V11L2 11V6H0L6 0ZM3 6V11H4V6H3ZM5 6V11H7V6H5ZM8 6V11H9V6H8ZM6 1.41421L9.58579 5H2.41421L6 1.41421Z"
                fill="#4C5157"
                fillOpacity={linkAccountEnabled ? '1' : '0.8'}
              />
            </svg>
            <h3
              className={cn('eb-font-header eb-text-lg eb-font-medium', {
                'eb-text-muted-foreground': !linkAccountEnabled,
              })}
            >
              {t('screens.overview.bankAccountSection.linkAccountTitle')}
            </h3>
          </div>

          <div className="eb-flex [&_svg]:eb-size-4">
            <CircleDashedIcon className="eb-stroke-gray-600" />
            <span className="eb-sr-only">Not started</span>
          </div>
        </div>
        <div className="eb-flex eb-justify-end">
          <Button
            variant="secondary"
            size="sm"
            className="eb-mt-3"
            disabled={!linkAccountEnabled}
            onClick={onStart}
          >
            {t('common:start')}
            <ChevronRightIcon />
          </Button>
        </div>
      </Card>
    </div>
  );
};

/**
 * Overview "Link a bank account" section — self-contained: consumes onboarding
 * and flow contexts plus its own linked-recipients query. Rendered only when
 * showLinkAccountStep is true.
 */
const LinkedBankAccountSection = () => {
  const queryClient = useQueryClient();
  const {
    clientData,
    linkAccountEnabledStatuses,
    linkAccountStepOptions,
    hideLinkedAccountRemoval,
  } = useOnboardingContext();
  const { sessionData, updateSessionData, goTo } = useFlowContext();
  const { t } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);

  const linkAccountEnabled = getLinkAccountEnabled(
    clientData,
    linkAccountEnabledStatuses
  );

  const { data: recipientsData, isLoading: isLoadingLinkedRecipients } =
    useGetAllRecipients(
      { type: 'LINKED_ACCOUNT', clientId: clientData?.id },
      {
        query: {
          enabled: !!clientData?.id,
        },
      }
    );

  const linkedAccounts =
    recipientsData?.recipients?.filter(
      (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
    ) ?? [];

  const existingLinkedAccount: Recipient | undefined = linkedAccounts[0];

  const successAlert = sessionData.linkAccountJustCreated ? (
    <Alert variant="success" density="sm" className="eb-mb-2" noTitle>
      <CheckCircle2Icon className="eb-size-4" />
      <AlertDescription className="eb-pr-6">
        {t(
          `screens.overview.bankAccountSection.successAlert.${existingLinkedAccount?.status ?? 'ACTIVE'}`,
          'Your bank account details have been submitted successfully.'
        )}
      </AlertDescription>
      <button
        type="button"
        className="eb-absolute eb-right-4 eb-top-3 eb-rounded-sm eb-opacity-70 hover:eb-opacity-100 focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2"
        onClick={() => updateSessionData({ linkAccountJustCreated: false })}
      >
        <XIcon className="eb-size-4" />
        <span className="eb-sr-only">Close</span>
      </button>
    </Alert>
  ) : null;

  const lockedMessage = !linkAccountEnabled ? (
    <p className="eb-mb-3 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium eb-text-muted-foreground">
      <LockIcon className="eb-size-4" />
      {t('screens.overview.bankAccountSection.lockedMessage')}
    </p>
  ) : null;

  const renderContent = () => {
    if (isLoadingLinkedRecipients) {
      return (
        <div className="eb-space-y-3 eb-pt-1">
          <Skeleton className="eb-h-5 eb-w-full eb-max-w-xs" />
          <Skeleton className="eb-h-28 eb-w-full eb-rounded-md" />
        </div>
      );
    }
    if (linkedAccounts.length === 0) {
      return (
        <NoLinkedAccountView
          clientId={clientData?.id}
          linkAccountEnabled={linkAccountEnabled}
          lockedMessage={lockedMessage}
          onStart={() => goTo('link-account')}
        />
      );
    }
    if (linkAccountStepOptions?.allowMultipleAccounts) {
      return (
        <MultiLinkedAccountsView
          linkedAccounts={linkedAccounts}
          linkAccountEnabled={linkAccountEnabled}
          successAlert={successAlert}
          lockedMessage={lockedMessage}
          onManage={() => goTo('link-account')}
        />
      );
    }
    return (
      <SingleLinkedAccountView
        recipient={existingLinkedAccount}
        successAlert={successAlert}
        hideLinkedAccountRemoval={!!hideLinkedAccountRemoval}
        onRemoveSuccess={() =>
          invalidateRecipientQueries(queryClient, 'LINKED_ACCOUNT')
        }
      />
    );
  };

  return (
    <Card className="eb-mt-6 eb-rounded-md eb-border-none eb-bg-card">
      <CardHeader className="eb-p-3">
        <CardTitle className="eb-font-header eb-text-2xl eb-font-medium">
          {t('screens.overview.bankAccountSection.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="eb-p-3 eb-pt-0">
        <div className="eb-space-y-3">{renderContent()}</div>
      </CardContent>
    </Card>
  );
};

export const OverviewScreen = () => {
  const { clientData, showLinkAccountStep, showDownloadChecklist } =
    useOnboardingContext();
  const {
    currentScreenId,
    sections,
    goTo,
    sessionData,
    updateSessionData,
    savedFormValues,
  } = useFlowContext();

  const { sectionStatuses, stepValidations } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  const { t } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
    'linked-accounts',
  ]);

  // Fetch document requests to check for outstanding requests
  const { data: documentRequestListResponse } = useSmbdoListDocumentRequests(
    {
      clientId: clientData?.id,
      // @ts-expect-error - API expects this parameter
      includeRelatedParty: true,
    },
    {
      query: {
        enabled: !!clientData?.id,
      },
    }
  );

  const documentRequests = documentRequestListResponse?.documentRequests;
  const hasAnyDocumentRequests = (documentRequests?.length ?? 0) > 0;
  const hasOutstandingDocRequests = documentRequests?.some(
    (docRequest) => docRequest.status === 'ACTIVE'
  );
  const docRequestsClosed = !hasOutstandingDocRequests;

  const verifyBusinessSectionTitleKey = useMemo(() => {
    const status = clientData?.status;
    if (status === 'NEW' || status === 'INFORMATION_REQUESTED') {
      return 'screens.overview.verifyBusinessSection.title' as const;
    }
    if (status === 'APPROVED') {
      return 'screens.overview.verifyBusinessSection.approved.title' as const;
    }
    if (status === 'DECLINED') {
      return 'screens.overview.verifyBusinessSection.declined.title' as const;
    }
    if (status === 'REVIEW_IN_PROGRESS') {
      if (!docRequestsClosed) {
        return 'screens.overview.verifyBusinessSection.reviewInProgress.title' as const;
      }
      if (hasAnyDocumentRequests) {
        return 'screens.overview.verifyBusinessSection.documentsReceived.title' as const;
      }
      return 'screens.overview.verifyBusinessSection.applicationSubmitted.title' as const;
    }
    return 'screens.overview.verifyBusinessSection.title' as const;
  }, [clientData?.status, docRequestsClosed, hasAnyDocumentRequests]);

  return (
    <StepLayout
      title={t('screens.overview.title')}
      headerElement={
        showDownloadChecklist ? (
          <Button variant="outline" size="sm">
            <DownloadIcon /> {t('screens.overview.downloadChecklist')}
          </Button>
        ) : undefined
      }
      subTitle={
        !sessionData.hideOverviewInfoAlert && clientData?.status === 'NEW' ? (
          <Alert variant="informative" density="sm" noTitle>
            <InfoIcon className="eb-size-4" />
            <AlertDescription className="eb-pr-6">
              {t('screens.overview.infoAlert')}
            </AlertDescription>
            <button
              type="button"
              className="eb-hover:eb-opacity-100 eb-focus:eb-outline-none eb-focus:eb-ring-2 eb-focus:eb-ring-ring eb-focus:eb-ring-offset-2 eb-disabled:eb-pointer-events-none eb-absolute eb-right-4 eb-top-3 eb-rounded-sm eb-opacity-70 eb-ring-offset-background eb-transition-opacity data-[state=open]:eb-bg-accent data-[state=open]:eb-text-muted-foreground [&&]:eb-pl-0"
              onClick={() => {
                updateSessionData({
                  hideOverviewInfoAlert: true,
                });
              }}
            >
              <XIcon className="eb-size-4 eb-pl-0 eb-text-foreground" />
              <span className="eb-sr-only">Close</span>
            </button>
          </Alert>
        ) : undefined
      }
      description={t('screens.overview.description')}
    >
      <div className="eb-flex-auto eb-space-y-6">
        <Card className="eb-mt-6 eb-rounded-md eb-border-none eb-bg-card">
          <CardHeader className="eb-p-3">
            <CardTitle className="eb-font-header eb-text-2xl eb-font-medium">
              {t(verifyBusinessSectionTitleKey)}
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-p-3 eb-pt-0">
            <VerifyBusinessStatusAlerts
              status={clientData?.status}
              docRequestsClosed={docRequestsClosed}
              hasAnyDocumentRequests={hasAnyDocumentRequests}
            />

            <div className="eb-space-y-3">
              {clientData?.status === 'NEW' && <BusinessTypeNewSection />}

              {sections.map((section) => {
                const sectionStatus = sectionStatuses?.[section.id];
                const sectionDisabled =
                  sectionStatus === 'on_hold' ||
                  sectionStatus === 'completed_disabled';
                const firstInvalidStep = stepValidations[section.id]
                  ? section.stepperConfig?.steps.find((step) => {
                      return (
                        stepValidations[section.id][step.id] &&
                        !stepValidations[section.id][step.id].isValid
                      );
                    })?.id
                  : undefined;

                // const sectionVerifying =
                //   sectionStatus === 'verifying' ||
                //   sessionData.mockedVerifyingSectionId === section.id;

                const existingPartyData = getPartyByAssociatedPartyFilters(
                  clientData,
                  section.stepperConfig?.associatedPartyFilters
                );

                if (
                  sectionStatus === 'hidden' ||
                  sectionStatus === 'completed_disabled'
                ) {
                  return null;
                }

                return (
                  <div key={section.id}>
                    {sectionStatus === 'on_hold' &&
                      section.sectionConfig.onHoldTextKey && (
                        <p
                          className={cn(
                            'eb-mb-3 eb-mt-7 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-medium',
                            {
                              'eb-text-muted-foreground': sectionDisabled,
                            }
                          )}
                        >
                          <LockIcon className="eb-size-4" />
                          {t(section.sectionConfig.onHoldTextKey as any)}
                        </p>
                      )}
                    <Card
                      className={cn(
                        'eb-rounded-md eb-border eb-bg-card eb-p-3',
                        {
                          'eb-border-dashed eb-border-muted-foreground':
                            sectionDisabled,
                        }
                      )}
                    >
                      <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                        <div className="eb-flex eb-items-center eb-gap-2">
                          <section.sectionConfig.icon
                            className={cn('eb-size-4', {
                              'eb-text-muted-foreground': sectionDisabled,
                            })}
                            aria-hidden
                          />
                          <h3
                            className={cn(
                              'eb-font-header eb-text-lg eb-font-medium',
                              {
                                'eb-text-muted-foreground': sectionDisabled,
                              }
                            )}
                          >
                            {t(section.sectionConfig.labelKey as any)}
                          </h3>
                        </div>

                        <div className="eb-flex [&_svg]:eb-size-4">
                          {sectionStatus === 'completed' && (
                            <>
                              <CheckCircle2Icon className="eb-stroke-success" />
                              <span className="eb-sr-only">Completed</span>
                            </>
                          )}
                          {['not_started', 'on_hold'].includes(
                            sectionStatus
                          ) && (
                            <>
                              <CircleDashedIcon className="eb-stroke-muted-foreground" />
                              <span className="eb-sr-only">Not started</span>
                            </>
                          )}
                          {sectionStatus === 'missing_details' && (
                            <>
                              <AlertTriangleIcon className="eb-stroke-warning" />
                              <span className="eb-sr-only">
                                Missing details
                              </span>
                            </>
                          )}
                          {/* <Loader2Icon
                      className={cn(
                        'eb-hidden eb-animate-spin eb-stroke-primary',
                        {
                          'eb-block': sectionVerifying,
                        }
                      )}
                    /> */}
                        </div>
                      </div>
                      {(() => {
                        // Derive requirements from visible steps' requirementSummaryKey,
                        // falling back to static requirementsListKeys if no steps have summaries
                        const stepSummaries =
                          section.stepperConfig?.steps
                            .map((step) =>
                              step.requirementSummaryKey
                                ? (t(
                                    step.requirementSummaryKey as any
                                  ) as string)
                                : undefined
                            )
                            .filter(Boolean) ?? [];
                        const items =
                          stepSummaries.length > 0
                            ? stepSummaries
                            : section.sectionConfig.requirementsListKeys?.map(
                                (key) => t(key as any) as string
                              );
                        return items && items.length > 0 ? (
                          <ul className="eb-mt-1.5 eb-w-full eb-list-disc eb-whitespace-break-spaces eb-pl-8 eb-text-start eb-font-sans eb-text-sm eb-font-normal">
                            {items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : null;
                      })()}
                      <div className="eb-flex eb-justify-end">
                        <Button
                          variant={
                            ['completed', 'on_hold'].includes(sectionStatus)
                              ? 'secondary'
                              : 'default'
                          }
                          size="sm"
                          className="eb-mt-3"
                          disabled={sectionDisabled}
                          data-testid={`${section.id}-button`}
                          aria-label={
                            ['on_hold', 'not_started'].includes(sectionStatus)
                              ? `${t('common:start')} ${t(section.sectionConfig.labelKey as any)}`
                              : sectionStatus === 'completed'
                                ? `${t('common:edit')} ${t(section.sectionConfig.labelKey as any)}`
                                : `${t('common:continue')} ${t(section.sectionConfig.labelKey as any)}`
                          }
                          onClick={() => {
                            goTo(section.id, {
                              editingPartyId: existingPartyData.id,
                              previouslyCompleted:
                                sectionStatus === 'completed',
                              initialStepperStepId:
                                firstInvalidStep ??
                                section.stepperConfig?.steps.at(-1)?.id,
                            });
                          }}
                        >
                          {['on_hold', 'not_started'].includes(
                            sectionStatus
                          ) && (
                            <>
                              {t('common:start')}
                              <ChevronRightIcon />
                            </>
                          )}
                          {sectionStatus === 'completed' && (
                            <>
                              {t('common:edit')}
                              <PencilIcon />
                            </>
                          )}
                          {sectionStatus === 'missing_details' && (
                            <>
                              {t('common:continue')}
                              <ChevronRightIcon />
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {showLinkAccountStep && <LinkedBankAccountSection />}
      </div>
    </StepLayout>
  );
};
