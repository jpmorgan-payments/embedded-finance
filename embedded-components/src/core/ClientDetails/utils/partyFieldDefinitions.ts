/**
 * Party field definitions for displaying party data in ClientDetails.
 * Business-facing labels and formatted values only (no internal IDs).
 */

import { formatJobTitleDisplay } from './formatClientFacing';

export interface PartyFieldConfig {
  label: string;
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
  { label: 'Organization name', path: 'organizationDetails.organizationName' },
  { label: 'Organization type', path: 'organizationDetails.organizationType' },
  { label: 'DBA name', path: 'organizationDetails.dbaName' },
  { label: 'Description', path: 'organizationDetails.organizationDescription' },
  { label: 'Industry category', path: 'organizationDetails.industryCategory' },
  { label: 'Industry type', path: 'organizationDetails.industryType' },
  {
    label: 'Country of formation',
    path: 'organizationDetails.countryOfFormation',
  },
  { label: 'Year of formation', path: 'organizationDetails.yearOfFormation' },
  { label: 'Jurisdiction', path: 'organizationDetails.jurisdiction' },
  { label: 'Email', path: 'email' },
  { label: 'Phone', path: 'organizationDetails.phone', transform: formatPhone },
  { label: 'Website', path: 'organizationDetails.website' },
  {
    label: 'Addresses',
    path: 'organizationDetails.addresses',
    transform: formatAddresses,
  },
  {
    label: 'Organization IDs',
    path: 'organizationDetails.organizationIds',
    transform: formatIds,
  },
];

/** Individual fields: job → name → personal → ownership → contact → IDs */
export const individualFieldDefinitions: PartyFieldConfig[] = [
  {
    label: 'Job title',
    path: 'individualDetails',
    transform: (v) =>
      formatJobTitleDisplay(
        v as { jobTitle?: string; jobTitleDescription?: string }
      ),
  },
  { label: 'First name', path: 'individualDetails.firstName' },
  { label: 'Middle name', path: 'individualDetails.middleName' },
  { label: 'Last name', path: 'individualDetails.lastName' },
  { label: 'Name suffix', path: 'individualDetails.nameSuffix' },
  { label: 'Birth date', path: 'individualDetails.birthDate' },
  {
    label: 'Country of residence',
    path: 'individualDetails.countryOfResidence',
  },
  {
    label: 'Country of citizenship',
    path: 'individualDetails.countryOfCitizenship',
  },
  { label: 'Nature of ownership', path: 'individualDetails.natureOfOwnership' },
  {
    label: 'Sole owner',
    path: 'individualDetails.soleOwner',
    transform: (v) => (v === true ? 'Yes' : v === false ? 'No' : undefined),
  },
  { label: 'Email', path: 'email' },
  { label: 'Phone', path: 'individualDetails.phone', transform: formatPhone },
  {
    label: 'Addresses',
    path: 'individualDetails.addresses',
    transform: formatAddresses,
  },
  {
    label: 'Individual IDs',
    path: 'individualDetails.individualIds',
    transform: formatIds,
  },
];
