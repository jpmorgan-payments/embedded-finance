/**
 * Party field definitions for displaying party data in ClientDetails.
 * Business-facing labels and formatted values only (no internal IDs).
 */

import { formatJobTitleDisplay } from './formatClientFacing';

export interface PartyFieldConfig {
  /** Label ID - used to derive label from t(`partyLabels.${labelId}`) */
  labelId: string;
  path: string;
  transform?: (value: unknown) => string | string[] | undefined;
}

const formatAddresses = (addresses: unknown): string[] | undefined => {
  if (!Array.isArray(addresses)) return undefined;
  return addresses.map(
    (addr: {
      addressLines?: string[];
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }) => {
      const lines = addr.addressLines?.join(' ') ?? '';
      const parts = [
        lines,
        addr.city,
        addr.state,
        addr.postalCode,
        addr.country,
      ].filter(Boolean);
      return parts.join(', ');
    }
  );
};

const formatPhone = (value: unknown): string | undefined => {
  const phone = value as
    | { phoneType?: string; countryCode?: string; phoneNumber?: string }
    | undefined;
  if (!phone) return undefined;
  return [phone.countryCode, phone.phoneNumber].filter(Boolean).join(' ');
};

const formatIds = (value: unknown): string[] | undefined => {
  const ids = value as
    | Array<{ idType?: string; value?: string; issuer?: string }>
    | undefined;
  if (!Array.isArray(ids) || !ids.length) return undefined;
  return ids.map(
    (id) =>
      `${id.idType ?? ''} (${id.issuer ?? ''}): ****${String(id.value ?? '').slice(-4)}`
  );
};

/** Organization fields: identity → business → formation → contact → regulatory */
export const organizationFieldDefinitions: PartyFieldConfig[] = [
  { labelId: 'organizationName', path: 'organizationDetails.organizationName' },
  { labelId: 'organizationType', path: 'organizationDetails.organizationType' },
  { labelId: 'dbaName', path: 'organizationDetails.dbaName' },
  {
    labelId: 'description',
    path: 'organizationDetails.organizationDescription',
  },
  { labelId: 'industryCategory', path: 'organizationDetails.industryCategory' },
  { labelId: 'industryType', path: 'organizationDetails.industryType' },
  {
    labelId: 'countryOfFormation',
    path: 'organizationDetails.countryOfFormation',
  },
  { labelId: 'yearOfFormation', path: 'organizationDetails.yearOfFormation' },
  { labelId: 'jurisdiction', path: 'organizationDetails.jurisdiction' },
  { labelId: 'email', path: 'email' },
  {
    labelId: 'phone',
    path: 'organizationDetails.phone',
    transform: formatPhone,
  },
  { labelId: 'website', path: 'organizationDetails.website' },
  {
    labelId: 'addresses',
    path: 'organizationDetails.addresses',
    transform: formatAddresses,
  },
  {
    labelId: 'organizationIds',
    path: 'organizationDetails.organizationIds',
    transform: formatIds,
  },
];

/** Individual fields: job → name → personal → ownership → contact → IDs */
export const individualFieldDefinitions: PartyFieldConfig[] = [
  {
    labelId: 'jobTitle',
    path: 'individualDetails',
    transform: (v) =>
      formatJobTitleDisplay(
        v as { jobTitle?: string; jobTitleDescription?: string }
      ),
  },
  { labelId: 'firstName', path: 'individualDetails.firstName' },
  { labelId: 'middleName', path: 'individualDetails.middleName' },
  { labelId: 'lastName', path: 'individualDetails.lastName' },
  { labelId: 'nameSuffix', path: 'individualDetails.nameSuffix' },
  { labelId: 'birthDate', path: 'individualDetails.birthDate' },
  {
    labelId: 'countryOfResidence',
    path: 'individualDetails.countryOfResidence',
  },
  {
    labelId: 'countryOfCitizenship',
    path: 'individualDetails.countryOfCitizenship',
  },
  { labelId: 'natureOfOwnership', path: 'individualDetails.natureOfOwnership' },
  {
    labelId: 'soleOwner',
    path: 'individualDetails.soleOwner',
  },
  { labelId: 'email', path: 'email' },
  { labelId: 'phone', path: 'individualDetails.phone', transform: formatPhone },
  {
    labelId: 'addresses',
    path: 'individualDetails.addresses',
    transform: formatAddresses,
  },
  {
    labelId: 'individualIds',
    path: 'individualDetails.individualIds',
    transform: formatIds,
  },
];
