import { useEffect } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ChevronDownIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { IndividualIdentityIdType } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';
import { useFormUtils } from '@/core/OnboardingFlow/utils/formUtils';

import {
  refineIndividualIdentityFormSchema,
  useIndividualIdentityFormSchema,
} from './IndividualIdentityForm.schema';

/** Extends the API type with an empty string to represent "no selection yet". */
type IdTypeSelection = IndividualIdentityIdType | '';

export const IndividualIdentityForm: FormStepComponent = () => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'onboarding-old',
  ]);
  const form =
    useFormContext<
      z.input<ReturnType<typeof useIndividualIdentityFormSchema>>
    >();
  const { getFieldRule } = useFormUtils();

  const issuerCountry = form.watch('controllerIds.0.issuer');
  const isUS = issuerCountry === 'US';

  const US_ID_TYPES: readonly IdTypeSelection[] = ['SSN', 'ITIN'] as const;
  const NON_US_ID_TYPES: readonly IdTypeSelection[] = [
    'PASSPORT',
    'DRIVERS_LICENSE',
    'OTHER_GOVERNMENT_ID',
  ] as const;
  const availableIdTypes = isUS ? US_ID_TYPES : NON_US_ID_TYPES;

  const getValueLabel = (idType: IdTypeSelection) => {
    if (!idType) return t(['onboarding-old:idValueLabels.placeholder']);
    return t([
      `idValueLabels.${idType}`,
      `onboarding-old:idValueLabels.${idType}`,
    ]);
  };

  const getValueDescription = (idType: IdTypeSelection) => {
    if (!idType) return '';
    return t([`idValueDescriptions.${idType}`]);
  };

  const currentIdType: IdTypeSelection = form.watch('controllerIds.0.idType');
  const isSsnOrItin = currentIdType === 'SSN' || currentIdType === 'ITIN';

  // Reset ID type when switching between US and non-US.
  // Non-US starts with an empty selection so the user must explicitly
  // choose from PASSPORT, DRIVERS_LICENSE, or OTHER_GOVERNMENT_ID.
  // Only resets if the current type isn't available in the target list,
  // so manually-selected shared types are preserved.
  useEffect(() => {
    const currentType: IdTypeSelection = form.getValues(
      'controllerIds.0.idType'
    );
    if (isUS && !US_ID_TYPES.includes(currentType)) {
      form.setValue('controllerIds.0.idType', 'SSN');
      form.setValue('controllerIds.0.value', '');
    } else if (
      !isUS &&
      currentType !== '' &&
      !NON_US_ID_TYPES.includes(currentType)
    ) {
      form.setValue('controllerIds.0.idType', '');
      form.setValue('controllerIds.0.value', '');
    }
  }, [isUS]);

  useEffect(() => {
    form.clearErrors('controllerIds.0.value');
  }, [currentIdType]);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="birthDate"
        type="importantDate"
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
      {isUS && (
        <OnboardingFormField
          control={form.control}
          name="solePropSsn"
          type="text"
          maskFormat="### - ## - ####"
          maskChar="_"
          obfuscateWhenUnfocused
        />
      )}
      {getFieldRule('controllerIds.0.value').fieldRule.display ===
        'visible' && (
        <div className="eb-space-y-3">
          {!isUS && (
            <OnboardingFormField
              control={form.control}
              name="controllerIds.0.idType"
              type="select"
              label={t([
                'onboarding-overview:fields.controllerIds.idType.label',
                'onboarding-old:fields.controllerIds.idType.label',
              ])}
              description={t([
                'onboarding-overview:fields.controllerIds.idType.description',
              ])}
              options={NON_US_ID_TYPES.map((idType) => ({
                value: idType,
                label: getValueLabel(idType),
              }))}
              required
              disableFieldRuleMapping
            />
          )}
          {(isUS || currentIdType) && (
            <OnboardingFormField
              key={currentIdType}
              control={form.control}
              name="controllerIds.0.value"
              type="text"
              maskFormat={isSsnOrItin ? '### - ## - ####' : undefined}
              maskChar={isSsnOrItin ? '_' : undefined}
              label={getValueLabel(currentIdType)}
              description={getValueDescription(currentIdType)}
              obfuscateWhenUnfocused={isSsnOrItin}
              inputProps={{
                // Give each ID type a unique DOM name so the browser
                // keeps separate autocomplete histories per type.
                // RHF tracks this field via ref, not the DOM name.
                name: `id-value-${currentIdType?.toLowerCase() || 'none'}`,
              }}
            />
          )}

          {isUS && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" type="button" size="sm" className="">
                  Use a different ID type
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="eb-component">
                {availableIdTypes.map((idType) => (
                  <DropdownMenuItem
                    key={idType}
                    disabled={form.watch('controllerIds.0.idType') === idType}
                    onClick={() => {
                      form.setValue('controllerIds.0.idType', idType);
                      form.setValue('controllerIds.0.value', '');
                    }}
                  >
                    <div className="eb-flex eb-items-center eb-gap-2">
                      {getValueLabel(idType)}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
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
