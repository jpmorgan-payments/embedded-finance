import type { i18n as I18n } from 'i18next';

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

  return i18n.t(validationKeys, { fieldName, ...params });
}
