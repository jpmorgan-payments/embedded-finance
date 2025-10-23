import { useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

import { useIndividualIdentityFormSchema } from './IndividualIdentityForm.schema';

export const IndividualIdentityForm: FormStepComponent = () => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding-old']);
  const form =
    useFormContext<
      z.input<ReturnType<typeof useIndividualIdentityFormSchema>>
    >();
  const { getFieldRule } = useFormUtils();

  const getValueLabel = (idType: IndividualIdentityIdType) => {
    if (!idType) return t(['onboarding-old:idValueLabels.placeholder']);
    return t([
      `idValueLabels.${idType}`,
      `onboarding-old:idValueLabels.${idType}`,
    ]);
  };

  const getValueDescription = (idType: IndividualIdentityIdType) => {
    if (!idType) return '';
    return t([`idValueDescriptions.${idType}`]);
  };

  const currentIdType = form.watch('controllerIds.0.idType');

  useEffect(() => {
    if (form.watch('controllerIds.0.issuer') !== 'US') {
      form.setValue('controllerIds.0.issuer', 'US');
    }
  }, [form.watch('controllerIds.0.issuer')]);

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
      />
      <OnboardingFormField
        control={form.control}
        name="solePropSsn"
        type="text"
        maskFormat="### - ## - ####"
        maskChar="_"
        obfuscateWhenUnfocused={!!form.watch('solePropSsn')?.length}
      />
      {form.watch('countryOfResidence') === 'US' &&
        getFieldRule('controllerIds.0.value').fieldRule.display ===
          'visible' && (
          <div className="eb-space-y-3">
            <OnboardingFormField
              key={currentIdType}
              control={form.control}
              name="controllerIds.0.value"
              type="text"
              maskFormat="### - ## - ####"
              maskChar="_"
              label={getValueLabel(currentIdType)}
              description={getValueDescription(currentIdType)}
              obfuscateWhenUnfocused={
                !!form.watch('controllerIds.0.value')?.length
              }
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" type="button" size="sm" className="">
                  Use a different ID type
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="eb-component">
                {(['SSN', 'ITIN'] as IndividualIdentityIdType[]).map(
                  (idType) => (
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
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
    </div>
  );
};

IndividualIdentityForm.schema = useIndividualIdentityFormSchema;
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
