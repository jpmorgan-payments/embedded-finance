import { ClientProduct, OrganizationType } from '@/api/generated/smbdo.schemas';

import { Jurisdiction } from '../utils/types';

export interface RequiredFieldsList {
  fields: Record<string, string[]>;
  notes: string[];
}

export const REQUIRED_FIELDS_BY_TYPE: Record<string, string[]> = {
  SOLE_PROPRIETORSHIP_US_EP: [
    'fields.organizationName.label',
    'fields.organizationDescription.label',
    'fields.organizationEmail.label',
    'fields.organizationPhone.phoneNumber.label',
    'fields.addresses.label',
    'fields.yearOfFormation.label',
    'fields.countryOfFormation.label',
    'fields.individualIds.label',
  ],
  PUBLIC_CORPORATION_US_EP: [
    'fields.organizationName.label',
    'fields.organizationDescription.label',
    'fields.organizationEmail.label',
    'fields.organizationPhone.phoneNumber.label',
    'fields.addresses.label',
    'fields.yearOfFormation.label',
    'fields.countryOfFormation.label',
    'fields.individualIds.label',
  ],
  DEFAULT: [
    'fields.organizationName.label',
    'fields.organizationDescription.label',
    'fields.organizationEmail.label',
    'fields.organizationPhone.phoneNumber.label',
    'fields.addresses.label',
    'fields.yearOfFormation.label',
    'fields.countryOfFormation.label',
    'fields.organizationIds.label',
    'fields.industry.label',
  ],
};

export function generateRequiredFieldsList(
  type?: OrganizationType,
  product?: ClientProduct,
  jurisdiction?: Jurisdiction
): RequiredFieldsList {
  if (!type) return { fields: {}, notes: [] };

  // Determine if this is a US Sole Proprietorship with Embedded Payments
  const isSoleProprietorshipUsEp =
    type === 'SOLE_PROPRIETORSHIP' &&
    jurisdiction === 'US' &&
    product === 'EMBEDDED_PAYMENTS';

  // Get the appropriate field list
  const fieldList = isSoleProprietorshipUsEp
    ? REQUIRED_FIELDS_BY_TYPE.SOLE_PROPRIETORSHIP_US_EP
    : REQUIRED_FIELDS_BY_TYPE.DEFAULT;

  return {
    fields: { required: fieldList },
    notes: [
      'initialStepNotes.additionalQuestions',
      ...(type === 'LIMITED_LIABILITY_COMPANY'
        ? ['initialStepNotes.llcOwners']
        : []),
      'initialStepNotes.attestation',
      'initialStepNotes.kycProcess',
    ],
  };
}
