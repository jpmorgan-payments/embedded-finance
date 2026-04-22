import { useTranslationWithTokens } from '@/i18n';
import { InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { AlertDescription } from '@/components/ui/alert';
import { Alert } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import {
  refinePubliclyTradedFormSchema,
  usePubliclyTradedFormSchema,
} from './PubliclyTradedForm.schema';

const STOCK_EXCHANGE_OPTIONS = [
  'XNYS',
  'XNAS',
  'XLON',
  'XTSE',
  'XHKG',
  'XJPX',
  'XASX',
  'XFRA',
  'XPAR',
  'XAMS',
  'Other',
] as const;

export const PubliclyTradedForm: FormStepComponent = () => {
  const { t } = useTranslationWithTokens('onboarding-overview');
  const { organizationType, enablePubliclyTradedCompanies } =
    useOnboardingContext();

  const form =
    useFormContext<z.input<ReturnType<typeof usePubliclyTradedFormSchema>>>();

  const isPTCOrSubsidiary = form.watch('isPTCOrSubsidiary');
  const stockExchange = form.watch('stockExchange');

  // Hide entirely when feature flag is off or entity is sole proprietorship
  if (
    !enablePubliclyTradedCompanies ||
    organizationType === 'SOLE_PROPRIETORSHIP'
  ) {
    return null;
  }

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <Alert variant="informative" density="sm" noTitle>
        <InfoIcon className="eb-size-4" />
        <AlertDescription>
          {t('screens.businessSection.steps.publiclyTraded.description')}
        </AlertDescription>
      </Alert>

      <OnboardingFormField
        control={form.control}
        name="isPTCOrSubsidiary"
        type="radio-group"
        options={[
          {
            value: 'yes',
            label: 'Yes',
          },
          {
            value: 'no',
            label: 'No',
          },
        ]}
        required
      />

      {isPTCOrSubsidiary === 'yes' && (
        <div className="eb-space-y-6 eb-border-l-2 eb-border-l-muted eb-pl-4">
          <OnboardingFormField
            control={form.control}
            name="isSubsidiary"
            type="radio-group"
            options={[
              {
                value: 'no',
                label: t('fields.isSubsidiary.options.no'),
              },
              {
                value: 'yes',
                label: t('fields.isSubsidiary.options.yes'),
              },
            ]}
            required
          />

          <OnboardingFormField
            control={form.control}
            name="tickerSymbol"
            type="text"
            inputProps={{ maxLength: 10 }}
            required
          />

          <OnboardingFormField
            control={form.control}
            name="stockExchange"
            type="combobox"
            options={STOCK_EXCHANGE_OPTIONS.map((code) => ({
              value: code,
              label: t(`fields.stockExchange.options.${code}`),
            }))}
            required
          />

          {stockExchange === 'Other' && (
            <OnboardingFormField
              control={form.control}
              name="stockExchangeName"
              type="text"
              inputProps={{ maxLength: 100 }}
              required
            />
          )}
        </div>
      )}
    </div>
  );
};

PubliclyTradedForm.schema = usePubliclyTradedFormSchema;
PubliclyTradedForm.refineSchemaFn = refinePubliclyTradedFormSchema;
PubliclyTradedForm.modifyFormValuesBeforeSubmit = (values) => {
  const {
    isPTCOrSubsidiary,
    isSubsidiary,
    tickerSymbol,
    stockExchange,
    stockExchangeName,
    ...rest
  } = values;

  // If not a PTC, strip all PTC fields from the submission
  if (isPTCOrSubsidiary !== 'yes') {
    return rest;
  }

  return {
    ...rest,
    isPTCOrSubsidiary,
    isSubsidiary,
    tickerSymbol,
    stockExchange,
    ...(stockExchange === 'Other' ? { stockExchangeName } : {}),
  };
};
