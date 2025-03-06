import { useTranslation } from 'react-i18next';

import { individualFields, organizationFields } from './partyFields';

export const usePartyFields = () => {
  const { t } = useTranslation('onboarding');

  const getOrganizationFields = () =>
    organizationFields.map((field) => ({
      ...field,
      label: t(field.label),
      transformFunc: field.transformFunc
        ? (value: any) => field.transformFunc(value, t)
        : undefined,
    }));

  const getIndividualFields = () =>
    individualFields.map((field) => ({
      ...field,
      label: t(field.label),
      transformFunc: field.transformFunc
        ? (value: any) => field.transformFunc(value, t)
        : undefined,
    }));

  return {
    organizationFields: getOrganizationFields(),
    individualFields: getIndividualFields(),
  };
};
