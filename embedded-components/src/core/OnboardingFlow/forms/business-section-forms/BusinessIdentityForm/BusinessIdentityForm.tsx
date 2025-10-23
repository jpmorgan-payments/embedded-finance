import { useEffect } from 'react';
import { InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { AlertDescription } from '@/components/ui/alert';
import { Alert } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { getOrganizationParty } from '@/core/OnboardingFlow/utils/dataUtils';
import { convertPartyResponseToFormValues } from '@/core/OnboardingFlow/utils/formUtils';

import {
  refineBusinessIdentityFormSchema,
  useBusinessIdentityFormSchema,
} from './BusinessIdentityForm.schema';

export const BusinessIdentityForm: FormStepComponent = () => {
  const { t } = useTranslation(['onboarding-overview']);

  const { clientData } = useOnboardingContext();

  const orgParty = getOrganizationParty(clientData);
  const { organizationIdEin } = convertPartyResponseToFormValues(
    orgParty ?? {}
  );

  const form =
    useFormContext<z.input<ReturnType<typeof useBusinessIdentityFormSchema>>>();

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'dbaNameNotAvailable' && value.dbaNameNotAvailable) {
        form.clearErrors('dbaName');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'websiteNotAvailable' && value.websiteNotAvailable) {
        form.clearErrors('website');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationName"
        type="text"
      />
      <div className="eb-space-y-3">
        <OnboardingFormField
          control={form.control}
          name="dbaName"
          type="text"
          valueOverride={
            form.watch('dbaNameNotAvailable')
              ? form.watch('organizationName') === 'PLACEHOLDER_ORG_NAME'
                ? 'N/A'
                : form.watch('organizationName')
              : undefined
          }
          disabled={form.watch('dbaNameNotAvailable')}
          required
        />
        <OnboardingFormField
          control={form.control}
          name="dbaNameNotAvailable"
          type="checkbox-basic"
          label={t('fields.dbaNameNotAvailable.label')}
          noOptionalLabel
        />
      </div>
      <OnboardingFormField
        control={form.control}
        name="yearOfFormation"
        type="text"
        inputProps={{ maxLength: 4 }}
      />
      <div className="eb-space-y-3">
        <OnboardingFormField
          control={form.control}
          name="countryOfFormation"
          type="combobox"
          options={COUNTRIES_OF_FORMATION.map((code) => ({
            value: code,
            label: (
              <span>
                <span className="eb-font-medium">[{code}]</span>{' '}
                {t([
                  `common:countries.${code}`,
                ] as unknown as TemplateStringsArray)}
              </span>
            ),
          }))}
        />
        <Alert variant="informative" density="sm" noTitle>
          <InfoIcon className="eb-size-4" />
          <AlertDescription>
            {t('screens.companyIdentification.contactPlatformOperator')}
          </AlertDescription>
        </Alert>
      </div>

      {form.watch('countryOfFormation') === 'US' && (
        <div className="eb-space-y-6">
          <OnboardingFormField
            control={form.control}
            name="solePropHasEin"
            type="radio-group"
            options={[
              {
                value: 'yes',
                label: t('fields.solePropHasEin.options.yes'),
              },
              {
                value: 'no',
                label: t('fields.solePropHasEin.options.no'),
                disabled: !!organizationIdEin,
              },
            ]}
            required
          />

          {(form.watch('solePropHasEin') === 'yes' ||
            form.watch('solePropHasEin') === undefined) && (
            <OnboardingFormField
              control={form.control}
              name="organizationIdEin"
              type="text"
              maskFormat="## - #######"
              maskChar="_"
              required
              obfuscateWhenUnfocused
            />
          )}
          <div className="eb-space-y-3">
            <OnboardingFormField
              control={form.control}
              name="website"
              type="text"
              valueOverride={
                form.watch('websiteNotAvailable') ? 'N/A' : undefined
              }
              disabled={form.watch('websiteNotAvailable')}
              required
            />
            <OnboardingFormField
              control={form.control}
              name="websiteNotAvailable"
              type="checkbox-basic"
              label={t('fields.websiteNotAvailable.label')}
              noOptionalLabel
            />
          </div>
        </div>
      )}
    </div>
  );
};

BusinessIdentityForm.schema = useBusinessIdentityFormSchema;
BusinessIdentityForm.refineSchemaFn = refineBusinessIdentityFormSchema;
BusinessIdentityForm.modifyFormValuesBeforeSubmit = (values) => {
  const { solePropHasEin, organizationIdEin, ...rest } = values;

  return {
    ...rest,
    ...(solePropHasEin !== 'no' ? { organizationIdEin } : {}),
  };
};
