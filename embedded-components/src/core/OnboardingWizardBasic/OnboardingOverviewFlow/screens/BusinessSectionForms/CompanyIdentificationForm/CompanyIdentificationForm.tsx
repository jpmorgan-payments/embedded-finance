import { useEffect } from 'react';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OrganizationIdentityDtoIdType } from '@/api/generated/smbdo.schemas';
import { AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingWizardBasic/utils/COUNTRIES_OF_FORMATION';

import { FormStepComponent } from '../../../flow.types';
import { CompanyIdentificationFormSchema } from './CompanyIdentificationForm.schema';

export const CompanyIdentificationForm: FormStepComponent = () => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding']);
  const form =
    useFormContext<z.input<typeof CompanyIdentificationFormSchema>>();

  // Get mask format based on ID type
  const getMaskFormat = (idType: OrganizationIdentityDtoIdType) => {
    switch (idType) {
      case 'EIN':
        return '## - #######';
      default:
        return undefined;
    }
  };

  // Get label for value field based on ID type
  const getValueLabel = (idType: OrganizationIdentityDtoIdType) => {
    if (!idType) return t('onboarding:idValueLabels.placeholder');
    return t([`idValueLabels.${idType}`, `onboarding:idValueLabels.${idType}`]);
  };

  const getValueDescription = (idType: OrganizationIdentityDtoIdType) => {
    if (!idType) return '';
    return t([`idValueDescriptions.${idType}`]);
  };

  const currentIdType = form.watch('organizationIds.0.idType');

  useEffect(() => {
    if (form.watch('organizationIds.0.issuer') !== 'US') {
      form.setValue('organizationIds.0.issuer', 'US');
    }
  }, [form.watch('organizationIds.0.issuer')]);

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
            If your business is outside of the United States, please contact
            Platform operator.
          </AlertDescription>
        </Alert>
      </div>
      {form.watch('countryOfFormation') === 'US' && (
        <div className="eb-space-y-3">
          <OnboardingFormField
            key={currentIdType}
            control={form.control}
            name="organizationIds.0.value"
            type="text"
            label={getValueLabel(currentIdType)}
            description={getValueDescription(currentIdType)}
            maskFormat={getMaskFormat(currentIdType)}
            maskChar="_"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" type="button" size="sm" className="">
                Use a different ID type
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="eb-component">
              {(
                [
                  'EIN',
                  'BUSINESS_REGISTRATION_ID',
                  'BUSINESS_REGISTRATION_NUMBER',
                ] as OrganizationIdentityDtoIdType[]
              ).map((idType) => (
                <DropdownMenuItem
                  key={idType}
                  disabled={form.watch('organizationIds.0.idType') === idType}
                  onClick={() => {
                    form.setValue('organizationIds.0.idType', idType);
                    form.setValue('organizationIds.0.value', '');
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

CompanyIdentificationForm.schema = CompanyIdentificationFormSchema;
