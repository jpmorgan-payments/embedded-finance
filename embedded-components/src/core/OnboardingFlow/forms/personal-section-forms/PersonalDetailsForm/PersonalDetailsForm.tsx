import { useFormContext } from 'react-hook-form';
// import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import {
  refinePersonalDetailsFormSchema,
  usePersonalDetailsFormSchema,
} from './PersonalDetailsForm.schema';

export const PersonalDetailsForm: FormStepComponent = () => {
  // const { t } = useTranslation('onboarding');
  const schema = usePersonalDetailsFormSchema();
  const form = useFormContext<z.input<typeof schema>>();

  const jobTitle = form.watch('controllerJobTitle');

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <fieldset className="eb-grid eb-gap-y-3">
        <legend className="eb-mb-1.5 eb-text-lg eb-font-medium">
          Legal name
        </legend>
        <p className="eb-text-sm">
          Your full name as recorded with government agencies
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

PersonalDetailsForm.schema = usePersonalDetailsFormSchema;
PersonalDetailsForm.refineSchemaFn = refinePersonalDetailsFormSchema;
PersonalDetailsForm.modifyFormValuesBeforeSubmit = (
  values: Partial<z.output<ReturnType<typeof usePersonalDetailsFormSchema>>>
  // partyData
) => {
  const { controllerJobTitleDescription, ...rest } = values;

  return {
    ...rest,
    // If the controller job title is not "Other", remove jobTitleDescription
    ...(values.controllerJobTitle === 'Other'
      ? { controllerJobTitleDescription }
      : { controllerJobTitleDescription: undefined }),
    // Set the country of residence as it is required
    countryOfResidence: 'US',
    // To be used when more countries are supported
    // partyData?.individualDetails?.countryOfResidence ?? 'US',
  };
};
PersonalDetailsForm.updateAnotherPartyOnSubmit = {
  partyFilters: {
    partyType: 'ORGANIZATION',
    roles: ['CLIENT'],
  },
  getValues: (values) => ({
    organizationName: [
      values.controllerFirstName,
      values.controllerMiddleName,
      values.controllerLastName,
      values.controllerNameSuffix,
    ]
      .filter(Boolean)
      .join(' '),
  }),
};
