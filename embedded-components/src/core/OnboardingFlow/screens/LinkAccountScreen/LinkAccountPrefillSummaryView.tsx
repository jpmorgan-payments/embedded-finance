import { useMemo, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightLeftIcon,
  BanknoteIcon,
  Loader2Icon,
  LockIcon,
  ZapIcon,
} from 'lucide-react';

import type { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { StepLayout } from '@/core/OnboardingFlow/components';
import {
  createBankAccountFormSchema,
  type BankAccountFormConfig,
  type BankAccountFormData,
  type LinkAccountReviewAcknowledgement,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { useGetBankAccountValidationMessage } from '@/core/RecipientWidgets/components/BankAccountForm/BankAccountForm.schema';
import { LinkAccountAcknowledgementsGroup } from '@/core/RecipientWidgets/components/BankAccountForm/linkAccountAcknowledgements';

export type LinkAccountPrefillSummaryViewProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Optional pre-selector element (e.g. account preset dropdown) rendered above the summary. */
  preSelector?: ReactNode;
  data: BankAccountFormData;
  /** Methods shown in the read-only strip (e.g. ACH); selection comes from `data.paymentTypes`. */
  displayedPaymentTypes: readonly RoutingInformationTransactionType[];
  bankFormConfig: BankAccountFormConfig;
  acknowledgements?: readonly LinkAccountReviewAcknowledgement[];
  acknowledgementsIntro?: ReactNode;
  acknowledgementChecked: Record<string, boolean>;
  onAcknowledgementChange: (id: string, value: boolean) => void;
  acknowledgementsComplete: boolean;
  /**
   * Mirrors {@link BankAccountForm} step 2 when {@link BankAccountFormConfig.requiredFields.certification}
   * is true: user must confirm before linking.
   */
  certifyChecked: boolean;
  onCertifyCheckedChange: (checked: boolean) => void;
  onSubmit: (payload: BankAccountFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorAlert?: React.ReactNode;
  submitLabel: string;
  cancelLabel: string;
  groupAriaLabel: string;
  /** Label above the read-only account holder line */
  accountHolderLabel: string;
};

function paymentIcon(type: RoutingInformationTransactionType) {
  switch (type) {
    case 'ACH':
      return <BanknoteIcon className="eb-h-4 eb-w-4" />;
    case 'WIRE':
      return <ArrowRightLeftIcon className="eb-h-4 eb-w-4" />;
    case 'RTP':
      return <ZapIcon className="eb-h-4 eb-w-4" />;
    default:
      return null;
  }
}

function accountHolderDisplayName(data: BankAccountFormData): string {
  if (data.accountType === 'ORGANIZATION') {
    return data.businessName?.trim() ?? '';
  }
  return [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
}

function achRoutingNumber(data: BankAccountFormData): string {
  const row = data.routingNumbers?.find((r) => r.paymentType === 'ACH');
  return row?.routingNumber?.trim() ?? '';
}

export function LinkAccountPrefillSummaryView({
  title,
  description,
  preSelector,
  data,
  displayedPaymentTypes,
  bankFormConfig,
  acknowledgements,
  acknowledgementsIntro,
  acknowledgementChecked,
  onAcknowledgementChange,
  acknowledgementsComplete,
  certifyChecked,
  onCertifyCheckedChange,
  onSubmit,
  onCancel,
  isSubmitting,
  errorAlert,
  submitLabel,
  cancelLabel,
  groupAriaLabel,
  accountHolderLabel,
}: LinkAccountPrefillSummaryViewProps) {
  const { t, tString } = useTranslationWithTokens('bank-account-form');
  const selectedTypes = new Set(data.paymentTypes ?? []);

  const accountHolderName = accountHolderDisplayName(data);
  const routing = achRoutingNumber(data);

  const showDefaultCertification =
    !!bankFormConfig.requiredFields.certification;

  // ─── Client-side validation of prefilled data ─────────────────────────────
  const v = useGetBankAccountValidationMessage();
  const validationErrors = useMemo(() => {
    // Validate with certification disabled — the certify checkbox is a separate
    // UI control, not prefilled data, so its errors should not appear in the alert.
    const configForValidation: BankAccountFormConfig = {
      ...bankFormConfig,
      requiredFields: {
        ...bankFormConfig.requiredFields,
        certification: false,
      },
    };
    const schema = createBankAccountFormSchema(configForValidation, v);
    const result = schema.safeParse(data);
    if (result.success) return [];
    return result.error.issues.map((issue) => issue.message);
  }, [data, bankFormConfig, v]);

  const hasValidationErrors = validationErrors.length > 0;

  const canSubmit =
    acknowledgementsComplete &&
    (!showDefaultCertification || certifyChecked) &&
    !hasValidationErrors;

  return (
    <StepLayout title={title} description={description}>
      <div className="eb-mt-6 eb-space-y-6">
        {preSelector}
        {errorAlert}

        {hasValidationErrors ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="eb-h-4 eb-w-4" />
            <AlertTitle>
              {t('prefillValidation.title', 'Invalid prefilled account data')}
            </AlertTitle>
            <AlertDescription>
              <ul className="eb-mt-1 eb-list-disc eb-pl-4 eb-text-sm">
                {validationErrors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </AlertDescription>
            {tString('prefillValidation.footnote') && (
              <AlertDescription className="eb-mt-2 eb-text-xs eb-text-red-800">
                {t('prefillValidation.footnote')}
              </AlertDescription>
            )}
          </Alert>
        ) : null}

        <div className="eb-space-y-2">
          <Label className="eb-text-sm eb-font-medium">
            {t('paymentMethods.selectAtLeastOne')}
          </Label>
          <div className="eb-space-y-3">
            {displayedPaymentTypes.map((type) => {
              const cfg = bankFormConfig.paymentMethods.configs[type];
              const isSelected = selectedTypes.has(type);
              return (
                <div key={type} className="eb-flex eb-items-center eb-gap-2">
                  <div
                    className={`eb-flex eb-flex-1 eb-items-start eb-gap-3 eb-rounded-lg eb-border eb-p-4 ${
                      isSelected
                        ? 'eb-border-primary eb-bg-primary/5'
                        : 'eb-border-border eb-bg-muted/40 eb-opacity-70'
                    }`}
                  >
                    <div className="eb-pt-0.5 eb-text-primary">
                      {paymentIcon(type)}
                    </div>
                    <div className="eb-flex eb-min-w-0 eb-flex-1 eb-flex-col eb-gap-1">
                      <span className="eb-font-medium">{cfg?.label}</span>
                      {isSelected ? (
                        <span className="eb-inline-flex eb-items-center eb-gap-1 eb-self-start eb-rounded-full eb-bg-informative-accent eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-informative">
                          <LockIcon className="eb-h-3 eb-w-3 eb-shrink-0" />
                          <span>
                            {t('paymentMethods.requiredForLinkedAccount')}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="eb-space-y-2">
          <Label
            htmlFor="eb-prefill-account-holder"
            className="eb-text-sm eb-font-medium"
          >
            {accountHolderLabel}
          </Label>
          <Input
            id="eb-prefill-account-holder"
            value={accountHolderName || '—'}
            readOnly
            disabled
            className="eb-bg-muted/50"
            aria-readonly
          />
        </div>

        <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
          <div className="eb-space-y-2">
            <Label htmlFor="eb-prefill-routing">
              {t('routingNumbers.singleMethodLabel', {
                method: tString('paymentMethods.ACH.shortLabel'),
              })}
            </Label>
            <Input
              id="eb-prefill-routing"
              value={routing}
              readOnly
              disabled
              className="eb-bg-muted/50"
              aria-readonly
            />
          </div>
          <div className="eb-space-y-2">
            <Label htmlFor="eb-prefill-account">
              {t('fields.accountNumber.label')}
            </Label>
            <Input
              id="eb-prefill-account"
              value={data.accountNumber ?? ''}
              readOnly
              disabled
              className="eb-bg-muted/50"
              aria-readonly
            />
          </div>
        </div>

        <div className="eb-space-y-2">
          <Label htmlFor="eb-prefill-bank-type">
            {t('fields.accountType.label')}
          </Label>
          <Input
            id="eb-prefill-bank-type"
            value={
              data.bankAccountType === 'SAVINGS'
                ? tString('accountTypes.savings')
                : tString('accountTypes.checking')
            }
            readOnly
            disabled
            className="eb-bg-muted/50"
            aria-readonly
          />
        </div>

        {acknowledgements?.length ? (
          <LinkAccountAcknowledgementsGroup
            items={acknowledgements}
            checked={acknowledgementChecked}
            onCheckedChange={onAcknowledgementChange}
            disabled={isSubmitting}
            groupAriaLabel={groupAriaLabel}
            intro={acknowledgementsIntro}
          />
        ) : null}

        {showDefaultCertification ? (
          <>
            <Separator />
            <div className="eb-flex eb-items-start eb-space-x-2">
              <Checkbox
                id="eb-link-prefill-certify"
                className="eb-mt-0.5"
                checked={certifyChecked}
                onCheckedChange={(checked) =>
                  onCertifyCheckedChange(checked === true)
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="eb-link-prefill-certify"
                className="eb-cursor-pointer eb-text-sm eb-font-normal eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70"
              >
                {bankFormConfig.content.certificationText}
              </Label>
            </div>
          </>
        ) : null}

        <div className="eb-flex eb-flex-wrap eb-gap-2">
          <Button
            type="button"
            className="eb-inline-flex eb-items-center eb-gap-2"
            disabled={isSubmitting || !canSubmit}
            onClick={() =>
              onSubmit({
                ...data,
                certify: showDefaultCertification ? certifyChecked : true,
              })
            }
          >
            {isSubmitting ? (
              <Loader2Icon className="eb-size-4 eb-animate-spin" aria-hidden />
            ) : null}
            {submitLabel}
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={onCancel}>
            <ArrowLeftIcon className="eb-size-4" />
            {cancelLabel}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
}
