import { useEffect } from 'react';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';
import { useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  IndividualIdentityIdType,
  OrganizationIdentityDtoIdType,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { COUNTRIES_OF_FORMATION } from '@/core/OnboardingFlow/consts';
import { useFlowContext } from '@/core/OnboardingFlow/contexts';
import { FormStepComponent } from '@/core/OnboardingFlow/types/flow.types';

import {
  CompanyIdentificationFormSchema,
  refineCompanyIdentificationFormSchema,
} from './CompanyIdentificationForm.schema';

export const CompanyIdentificationForm: FormStepComponent = () => {
  const { t } = useTranslation(['onboarding-overview']);

  const { isSoleProp, controllerParty, orgParty } = useFlowContext();

  const form =
    useFormContext<z.input<typeof CompanyIdentificationFormSchema>>();

  const controllerHasSsn =
    controllerParty?.individualDetails?.individualIds?.some(
      (id) => id.idType === 'SSN'
    );
  const controllerHasItin =
    controllerParty?.individualDetails?.individualIds?.some(
      (id) => id.idType === 'ITIN'
    );

  const solePropForm = useForm({
    defaultValues: {
      ssnOrEin: orgParty?.organizationDetails?.organizationIds?.some(
        (id) => id.idType === 'EIN'
      )
        ? 'EIN'
        : 'SSN',
      ssnAsSolePropId:
        controllerHasSsn || controllerHasItin
          ? controllerParty?.individualDetails?.individualIds?.find(
              (id) => id.idType === 'SSN' || id.idType === 'ITIN'
            )?.value
          : '',
    },
  });

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

  const currentIdType = form.watch('organizationIds.0.idType');

  useEffect(() => {
    if (
      (isSoleProp && solePropForm.watch('ssnOrEin') === 'EIN') ||
      (!isSoleProp && form.watch('organizationIds.0.issuer') !== 'US')
    ) {
      form.setValue('organizationIds.0.idType', 'EIN');
      form.setValue('organizationIds.0.issuer', 'US');
    } else if (isSoleProp && solePropForm.watch('ssnOrEin') === 'SSN') {
      form.setValue('organizationIds', []);
    }
  }, [
    isSoleProp,
    solePropForm.watch('ssnOrEin'),
    form.watch('organizationIds.0.issuer'),
  ]);

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

      {isSoleProp && form.watch('countryOfFormation') === 'US' && (
        <div className="eb-space-y-6">
          <OnboardingFormField
            disableFieldRuleMapping
            control={form.control}
            name="solePropPersonalIdOrEin"
            type="radio-group"
            required
            options={[
              {
                value: 'PERSONAL',
                label: `${getValueLabel('SSN')} / ${getValueLabel('ITIN')}`,
              },
              {
                value: 'EIN',
                label: getValueLabel('EIN'),
              },
            ]}
          />

          {form.watch('solePropPersonalIdOrEin') === 'PERSONAL' && (
            <OnboardingFormField
              disableFieldRuleMapping
              control={solePropForm.control}
              name="ssnAsSolePropId"
              type="text"
              label={
                controllerHasItin
                  ? getValueLabel('ITIN')
                  : controllerHasSsn
                    ? getValueLabel('SSN')
                    : `${getValueLabel('SSN')} / ${getValueLabel('ITIN')}`
              }
              maskFormat={getMaskFormat('SSN')}
              maskChar="_"
              disabled
            />
          )}

          {form.watch('solePropPersonalIdOrEin') === 'EIN' && (
            <OnboardingFormField
              disableFieldRuleMapping
              control={form.control}
              name="solePropOrganizationId"
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

      {!isSoleProp && form.watch('countryOfFormation') === 'US' && (
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
                {t('screens.companyIdentification.useDifferentIdType')}
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
CompanyIdentificationForm.refineSchemaFn =
  refineCompanyIdentificationFormSchema;
