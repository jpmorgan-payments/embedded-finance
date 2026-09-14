export const US_INDIVIDUAL_ID_TYPES = ['SSN', 'ITIN'] as const;
export const NON_US_INDIVIDUAL_ID_TYPES = [
  'PASSPORT',
  'DRIVERS_LICENSE',
  'OTHER_GOVERNMENT_ID',
] as const;

export type ProfileIndividualIdType =
  | (typeof US_INDIVIDUAL_ID_TYPES)[number]
  | (typeof NON_US_INDIVIDUAL_ID_TYPES)[number];

export const getIndividualIdTypesForCountry = (country?: string) =>
  country === 'US' ? US_INDIVIDUAL_ID_TYPES : NON_US_INDIVIDUAL_ID_TYPES;

export const getDefaultIndividualIdType = (country?: string) =>
  country === 'US' ? 'SSN' : '';

export const isTaxpayerIdType = (idType?: string) =>
  idType === 'SSN' || idType === 'ITIN';
