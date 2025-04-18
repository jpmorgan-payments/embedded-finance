import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';

import { SectionStepFormComponent } from '../../../types';
import {
  PersonalDetailsFormSchema,
  refinePersonalDetailsFormSchema,
} from './PersonalDetailsForm.schema';

export const PersonalDetailsForm: SectionStepFormComponent = () => {
  // const { t } = useTranslation('onboarding');
  const form = useFormContext<z.input<typeof PersonalDetailsFormSchema>>();

  const jobTitle = form.watch('controllerJobTitle');

  return (
    <div className="eb-space-y-9">
      <fieldset className="eb-space-y-6">
        <legend className="eb-mb-1 eb-text-base eb-font-medium">
          Legal name
        </legend>
        <p className="eb-text-sm eb-italic eb-text-muted-foreground">
          Please provide your full name exactly as recorded with government
          agencies
        </p>
        <OnboardingFormField
          control={form.control}
          name="controllerFirstName"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerMiddleName"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerLastName"
          type="text"
        />
        <OnboardingFormField
          control={form.control}
          name="controllerNameSuffix"
          type="text"
          className="eb-max-w-48"
        />
      </fieldset>

      <div className="eb-space-y-6">
        <OnboardingFormField
          control={form.control}
          name="controllerJobTitle"
          type="combobox"
          options={[
            { value: 'CEO', label: 'CEO' },
            { value: 'CFO', label: 'CFO' },
            { value: 'COO', label: 'COO' },
            { value: 'President', label: 'President' },
            { value: 'Chairman', label: 'Chairman' },
            {
              value: 'Senior Branch Manager',
              label: 'Senior Branch Manager',
            },
            { value: 'Other', label: 'Other' },
          ]}
        />
        {jobTitle === 'Other' && (
          <OnboardingFormField
            control={form.control}
            name="controllerJobTitleDescription"
            type="text"
            required
          />
        )}
      </div>
    </div>
  );
};

PersonalDetailsForm.schema = PersonalDetailsFormSchema;
PersonalDetailsForm.refineSchemaFn = refinePersonalDetailsFormSchema;
PersonalDetailsForm.modifyFormValuesBeforeSubmit = (
  values: Partial<z.output<typeof PersonalDetailsFormSchema>>,
  partyData
) => {
  // If the controller job title is not "Other", remove jobTitleDescription
  if (values.controllerJobTitle !== 'Other') {
    delete values.controllerJobTitleDescription;
  }

  // Set the country of residence as it is required
  const modifiedValues = {
    ...values,
    countryOfResidence:
      partyData?.individualDetails?.countryOfResidence ?? 'US',
  };

  return modifiedValues;
};
