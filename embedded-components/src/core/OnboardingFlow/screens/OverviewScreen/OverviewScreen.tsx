import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { cloneDeep, merge } from 'lodash';
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
  Loader2Icon,
  LockIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { useFormState } from 'react-hook-form';

import {
  canVerifyMicrodeposits,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
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
  computeCompletedDeltaPendingGroupKeys,
  countDeltaQuestionProgress,
  DeltaPendingFieldsPanel,
  isDeltaQuestionAnswered,
  useDeltaPendingFieldsForm,
  useSaveDeltaPendingFields,
} from '@/core/OnboardingFlow/screens/ReviewAndAttestSectionForms/ReviewForm/DeltaPendingFieldsPanel';
import {
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { scrollToDeltaSection } from '@/core/OnboardingFlow/utils/deltaMode';
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

/**
 * Recursively keep only the blurred (touched) leaves of `values`, guided by
 * RHF's `touchedFields` tree. Used to publish a blur-gated overlay to the
 * sidebar delta timeline so a party substep reads complete only once its field
 * is blurred — matching the panel progress bar — never mid-typing.
 */
function pickTouchedLeaves(value: unknown, touched: unknown): unknown {
  if (touched === true) {
    return value;
  }
  if (!touched || typeof touched !== 'object' || value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const touchedArr = touched as unknown[];
    const picked = value.map((item, i) =>
      pickTouchedLeaves(item, touchedArr[i])
    );
    return picked.some((v) => v !== undefined) ? picked : undefined;
  }
  const touchedObj = touched as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  let any = false;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const picked = pickTouchedLeaves(
      (value as Record<string, unknown>)[key],
      touchedObj[key]
    );
    if (picked !== undefined) {
      out[key] = picked;
      any = true;
    }
  }
  return any ? out : undefined;
}

export const OverviewScreen = () => {
  const {
    clientData,
    showLinkAccountStep,
    showDownloadChecklist,
    disclosureConfig,
  } = useOnboardingContext();
  const {
    currentScreenId,
    sections,
    staticScreens,
    goTo,
    sessionData,
    updateSessionData,
    savedFormValues,
    deltaModeActive,
    isFormSubmitting,
    setLiveReviewFormValues,
  } = useFlowContext();

  // -------------------------------------------------------------------------
  // Delta mode: a focused "complete missing items" view of the overview.
  // -------------------------------------------------------------------------
  const {
    form: deltaForm,
    allQuestions: deltaAllQuestions,
    stepSchemas: deltaStepSchemas,
    baselinePendingGroups: deltaBaselineGroups,
  } = useDeltaPendingFieldsForm(sections);
  const {
    save: saveDeltaFields,
    saveError: deltaSaveError,
    partyUpdateError: deltaPartyError,
    clientUpdateError: deltaClientError,
  } = useSaveDeltaPendingFields(deltaForm, deltaAllQuestions);

  const deltaOwnerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];
  const deltaOutstandingQuestionIds =
    clientData?.outstanding?.questionIds ?? [];

  const hasDeltaItems =
    deltaBaselineGroups.length > 0 || deltaOutstandingQuestionIds.length > 0;
  const deltaAvailable = deltaModeActive && hasDeltaItems;

  const overviewViewMode: 'delta' | 'full' = deltaAvailable
    ? (sessionData.overviewViewMode ?? 'delta')
    : 'full';

  // Latched while "Save & continue" persists and navigates to review. Saving
  // resolves the pending items, so `deltaAvailable` flips false the instant the
  // client refetch lands — without this the FULL overview would render for one
  // frame before `goTo('review-attest-section')` runs (a visible flash).
  const [isFinishingDelta, setIsFinishingDelta] = useState(false);

  // While finishing, the post-save refetch resolves the pending fields and the
  // panel collapses to nothing. To avoid a layout shift, we lock the panel
  // wrapper to its pre-save height and mask it with a loading overlay until we
  // navigate to review. Height is captured at click time (fields still shown).
  const deltaPanelRef = useRef<HTMLDivElement>(null);
  const [lockedPanelHeight, setLockedPanelHeight] = useState<
    number | undefined
  >(undefined);

  const isDeltaView =
    (deltaAvailable && overviewViewMode === 'delta') || isFinishingDelta;

  // Re-render on touch changes only — a party field blur, or a question
  // radio/select selection (which marks itself touched via setValue
  // shouldTouch). Text-question keystrokes no longer re-render this screen
  // (their completion is blur-gated), matching the isolated party text inputs
  // and keeping typing lag-free. `touchedFields` also blur-gates the
  // remaining-count so an item only counts as done once settled.
  const { touchedFields: deltaTouchedFields } = useFormState({
    control: deltaForm.control,
  });
  const liveDeltaValues = deltaForm.getValues() as Record<string, unknown>;

  // Blur-gated overlay published to the sidebar delta timeline. Every leaf —
  // party fields AND question answers — is included only once touched. Text
  // fields become touched on blur; question radios/selects mark themselves
  // touched on selection (setValue shouldTouch). This keeps the timeline's
  // substep completion in lockstep with the panel's progress bar (also
  // blur-gated) — a substep never ticks done mid-typing.
  const publishedDeltaOverlay = useMemo(() => {
    const touchedValues: Record<string, unknown> = {};
    for (const key of Object.keys(liveDeltaValues)) {
      const picked = pickTouchedLeaves(
        liveDeltaValues[key],
        (deltaTouchedFields as Record<string, unknown> | undefined)?.[key]
      );
      if (picked !== undefined) {
        touchedValues[key] = picked;
      }
    }
    return merge(cloneDeep(savedFormValues ?? {}), touchedValues);
  }, [savedFormValues, liveDeltaValues, deltaTouchedFields]);

  // Publish the blur-gated overlay so the sidebar delta timeline's checklist
  // tracks settled (blurred) values. Guarded by a signature: setLiveReviewFormValues
  // updates FlowContext (re-rendering this screen), so without the guard this
  // would re-publish forever.
  const publishedDeltaSigRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isDeltaView) {
      if (publishedDeltaSigRef.current !== undefined) {
        publishedDeltaSigRef.current = undefined;
        setLiveReviewFormValues(undefined);
      }
      return;
    }
    const sig = JSON.stringify(publishedDeltaOverlay);
    if (sig !== publishedDeltaSigRef.current) {
      publishedDeltaSigRef.current = sig;
      setLiveReviewFormValues(publishedDeltaOverlay);
    }
    // Re-publishes whenever this screen re-renders with a changed blur-gated
    // overlay — i.e. on blur (touchedFields) or a question change — so the
    // sidebar checklist tracks settled values, not every keystroke.
  }, [isDeltaView, publishedDeltaOverlay, setLiveReviewFormValues]);

  // Group completeness for the resume banner / remaining-count. Pure safeParse
  // against the pre-built schemas (no hooks). Memoized on the party-value
  // signature (excludes `question_*`) so answering an operational-details
  // question does NOT re-run the safeParse over every pending party schema —
  // that recompute is the question-input lag. Party edits still invalidate it.
  const deltaPartyValuesSignature = Object.keys(liveDeltaValues)
    .filter((key) => !key.startsWith('question_'))
    .map((key) => `${key}=${JSON.stringify(liveDeltaValues[key])}`)
    .join('|');
  const deltaPartyTouchedSignature = deltaBaselineGroups
    .flatMap((group) => group.fields.map((field) => field.formPath))
    .filter((path) => !!deltaForm.getFieldState(path as never).isTouched)
    .join('|');
  const deltaCompletedGroupKeys = useMemo(
    () =>
      computeCompletedDeltaPendingGroupKeys({
        baselinePendingGroups: deltaBaselineGroups,
        sections,
        clientData,
        ownerSteps: deltaOwnerSteps,
        liveOverlay: { ...savedFormValues, ...liveDeltaValues },
        currentScreenId,
        stepSchemas: deltaStepSchemas,
        touchedFields: deltaTouchedFields,
      }),
    // Keyed on the party value + touched signatures (not the fresh
    // `liveDeltaValues` / `deltaTouchedFields` objects) so question changes
    // don't invalidate it.
    [
      deltaPartyValuesSignature,
      deltaPartyTouchedSignature,
      deltaBaselineGroups,
      sections,
      clientData,
      deltaOwnerSteps,
      savedFormValues,
      currentScreenId,
      deltaStepSchemas,
    ]
  );
  const deltaRemainingCount: number = (() => {
    if (!deltaAvailable) {
      return 0;
    }
    const groupsRemaining = deltaBaselineGroups.filter(
      (g) => !deltaCompletedGroupKeys.has(g.key)
    ).length;
    // Count questions individually, honoring parent/child reveals (parent +
    // each revealed child). Blur-gated via the published overlay (touched-only
    // answers) so a text question doesn't count as done mid-typing — matching
    // the party fields.
    const { total, completed } = countDeltaQuestionProgress({
      rootQuestionIds: deltaOutstandingQuestionIds.map(String),
      allQuestions: deltaAllQuestions,
      getAnswerValues: (id) => liveDeltaValues[`question_${id}`],
      isAnswered: (id) => isDeltaQuestionAnswered(publishedDeltaOverlay, id),
    });
    const questionsRemaining = total - completed;
    return groupsRemaining + questionsRemaining;
  })();

  const [showDeltaIncompleteAlert, setShowDeltaIncompleteAlert] =
    useState(false);

  const setOverviewViewMode = (mode: 'delta' | 'full') => {
    updateSessionData({ overviewViewMode: mode });
  };

  // Submit via RHF `handleSubmit` (not `trigger`) so `formState.isSubmitted`
  // flips true — that's what activates `reValidateMode: 'onChange'`, letting
  // error messages clear live as the user fixes them after a failed submit.
  // The resolver is delta-scoped (party errors only for baseline pending
  // groups + outstanding questions), so a full-form submit validates exactly
  // the delta items — already-valid data can't spuriously block.
  const handleDeltaSaveAndContinue = () =>
    deltaForm.handleSubmit(
      async () => {
        setShowDeltaIncompleteAlert(false);
        // Lock the panel height (fields still rendered) and latch the delta view
        // so the post-save collapse is masked by the overlay instead of shifting
        // the layout while we await the refetch.
        setLockedPanelHeight(deltaPanelRef.current?.offsetHeight);
        setIsFinishingDelta(true);
        const saved = await saveDeltaFields();
        if (!saved) {
          setIsFinishingDelta(false);
          setLockedPanelHeight(undefined);
          return;
        }
        goTo('review-attest-section');
      },
      () => {
        setShowDeltaIncompleteAlert(true);
        // First invalid field in visual order: party groups (rendered first),
        // then the operational-details questions. Scroll its group card into
        // view AND focus the field itself so the user lands on exactly what's
        // wrong (questions have no group card, so setFocus brings them in).
        const orderedFieldNames = [
          ...deltaBaselineGroups.flatMap((group) =>
            group.fields.map((field) => field.formPath)
          ),
          ...deltaOutstandingQuestionIds.map((id) => `question_${id}`),
        ];
        const firstInvalidName = orderedFieldNames.find(
          (name) => deltaForm.getFieldState(name as never).error
        );
        if (firstInvalidName) {
          const firstErroredGroup = deltaBaselineGroups.find((group) =>
            group.fields.some((field) => field.formPath === firstInvalidName)
          );
          if (firstErroredGroup) {
            const [sectionId, maybeOwnerId] = firstErroredGroup.key.split(':');
            scrollToDeltaSection(
              sectionId === 'owners-section'
                ? `owners-section:${maybeOwnerId}`
                : sectionId
            );
          }
          try {
            deltaForm.setFocus(firstInvalidName as never, {
              shouldSelect: true,
            });
          } catch {
            // Composite/custom fields may not expose a focusable ref; the group
            // scroll above already brought the field into view.
          }
        }
      }
    )();

  // getFlowProgress -> getStepperValidations -> Component.schema() ->
  // useGetValidationMessage are hook-based; run at the top level of render.
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
      title={
        isDeltaView
          ? t('screens.overview.deltaView.title', 'Complete your application')
          : t('screens.overview.title')
      }
      headerElement={
        !isDeltaView && showDownloadChecklist ? (
          <Button variant="outline" size="sm">
            <DownloadIcon /> {t('screens.overview.downloadChecklist')}
          </Button>
        ) : undefined
      }
      subTitle={
        isDeltaView ? (
          <Alert variant="informative" density="sm" noTitle>
            <InfoIcon className="eb-size-4" />
            <AlertDescription>
              {disclosureConfig?.platformName
                ? t('screens.overview.deltaView.partnerAlert', {
                    partnerName: disclosureConfig.platformName,
                    defaultValue:
                      '{{partnerName}} has already provided most of your information — just add the items below to finish.',
                  })
                : t(
                    'screens.overview.deltaView.partnerAlertGeneric',
                    'Most of your information has already been provided — just add the items below to finish.'
                  )}
            </AlertDescription>
          </Alert>
        ) : !sessionData.hideOverviewInfoAlert &&
          clientData?.status === 'NEW' ? (
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
      description={
        isDeltaView
          ? t(
              'screens.overview.deltaView.description',
              'Complete the remaining details below, then continue to review and submit.'
            )
          : t('screens.overview.description')
      }
    >
      <div className="eb-flex-auto eb-space-y-6">
        {isDeltaView && (
          <div className="eb-mt-6 eb-space-y-6">
            {showDeltaIncompleteAlert && (
              <Alert variant="warning">
                <AlertTriangleIcon className="eb-h-4 eb-w-4" />
                <AlertTitle>
                  {t('reviewAndAttest.thereIsAProblem', 'There is a problem')}
                </AlertTitle>
                <AlertDescription>
                  {t(
                    'reviewAndAttest.provideMissingDetails',
                    'Please provide missing details before finishing your application.'
                  )}
                </AlertDescription>
              </Alert>
            )}
            <div
              ref={deltaPanelRef}
              className="eb-relative"
              style={
                isFinishingDelta && lockedPanelHeight
                  ? { minHeight: lockedPanelHeight }
                  : undefined
              }
            >
              <DeltaPendingFieldsPanel
                sections={sections}
                form={deltaForm}
                stepSchemas={deltaStepSchemas}
                baselinePendingGroups={deltaBaselineGroups}
              />
              {isFinishingDelta && (
                <div className="eb-absolute eb-inset-0 eb-flex eb-items-center eb-justify-center eb-bg-background/60">
                  <Loader2Icon className="eb-size-8 eb-animate-spin eb-text-primary" />
                </div>
              )}
            </div>
            <ServerErrorAlert
              error={
                deltaPartyError ||
                deltaClientError ||
                (deltaSaveError
                  ? ({ message: 'Failed to save remaining details' } as any)
                  : undefined)
              }
            />
            <div className="eb-flex eb-flex-col eb-gap-3">
              <Button
                type="button"
                size="lg"
                className="eb-w-full eb-text-lg"
                disabled={isFormSubmitting}
                onClick={() => {
                  handleDeltaSaveAndContinue().catch(() => {
                    // Errors surfaced via ServerErrorAlert / form state
                  });
                }}
              >
                {isFormSubmitting && (
                  <Loader2Icon className="eb-animate-spin" />
                )}
                {t(
                  'screens.overview.deltaToggle.saveAndContinue',
                  'Save & continue'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="eb-w-full eb-text-lg"
                onClick={() => setOverviewViewMode('full')}
              >
                {t(
                  'screens.overview.deltaView.reviewAll',
                  'Review all details'
                )}
              </Button>
            </div>
          </div>
        )}

        {overviewViewMode === 'full' && (
          <>
            {deltaAvailable && (
              <Alert variant="informative" className="eb-mt-6">
                <ClipboardListIcon className="eb-h-4 eb-w-4" />
                <AlertTitle>
                  {t(
                    'screens.overview.deltaView.resumeBanner.title',
                    'Almost done'
                  )}
                </AlertTitle>
                <AlertDescription className="eb-flex eb-flex-col eb-gap-3 sm:eb-flex-row sm:eb-items-center sm:eb-justify-between">
                  <span>
                    {t('screens.overview.deltaView.resumeBanner.description', {
                      count: deltaRemainingCount,
                      defaultValue_one:
                        'You have {{count}} item left to complete before submitting.',
                      defaultValue_other:
                        'You have {{count}} items left to complete before submitting.',
                    })}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="eb-shrink-0"
                    onClick={() => setOverviewViewMode('delta')}
                  >
                    {t(
                      'screens.overview.deltaView.resumeBanner.action',
                      'Finish your application'
                    )}
                    <ArrowRightIcon />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
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
                                  <span className="eb-sr-only">
                                    Not started
                                  </span>
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
                                ['on_hold', 'not_started'].includes(
                                  sectionStatus
                                )
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
          </>
        )}
        {overviewViewMode === 'full' && showLinkAccountStep && (
          <LinkedBankAccountSection />
        )}
      </div>
    </StepLayout>
  );
};
