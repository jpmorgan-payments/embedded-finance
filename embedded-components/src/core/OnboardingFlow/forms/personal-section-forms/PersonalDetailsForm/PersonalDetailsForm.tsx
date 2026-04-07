import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import {
  COUNTRIES_OF_FORMATION,
  JOB_TITLES,
  NATURE_OF_OWNERSHIP_OPTIONS,
} from '@/core/OnboardingFlow/consts';
import { useFlowContext } from '@/core/OnboardingFlow/contexts/FlowContext';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { getOrganizationParty } from '@/core/OnboardingFlow/utils/dataUtils';

import {
  refinePersonalDetailsFormSchema,
  usePersonalDetailsFormSchema,
} from './PersonalDetailsForm.schema';

export const PersonalDetailsForm: FormStepComponent = () => {
  const { t } = useTranslationWithTokens('onboarding-overview');
  const { currentScreenId } = useFlowContext();
  const _schema = usePersonalDetailsFormSchema();
  const form = useFormContext<z.input<typeof _schema>>();

  const jobTitle = form.watch('controllerJobTitle');

  const isOwnerContext = currentScreenId === 'owner-stepper';

  const legalNameHeader = isOwnerContext
    ? t('screens.ownerPersonalDetails.legalNameHeader')
    : t('screens.personalDetails.legalNameHeader');
  const legalNameDescription = isOwnerContext
    ? t('screens.ownerPersonalDetails.legalNameDescription')
    : t('screens.personalDetails.legalNameDescription');

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="countryOfResidence"
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
        required
      />
      <fieldset className="eb-grid eb-gap-y-3">
        <legend className="eb-mb-1.5 eb-text-lg eb-font-medium">
          {legalNameHeader}
        </legend>
        <p className="eb-text-sm">{legalNameDescription}</p>
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
          options={JOB_TITLES.map((title) => ({
            value: title,
            label: t(`jobTitles.${title}`),
          }))}
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
      <OnboardingFormField
        control={form.control}
        name="natureOfOwnership"
        type="select"
        options={NATURE_OF_OWNERSHIP_OPTIONS.map((option) => ({
          value: option,
          label: t(`natureOfOwnership.${option}`),
        }))}
      />
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
  };
};
PersonalDetailsForm.updateAnotherPartyOnSubmit = {
  partyFilters: {
    partyType: 'ORGANIZATION',
    roles: ['CLIENT'],
  },
  getCondition: (clientData) =>
    getOrganizationParty(clientData)?.organizationDetails?.organizationType ===
    'SOLE_PROPRIETORSHIP',
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
