import type {
  MaintenanceAddress,
  MaintenanceOrganizationDetails,
  MaintenancePartyUpdateRequest,
} from '../models/maintenanceApi.types';

export type MaintenanceAddressValues = {
  country: string;
  primaryAddressLine: string;
  secondaryAddressLine: string;
  tertiaryAddressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

export type OrganizationMaintenanceValues = {
  organizationName: string;
  dbaName: string;
  organizationType: string;
  countryOfFormation: string;
  yearOfFormation: string;
  solePropHasEin: 'yes' | 'no';
  organizationId: {
    idType: string;
    value: string;
    issuer: string;
  };
  organizationDescription: string;
  email: string;
  phone: {
    phoneType: string;
    countryCode: string;
    phoneNumber: string;
  };
  organizationAddress: MaintenanceAddressValues;
};

export type OrganizationMaintenanceField =
  | 'organizationName'
  | 'dbaName'
  | 'organizationType'
  | 'countryOfFormation'
  | 'yearOfFormation'
  | 'organizationId.value'
  | 'organizationDescription'
  | 'email'
  | 'phone.phoneNumber'
  | 'organizationAddress.secondaryAddressLine'
  | 'organizationAddress.tertiaryAddressLine';

export type OrganizationPartyUpdateResult =
  | { kind: 'unchanged' }
  | { kind: 'unsupported-clear'; fields: OrganizationMaintenanceField[] }
  | { kind: 'changed'; request: MaintenancePartyUpdateRequest };

const addressToValues = (
  address: MaintenanceAddress | undefined
): MaintenanceAddressValues => ({
  country: address?.country ?? '',
  primaryAddressLine: address?.addressLines?.[0] ?? '',
  secondaryAddressLine: address?.addressLines?.[1] ?? '',
  tertiaryAddressLine: address?.addressLines?.[2] ?? '',
  city: address?.city ?? '',
  state: address?.state ?? '',
  postalCode: address?.postalCode ?? '',
});

export const getOrganizationMaintenanceValues = (
  organizationName: string | undefined,
  dbaName: string | undefined,
  address: MaintenanceAddress | undefined,
  details?: MaintenanceOrganizationDetails,
  email?: string
): OrganizationMaintenanceValues => ({
  organizationName: organizationName ?? '',
  dbaName: dbaName ?? '',
  organizationType: details?.organizationType ?? '',
  countryOfFormation: details?.countryOfFormation ?? '',
  yearOfFormation: details?.yearOfFormation ?? '',
  solePropHasEin:
    details?.organizationType === 'SOLE_PROPRIETORSHIP' &&
    !details.organizationIds?.[0]?.value
      ? 'no'
      : 'yes',
  organizationId: {
    idType: details?.organizationIds?.[0]?.idType ?? 'EIN',
    value: details?.organizationIds?.[0]?.value ?? '',
    issuer:
      details?.organizationIds?.[0]?.issuer ??
      details?.countryOfFormation ??
      '',
  },
  organizationDescription: details?.organizationDescription ?? '',
  email: email ?? '',
  phone: {
    phoneType: details?.phone?.phoneType ?? 'BUSINESS_PHONE',
    countryCode: details?.phone?.countryCode ?? '',
    phoneNumber: details?.phone?.phoneNumber ?? '',
  },
  organizationAddress: addressToValues(address),
});

const addressFromValues = (
  values: MaintenanceAddressValues,
  addressType: string
): MaintenanceAddress => ({
  addressType,
  addressLines: [
    values.primaryAddressLine,
    values.secondaryAddressLine,
    values.tertiaryAddressLine,
  ].filter(Boolean),
  city: values.city,
  state: values.state,
  postalCode: values.postalCode,
  country: values.country,
});

export function buildOrganizationPartyUpdate(
  baseline: OrganizationMaintenanceValues,
  submitted: OrganizationMaintenanceValues,
  addressType = 'BUSINESS_ADDRESS'
): OrganizationPartyUpdateResult {
  const unsupportedClearFields: OrganizationMaintenanceField[] = [];
  if (baseline.organizationName !== '' && submitted.organizationName === '') {
    unsupportedClearFields.push('organizationName');
  }
  if (baseline.dbaName !== '' && submitted.dbaName === '') {
    unsupportedClearFields.push('dbaName');
  }
  const scalarClearFields: Array<
    Exclude<
      OrganizationMaintenanceField,
      | 'organizationName'
      | 'dbaName'
      | 'organizationId.value'
      | 'phone.phoneNumber'
      | 'organizationAddress.secondaryAddressLine'
      | 'organizationAddress.tertiaryAddressLine'
    >
  > = [
    'organizationType',
    'countryOfFormation',
    'yearOfFormation',
    'organizationDescription',
    'email',
  ];
  scalarClearFields.forEach((field) => {
    if (baseline[field] !== '' && submitted[field] === '') {
      unsupportedClearFields.push(field);
    }
  });
  if (
    baseline.organizationId.value !== '' &&
    submitted.organizationId.value === ''
  ) {
    unsupportedClearFields.push('organizationId.value');
  }
  if (baseline.phone.phoneNumber !== '' && submitted.phone.phoneNumber === '') {
    unsupportedClearFields.push('phone.phoneNumber');
  }
  if (
    baseline.organizationAddress.secondaryAddressLine !== '' &&
    submitted.organizationAddress.secondaryAddressLine === ''
  ) {
    unsupportedClearFields.push('organizationAddress.secondaryAddressLine');
  }
  if (
    baseline.organizationAddress.tertiaryAddressLine !== '' &&
    submitted.organizationAddress.tertiaryAddressLine === ''
  ) {
    unsupportedClearFields.push('organizationAddress.tertiaryAddressLine');
  }
  if (unsupportedClearFields.length > 0) {
    return { kind: 'unsupported-clear', fields: unsupportedClearFields };
  }

  const organizationDetails: MaintenancePartyUpdateRequest['organizationDetails'] =
    {};
  if (baseline.organizationName !== submitted.organizationName) {
    organizationDetails.organizationName = submitted.organizationName;
  }
  if (baseline.dbaName !== submitted.dbaName) {
    organizationDetails.dbaName = submitted.dbaName;
  }
  if (baseline.organizationType !== submitted.organizationType) {
    organizationDetails.organizationType = submitted.organizationType;
  }
  if (baseline.countryOfFormation !== submitted.countryOfFormation) {
    organizationDetails.countryOfFormation = submitted.countryOfFormation;
  }
  if (baseline.yearOfFormation !== submitted.yearOfFormation) {
    organizationDetails.yearOfFormation = submitted.yearOfFormation;
  }
  if (baseline.organizationDescription !== submitted.organizationDescription) {
    organizationDetails.organizationDescription =
      submitted.organizationDescription;
  }
  if (
    JSON.stringify(baseline.organizationId) !==
    JSON.stringify(submitted.organizationId)
  ) {
    organizationDetails.organizationIds = [
      {
        ...submitted.organizationId,
        value: submitted.organizationId.value.replace(/[\s-]/g, ''),
      },
    ];
  }
  if (JSON.stringify(baseline.phone) !== JSON.stringify(submitted.phone)) {
    organizationDetails.phone = submitted.phone.phoneNumber
      ? submitted.phone
      : undefined;
  }
  if (
    JSON.stringify(baseline.organizationAddress) !==
    JSON.stringify(submitted.organizationAddress)
  ) {
    organizationDetails.addresses = [
      addressFromValues(submitted.organizationAddress, addressType),
    ];
  }

  const request: MaintenancePartyUpdateRequest = {};
  if (baseline.email !== submitted.email) request.email = submitted.email;
  if (Object.keys(organizationDetails).length > 0) {
    request.organizationDetails = organizationDetails;
  }

  return Object.keys(request).length > 0
    ? { kind: 'changed', request }
    : { kind: 'unchanged' };
}
