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
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';

import { SectionStepFormComponent } from '../../../types';
import { IndividualIdentityFormSchema } from './IndividualIdentityForm.schema';

export const IndividualIdentityForm: SectionStepFormComponent = () => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding']);
  const form = useFormContext<z.input<typeof IndividualIdentityFormSchema>>();

  const getValueLabel = (idType: IndividualIdentityIdType) => {
    if (!idType) return t(['onboarding:idValueLabels.placeholder']);
    return t([`idValueLabels.${idType}`, `onboarding:idValueLabels.${idType}`]);
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

  return (
    <div className="eb-space-y-6">
      <OnboardingFormField
        control={form.control}
        name="birthDate"
        type="importantDate"
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
      {form.watch('countryOfResidence') === 'US' && (
        <div className="eb-space-y-2">
          <OnboardingFormField
            control={form.control}
            name="controllerIds.0.value"
            type="text"
            maskFormat="### - ## - ####"
            maskChar="_"
            label={getValueLabel(currentIdType)}
            description={getValueDescription(currentIdType)}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" type="button" size="sm" className="">
                Use a different ID type
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="eb-component">
              {(['SSN', 'ITIN'] as IndividualIdentityIdType[]).map((idType) => (
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
        </div>
      )}
    </div>
  );
};

IndividualIdentityForm.schema = IndividualIdentityFormSchema;
