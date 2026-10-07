import type { i18n as I18n } from 'i18next';

export function resolveAddressLabelCountry(
  i18n: I18n,
  field: string,
  country?: string
): string | undefined {
  const addressField = field.split('.').at(-1);
  if (
    !country ||
    !['city', 'state', 'postalCode'].includes(addressField ?? '') ||
    i18n.exists(
      `onboarding-overview:addressFields.${addressField}.label.${country}`
    )
  ) {
    return country;
  }
  return 'default';
}

export function getProfileValidationMessage(
  i18n: I18n,
  field: string,
  messageKey: string,
  params?: Record<string, string>
): string {
  const label = i18n.t(
    [
      `onboarding-overview:fields.${field}.label.default`,
      `onboarding-overview:fields.${field}.label`,
    ],
    { defaultValue: field }
  );
  const fieldName = i18n.t(
    [
      `onboarding-overview:fields.${field}.fieldName.default`,
      `onboarding-overview:fields.${field}.fieldName`,
    ],
    { defaultValue: label }
  );

  const validationKeys = [
    `onboarding-overview:fields.${field}.validation.${messageKey}`,
  ];
  if (messageKey === 'required') validationKeys.push('validation:required');

  return i18n.t(validationKeys, {
    fieldName,
    ...params,
    ...(params?.country && {
      country: resolveAddressLabelCountry(i18n, field, params.country),
    }),
  });
}
