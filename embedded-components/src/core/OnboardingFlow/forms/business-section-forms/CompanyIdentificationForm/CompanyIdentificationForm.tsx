import { InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  IndividualIdentityIdType,
  OrganizationIdentityDtoIdType,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription } from '@/components/ui/alert';
import { Alert } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import {
  CompanyIdentificationFormSchema,
  refineCompanyIdentificationFormSchema,
} from './CompanyIdentificationForm.schema';

export const CompanyIdentificationForm: FormStepComponent = () => {
  const { t } = useTranslation(['onboarding-overview']);

  const form =
    useFormContext<z.input<typeof CompanyIdentificationFormSchema>>();

  // Get mask format based on ID type
  const getMaskFormat = (
    idType: OrganizationIdentityDtoIdType | IndividualIdentityIdType
  ) => {
    switch (idType) {
      case 'EIN':
        return '## - #######';
      case 'SSN':
        return '### - ## - ####';
      case 'ITIN':
        return '### - ## - ####';
      default:
        return undefined;
    }
  };

  // Get label for value field based on ID type
  const getValueLabel = (
    idType: OrganizationIdentityDtoIdType | IndividualIdentityIdType
  ) => {
    if (!idType) return t('idValueLabels.placeholder');
    return t(`idValueLabels.${idType}`);
  };

  const getValueDescription = (
    idType: OrganizationIdentityDtoIdType | IndividualIdentityIdType
  ) => {
    if (!idType) return '';
    return t(`idValueDescriptions.${idType}`);
  };

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="organizationName"
        type="text"
      />
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
              },
            ]}
          />

          {form.watch('solePropHasEin') === 'yes' && (
            <OnboardingFormField
              control={form.control}
              name="organizationIdEin"
              type="text"
              label={getValueLabel('EIN')}
              description={getValueDescription('EIN')}
              maskFormat={getMaskFormat('EIN')}
              maskChar="_"
              required
            />
          )}
        </div>
      )}
    </div>
  );
};

CompanyIdentificationForm.schema = CompanyIdentificationFormSchema;
CompanyIdentificationForm.refineSchemaFn =
  refineCompanyIdentificationFormSchema;
