import { useTranslationWithTokens } from '@/i18n';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  ControllerIdFields,
  OnboardingFormField,
} from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { useFlowContext } from '@/core/OnboardingFlow/contexts/FlowContext/FlowContext';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { useFormUtils } from '@/core/OnboardingFlow/utils/formUtils';

import {
  refineIndividualIdentityFormSchema,
  useIndividualIdentityFormSchema,
} from './IndividualIdentityForm.schema';

export const IndividualIdentityForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens(['onboarding-overview']);
  const form =
    useFormContext<
      z.input<ReturnType<typeof useIndividualIdentityFormSchema>>
    >();
  const { getFieldRule } = useFormUtils();
  const { isPTCWithUSExchange } = useFlowContext();

  const issuerCountry = form.watch('controllerIds.0.issuer');
  const isUS = issuerCountry === 'US';

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="birthDate"
        labelClassName="eb-mb-1 eb-font-header eb-text-lg eb-font-medium"
      />
      <OnboardingFormField
        control={form.control}
        name="controllerIds.0.issuer"
        type="combobox"
        options={COUNTRIES_OF_FORMATION.map((code) => ({
          value: code,
          searchValue: `[${code}] ${tString([`common:countries.${code}`] as unknown as TemplateStringsArray)}`,
          label: (
            <span>
              <span className="eb-font-medium">[{code}]</span>{' '}
              {t([
                `common:countries.${code}`,
              ] as unknown as TemplateStringsArray)}
            </span>
          ),
        }))}
        readonly
      />
      {!isPTCWithUSExchange && isUS && (
        <OnboardingFormField control={form.control} name="solePropSsn" />
      )}
      {!isPTCWithUSExchange &&
        getFieldRule('controllerIds.0.value').fieldRule.display ===
          'visible' && <ControllerIdFields />}
    </div>
  );
};

IndividualIdentityForm.schema = useIndividualIdentityFormSchema;
IndividualIdentityForm.refineSchemaFn = refineIndividualIdentityFormSchema;
IndividualIdentityForm.modifyFormValuesBeforeSubmit = (values, partyData) => {
  const countryFallback =
    partyData?.individualDetails?.countryOfResidence ?? 'US';
  return {
    ...values,
    controllerIds: values.controllerIds?.map((id: Record<string, unknown>) => ({
      ...id,
      // SSN and ITIN are always US-issued; other ID types keep the form's
      // issuer value (which was seeded from the resolved country in
      // StepperFormStep).  Fall back to partyData only as a safety net.
      issuer: ['SSN', 'ITIN'].includes(id.idType as string)
        ? 'US'
        : (id.issuer as string) || countryFallback,
    })),
  };
};
// TODO: add when SSN is valid as an organization ID
// IndividualIdentityForm.updateAnotherPartyOnSubmit = {
//   partyFilters: {
//     partyType: 'ORGANIZATION',
//     roles: ['CLIENT'],
//   },
//   getValues: (values) => ({
//     organizationIds: [
//       {
//         idType: 'SSN',
//         value: values.solePropSsn,
//         issuer: 'US',
//       },
//     ],
//   }),
// };
