import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';

import { SectionStepFormComponent } from '../../../types';
import { CompanyIdentificationFormSchema } from './CompanyIdentificationForm.schema';

export const CompanyIdentificationForm: SectionStepFormComponent = () => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding']);
  const form =
    useFormContext<z.input<typeof CompanyIdentificationFormSchema>>();

  // Get mask format based on ID type
  const getMaskFormat = (idType: string) => {
    switch (idType) {
      case 'EIN':
        return '## - #######';
      default:
        return undefined;
    }
  };

  // Get label for value field based on ID type
  const getValueLabel = (
    idType:
      | 'EIN'
      | 'BUSINESS_REGISTRATION_ID'
      | 'BUSINESS_NUMBER'
      | 'BUSINESS_REGISTRATION_NUMBER'
  ) => {
    return t([`idValueLabels.${idType}`, `onboarding:idValueLabels.${idType}`]);
  };

  const getValueDescription = (
    idType:
      | 'EIN'
      | 'BUSINESS_REGISTRATION_ID'
      | 'BUSINESS_NUMBER'
      | 'BUSINESS_REGISTRATION_NUMBER'
  ) => {
    return t([`idValueDescriptions.${idType}`]);
  };

  const selectedIdType = form.watch('organizationIds.0.idType');

  return (
    <div className="eb-space-y-6">
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
      <OnboardingFormField
        control={form.control}
        name="organizationIds.0.idType"
        type="radio-group"
        options={[
          { value: 'EIN', label: getValueLabel('EIN') },
          {
            value: 'BUSINESS_REGISTRATION_ID',
            label: getValueLabel('BUSINESS_REGISTRATION_ID'),
          },
          {
            value: 'BUSINESS_REGISTRATION_NUMBER',
            label: getValueLabel('BUSINESS_REGISTRATION_NUMBER'),
          },
        ]}
      />
      {selectedIdType && (
        <>
          <OnboardingFormField
            control={form.control}
            name="organizationIds.0.issuer"
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
          <OnboardingFormField
            key={`organization-id-value-${selectedIdType}`}
            control={form.control}
            name="organizationIds.0.value"
            type="text"
            label={getValueLabel(selectedIdType)}
            description={getValueDescription(selectedIdType)}
            maskFormat={getMaskFormat(selectedIdType)}
            maskChar="_"
          />
        </>
      )}
    </div>
  );
};

CompanyIdentificationForm.schema = CompanyIdentificationFormSchema;
