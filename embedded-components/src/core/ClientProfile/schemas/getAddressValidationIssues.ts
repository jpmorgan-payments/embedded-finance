import { getSubdivisionsForCountry } from '@/core/OnboardingFlow/consts';

export type ProfileAddressValidationField =
  | 'city'
  | 'state'
  | 'postalCode'
  | 'primaryAddressLine';

export type ProfileAddressValidationIssue = {
  field: ProfileAddressValidationField;
  messageKey: string;
  params?: Record<string, string>;
};

type ProfileAddressValidationValues = {
  country: string;
  primaryAddressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

const POSTAL_CODE_FORMATS: Record<
  string,
  { regex: RegExp; messageKey: string }
> = {
  US: { regex: /^\d{5}(-\d{4})?$/, messageKey: 'invalidUS' },
  CA: {
    regex: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    messageKey: 'invalidCA',
  },
  GB: {
    regex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/i,
    messageKey: 'invalidGB',
  },
  BR: { regex: /^\d{5}-?\d{3}$/, messageKey: 'invalidBR' },
  JP: { regex: /^\d{3}-?\d{4}$/, messageKey: 'invalidJP' },
  PL: { regex: /^\d{2}-?\d{3}$/, messageKey: 'invalidPL' },
  AU: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  NZ: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  ZA: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  CH: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  AT: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  AR: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  DK: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  HU: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  NO: { regex: /^\d{4}$/, messageKey: 'invalidFourDigit' },
  DE: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  FR: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  IT: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  ES: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  MX: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  KR: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  FI: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  PE: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  SA: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  TR: { regex: /^\d{5}$/, messageKey: 'invalidFiveDigit' },
  CZ: { regex: /^\d{3}\s?\d{2}$/, messageKey: 'invalidFiveDigit' },
  SE: { regex: /^\d{3}\s?\d{2}$/, messageKey: 'invalidFiveDigit' },
  IN: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  CN: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  CO: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  RU: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  SG: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  EC: { regex: /^\d{6}$/, messageKey: 'invalidSixDigit' },
  CL: { regex: /^\d{7}$/, messageKey: 'invalidSevenDigit' },
  IL: { regex: /^\d{7}$/, messageKey: 'invalidSevenDigit' },
  IE: {
    regex: /^[A-Za-z]\d[\dWw]\s?[A-Za-z\d]{4}$/,
    messageKey: 'invalidIE',
  },
  NL: { regex: /^\d{4}\s?[A-Za-z]{2}$/, messageKey: 'invalidNL' },
  PT: { regex: /^\d{4}-?\d{3}$/, messageKey: 'invalidPT' },
};

const PO_BOX_REGEX = /\b(?:p\.?\s*o\.?\s*box|post\s*office\s*box|pmb)\b/i;

export function getAddressValidationIssues(
  values: ProfileAddressValidationValues
): ProfileAddressValidationIssue[] {
  const issues: ProfileAddressValidationIssue[] = [];
  const params = { country: values.country };

  if (!values.city)
    issues.push({ field: 'city', messageKey: 'required', params });
  if (!values.state)
    issues.push({ field: 'state', messageKey: 'required', params });
  if (!values.postalCode) {
    issues.push({ field: 'postalCode', messageKey: 'required', params });
  }

  const subdivisions = getSubdivisionsForCountry(values.country);
  if (
    subdivisions &&
    values.state &&
    !subdivisions.some((subdivision) => subdivision.value === values.state)
  ) {
    issues.push({ field: 'state', messageKey: 'invalid', params });
  }

  const postalCodeFormat = POSTAL_CODE_FORMATS[values.country];
  if (
    postalCodeFormat &&
    values.postalCode &&
    !postalCodeFormat.regex.test(values.postalCode)
  ) {
    issues.push({
      field: 'postalCode',
      messageKey: postalCodeFormat.messageKey,
      params,
    });
  }

  if (
    values.country === 'US' &&
    values.primaryAddressLine &&
    PO_BOX_REGEX.test(values.primaryAddressLine)
  ) {
    issues.push({ field: 'primaryAddressLine', messageKey: 'poBox' });
  }

  return issues;
}
