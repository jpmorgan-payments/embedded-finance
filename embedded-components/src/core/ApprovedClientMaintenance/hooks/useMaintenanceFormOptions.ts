import { useTranslationWithTokens } from '@/i18n';

import type { ProfileIdentityFieldContent } from '@/core/ClientProfile/fields/ProfileIdentityFields';
import type { ProfileSelectOption } from '@/core/ClientProfile/forms/ProfileSelectField';
import {
  COUNTRIES_OF_FORMATION,
  getSubdivisionsForCountry,
} from '@/core/OnboardingFlow/consts';

const MAINTENANCE_ORGANIZATION_TYPES = [
  'LIMITED_LIABILITY_PARTNERSHIP',
  'LIMITED_LIABILITY_COMPANY',
  'SOLE_PROPRIETORSHIP',
  'GENERAL_PARTNERSHIP',
  'C_CORPORATION',
  'S_CORPORATION',
] as const;

export function useMaintenanceFormOptions() {
  const { tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
    'onboarding-overview',
  ]);

  const countryOptions: ProfileSelectOption[] = COUNTRIES_OF_FORMATION.map(
    (country) => {
      const countryName = tString([
        `common:countries.${country}`,
      ] as unknown as TemplateStringsArray);
      return {
        value: country,
        label: `[${country}] ${countryName}`,
        searchValue: `${country} ${countryName}`,
      };
    }
  );
  const organizationTypeOptions: ProfileSelectOption[] =
    MAINTENANCE_ORGANIZATION_TYPES.map((organizationType) => ({
      value: organizationType,
      label: tString(
        [
          `onboarding-overview:organizationTypes.${organizationType}`,
        ] as unknown as TemplateStringsArray,
        { defaultValue: organizationType }
      ),
    }));
  const identityContent: ProfileIdentityFieldContent = {
    idType: tString('addParty.idType'),
    idTypePlaceholder: tString('addParty.idTypePlaceholder'),
    idValue: {
      SSN: tString('onboarding-overview:idValueLabels.SSN'),
      ITIN: tString('onboarding-overview:idValueLabels.ITIN'),
      PASSPORT: tString('onboarding-overview:idValueLabels.PASSPORT'),
      DRIVERS_LICENSE: tString(
        'onboarding-overview:idValueLabels.DRIVERS_LICENSE'
      ),
      OTHER_GOVERNMENT_ID: tString(
        'onboarding-overview:idValueLabels.OTHER_GOVERNMENT_ID'
      ),
    },
    idValueDescription: {
      SSN: tString('onboarding-overview:idValueDescriptions.SSN'),
      ITIN: tString('onboarding-overview:idValueDescriptions.ITIN'),
      PASSPORT: tString('onboarding-overview:idValueDescriptions.PASSPORT'),
      DRIVERS_LICENSE: tString(
        'onboarding-overview:idValueDescriptions.DRIVERS_LICENSE'
      ),
      OTHER_GOVERNMENT_ID: tString(
        'onboarding-overview:idValueDescriptions.OTHER_GOVERNMENT_ID'
      ),
    },
    optionalLabel: tString('common:optional'),
  };

  return {
    countryOptions,
    organizationTypeOptions,
    identityContent,
    getSubdivisionOptions: (country?: string) =>
      getSubdivisionsForCountry(country)?.map((option) => ({
        value: option.value,
        label: option.label,
        searchValue: `${option.value} ${option.label}`,
      })),
  };
}
