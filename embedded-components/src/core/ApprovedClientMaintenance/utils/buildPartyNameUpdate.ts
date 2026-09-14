import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';

import type {
  MaintenanceAddress,
  MaintenanceIndividualDetails,
  MaintenanceIndividualId,
  MaintenancePartyUpdateRequest,
  MaintenancePhone,
} from '../models/maintenanceApi.types';

export type PartyNameUpdateRequest = MaintenancePartyUpdateRequest;

export type IndividualAddressValues = {
  country: string;
  primaryAddressLine: string;
  secondaryAddressLine: string;
  tertiaryAddressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

export type IndividualIdentityValues = {
  idType: string;
  value: string;
};

export type IndividualPhoneValues = {
  phoneType: string;
  countryCode: string;
  phoneNumber: string;
};

export type IndividualMaintenanceValues = IndividualLegalNameValues & {
  nameSuffix: string;
  birthDate: string;
  countryOfResidence: string;
  individualId: IndividualIdentityValues;
  jobTitle: string;
  jobTitleDescription: string;
  email: string;
  phone: IndividualPhoneValues;
  residentialAddress: IndividualAddressValues;
};

export type IndividualMaintenanceFieldPath =
  | Exclude<
      keyof IndividualMaintenanceValues,
      'individualId' | 'phone' | 'residentialAddress'
    >
  | `individualId.${keyof IndividualIdentityValues}`
  | `phone.${keyof IndividualPhoneValues}`
  | `residentialAddress.${keyof IndividualAddressValues}`;

export type PartyNameUpdateResult =
  | { kind: 'unchanged' }
  | {
      kind: 'unsupported-clear';
      fields: Array<keyof IndividualLegalNameValues>;
    }
  | { kind: 'changed'; request: PartyNameUpdateRequest };

const NAME_FIELDS: Array<keyof IndividualLegalNameValues> = [
  'firstName',
  'middleName',
  'lastName',
];

type IndividualScalarField =
  | keyof IndividualLegalNameValues
  | 'nameSuffix'
  | 'birthDate'
  | 'countryOfResidence'
  | 'jobTitle'
  | 'jobTitleDescription';

const INDIVIDUAL_FIELDS: IndividualScalarField[] = [
  ...NAME_FIELDS,
  'nameSuffix',
  'birthDate',
  'countryOfResidence',
  'jobTitle',
  'jobTitleDescription',
];

export type IndividualPartyUpdateResult =
  | { kind: 'unchanged' }
  | {
      kind: 'unsupported-clear';
      fields: IndividualMaintenanceFieldPath[];
    }
  | { kind: 'changed'; request: PartyNameUpdateRequest };

export function buildIndividualPartyUpdate(
  baseline: IndividualMaintenanceValues,
  submitted: IndividualMaintenanceValues,
  approvedAddresses: MaintenanceAddress[] = [],
  approvedIndividualIds: MaintenanceIndividualId[] = []
): IndividualPartyUpdateResult {
  const unsupportedClearFields: IndividualMaintenanceFieldPath[] =
    INDIVIDUAL_FIELDS.filter(
      (fieldName) =>
        typeof baseline[fieldName] === 'string' &&
        baseline[fieldName] !== '' &&
        submitted[fieldName] === ''
    ) as IndividualMaintenanceFieldPath[];
  if (baseline.email && !submitted.email) {
    unsupportedClearFields.push('email');
  }

  const addUnsupportedNestedClear = (
    baselineValue: string,
    submittedValue: string,
    field: IndividualMaintenanceFieldPath
  ) => {
    if (baselineValue && !submittedValue) unsupportedClearFields.push(field);
  };
  (['idType', 'value'] as Array<keyof IndividualIdentityValues>).forEach(
    (field) =>
      addUnsupportedNestedClear(
        baseline.individualId[field],
        submitted.individualId[field],
        `individualId.${field}`
      )
  );
  (
    ['phoneType', 'countryCode', 'phoneNumber'] as Array<
      keyof IndividualPhoneValues
    >
  ).forEach((field) =>
    addUnsupportedNestedClear(
      baseline.phone[field],
      submitted.phone[field],
      `phone.${field}`
    )
  );
  (
    [
      'country',
      'primaryAddressLine',
      'secondaryAddressLine',
      'tertiaryAddressLine',
      'city',
      'state',
      'postalCode',
    ] as Array<keyof IndividualAddressValues>
  ).forEach((field) =>
    addUnsupportedNestedClear(
      baseline.residentialAddress[field],
      submitted.residentialAddress[field],
      `residentialAddress.${field}`
    )
  );
  if (unsupportedClearFields.length > 0) {
    return { kind: 'unsupported-clear', fields: unsupportedClearFields };
  }

  const changedScalarDetails = INDIVIDUAL_FIELDS.reduce<Record<string, string>>(
    (changedFields, fieldName) => {
      if (baseline[fieldName] !== submitted[fieldName]) {
        const submittedValue = submitted[fieldName];
        if (submittedValue !== '') {
          changedFields[fieldName] = submittedValue;
        }
      }
      return changedFields;
    },
    {}
  );
  const individualDetails: MaintenanceIndividualDetails = changedScalarDetails;

  const request: MaintenancePartyUpdateRequest = {};
  if (baseline.email !== submitted.email && submitted.email) {
    request.email = submitted.email;
  }

  const submittedAddress: MaintenanceAddress = {
    addressType: approvedAddresses[0]?.addressType ?? 'RESIDENTIAL_ADDRESS',
    addressLines: [
      submitted.residentialAddress.primaryAddressLine,
      submitted.residentialAddress.secondaryAddressLine,
      submitted.residentialAddress.tertiaryAddressLine,
    ].filter(Boolean),
    city: submitted.residentialAddress.city,
    state: submitted.residentialAddress.state,
    postalCode: submitted.residentialAddress.postalCode,
    country: submitted.residentialAddress.country,
  };
  const baselineAddress: MaintenanceAddress = {
    addressType: approvedAddresses[0]?.addressType ?? 'RESIDENTIAL_ADDRESS',
    addressLines: [
      baseline.residentialAddress.primaryAddressLine,
      baseline.residentialAddress.secondaryAddressLine,
      baseline.residentialAddress.tertiaryAddressLine,
    ].filter(Boolean),
    city: baseline.residentialAddress.city,
    state: baseline.residentialAddress.state,
    postalCode: baseline.residentialAddress.postalCode,
    country: baseline.residentialAddress.country,
  };
  if (JSON.stringify(baselineAddress) !== JSON.stringify(submittedAddress)) {
    individualDetails.addresses = [
      submittedAddress,
      ...approvedAddresses.slice(1),
    ];
  }

  const submittedId: MaintenanceIndividualId = {
    idType: submitted.individualId.idType,
    value: submitted.individualId.value,
    issuer: submitted.countryOfResidence || approvedIndividualIds[0]?.issuer,
  };
  const baselineId: MaintenanceIndividualId = {
    idType: baseline.individualId.idType,
    value: baseline.individualId.value,
    issuer: approvedIndividualIds[0]?.issuer ?? baseline.countryOfResidence,
  };
  const hasIdentity = Boolean(
    baseline.individualId.idType ||
      baseline.individualId.value ||
      submitted.individualId.idType ||
      submitted.individualId.value
  );
  if (
    hasIdentity &&
    JSON.stringify(baselineId) !== JSON.stringify(submittedId)
  ) {
    individualDetails.individualIds = [
      submittedId,
      ...approvedIndividualIds.slice(1),
    ];
  }

  const submittedPhone: MaintenancePhone = {
    phoneType: submitted.phone.phoneType,
    countryCode: submitted.phone.countryCode,
    phoneNumber: submitted.phone.phoneNumber,
  };
  if (JSON.stringify(baseline.phone) !== JSON.stringify(submitted.phone)) {
    individualDetails.phone = submittedPhone;
  }

  if (Object.keys(individualDetails).length > 0) {
    request.individualDetails = individualDetails;
  }

  return Object.keys(request).length > 0
    ? { kind: 'changed', request }
    : { kind: 'unchanged' };
}

export function buildPartyNameUpdate(
  baselineName: IndividualLegalNameValues,
  submittedName: IndividualLegalNameValues
): PartyNameUpdateResult {
  const unsupportedClearFields = NAME_FIELDS.filter(
    (fieldName) =>
      baselineName[fieldName] !== '' && submittedName[fieldName] === ''
  );

  if (unsupportedClearFields.length > 0) {
    return { kind: 'unsupported-clear', fields: unsupportedClearFields };
  }

  const individualDetails = NAME_FIELDS.reduce<
    Partial<IndividualLegalNameValues>
  >((changedFields, fieldName) => {
    if (baselineName[fieldName] !== submittedName[fieldName]) {
      changedFields[fieldName] = submittedName[fieldName];
    }
    return changedFields;
  }, {});

  if (Object.keys(individualDetails).length === 0) {
    return { kind: 'unchanged' };
  }

  return { kind: 'changed', request: { individualDetails } };
}
