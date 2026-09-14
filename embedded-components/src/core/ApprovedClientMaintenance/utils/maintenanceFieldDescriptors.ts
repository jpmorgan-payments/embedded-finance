import type {
  MaintenanceAddress,
  MaintenanceIndividualId,
  MaintenanceParty,
  MaintenancePhone,
} from '../models/maintenanceApi.types';

export type EditablePartyField =
  | 'organizationName'
  | 'dbaName'
  | 'organizationType'
  | 'countryOfFormation'
  | 'yearOfFormation'
  | 'organizationDescription'
  | 'organizationIds'
  | 'organizationPhone'
  | 'website'
  | 'addresses'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'nameSuffix'
  | 'birthDate'
  | 'countryOfResidence'
  | 'individualAddresses'
  | 'individualIds'
  | 'jobTitle'
  | 'jobTitleDescription'
  | 'natureOfOwnership'
  | 'email'
  | 'phone'
  | 'roles';

export type MaintenanceFieldValue =
  | string
  | string[]
  | MaintenanceAddress[]
  | MaintenanceIndividualId[]
  | MaintenancePhone;

export type MaintenanceFieldDescriptor = {
  field: EditablePartyField;
  labelKey: string;
  sensitivity: 'public' | 'masked';
  isPresent: (party: MaintenanceParty) => boolean;
  read: (party: MaintenanceParty) => MaintenanceFieldValue | undefined;
  write: (party: MaintenanceParty, value: MaintenanceFieldValue) => void;
  format: (value: MaintenanceFieldValue | undefined) => string;
};

const hasOwn = (value: object | undefined, key: string) =>
  value !== undefined && Object.prototype.hasOwnProperty.call(value, key);

const formatAddress = (address: MaintenanceAddress) =>
  [
    ...(address.addressLines ?? []),
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

const formatAddresses = (value: MaintenanceFieldValue | undefined) =>
  Array.isArray(value) && value.every((item) => typeof item === 'object')
    ? value.map(formatAddress).filter(Boolean).join('; ')
    : '';

const stringField = (
  scope: 'individualDetails' | 'organizationDetails',
  field: Exclude<EditablePartyField, 'addresses' | 'roles'>,
  labelKey: string,
  sensitivity: 'public' | 'masked' = 'public'
): MaintenanceFieldDescriptor => ({
  field,
  labelKey,
  sensitivity,
  isPresent: (party) => hasOwn(party[scope], field),
  read: (party) => {
    const details = party[scope] as Record<string, unknown> | undefined;
    const value = details?.[field];
    return typeof value === 'string' ? value : undefined;
  },
  write: (party, value) => {
    if (typeof value !== 'string') return;
    const details = {
      ...(party[scope] as Record<string, unknown> | undefined),
    };
    details[field] = value;
    party[scope] = details;
  },
  format: (value) =>
    typeof value === 'string' ? (value.trim() ? value : '') : '',
});

const rolesDescriptor: MaintenanceFieldDescriptor = {
  field: 'roles',
  labelKey: 'changes.roles',
  sensitivity: 'public',
  isPresent: (party) => hasOwn(party, 'roles'),
  read: (party) => party.roles,
  write: (party, value) => {
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === 'string')
    ) {
      return;
    }
    party.roles = [...value];
  },
  format: (value) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string')
      ? value.join(', ')
      : '',
};

const emailDescriptor: MaintenanceFieldDescriptor = {
  field: 'email',
  labelKey: 'individualDetails.email',
  sensitivity: 'public',
  isPresent: (party) => hasOwn(party, 'email'),
  read: (party) => party.email,
  write: (party, value) => {
    if (typeof value === 'string') party.email = value;
  },
  format: (value) => (typeof value === 'string' ? value : ''),
};

const individualAddressDescriptor: MaintenanceFieldDescriptor = {
  field: 'individualAddresses',
  labelKey: 'individualDetails.address',
  sensitivity: 'public',
  isPresent: (party) => hasOwn(party.individualDetails, 'addresses'),
  read: (party) => party.individualDetails?.addresses,
  write: (party, value) => {
    if (!Array.isArray(value)) return;
    party.individualDetails = {
      ...party.individualDetails,
      addresses: structuredClone(value as MaintenanceAddress[]),
    };
  },
  format: formatAddresses,
};

const individualIdsDescriptor: MaintenanceFieldDescriptor = {
  field: 'individualIds',
  labelKey: 'individualDetails.identification',
  sensitivity: 'masked',
  isPresent: (party) => hasOwn(party.individualDetails, 'individualIds'),
  read: (party) => party.individualDetails?.individualIds,
  write: (party, value) => {
    if (!Array.isArray(value)) return;
    party.individualDetails = {
      ...party.individualDetails,
      individualIds: structuredClone(value as MaintenanceIndividualId[]),
    };
  },
  format: (value) => {
    if (!Array.isArray(value)) return '';
    const identity = value[0] as MaintenanceIndividualId | undefined;
    return identity?.value
      ? `${identity.idType ?? ''} ••••${identity.value.slice(-4)}`.trim()
      : '';
  },
};

const phoneDescriptor: MaintenanceFieldDescriptor = {
  field: 'phone',
  labelKey: 'individualDetails.phone',
  sensitivity: 'masked',
  isPresent: (party) => hasOwn(party.individualDetails, 'phone'),
  read: (party) => party.individualDetails?.phone,
  write: (party, value) => {
    if (Array.isArray(value) || typeof value !== 'object') return;
    party.individualDetails = {
      ...party.individualDetails,
      phone: structuredClone(value as MaintenancePhone),
    };
  },
  format: (value) => {
    if (Array.isArray(value) || typeof value !== 'object') return '';
    const phone = value as MaintenancePhone;
    return phone.phoneNumber
      ? `${phone.countryCode ?? ''} ••••${phone.phoneNumber.slice(-4)}`.trim()
      : '';
  },
};

const addressDescriptor: MaintenanceFieldDescriptor = {
  field: 'addresses',
  labelKey: 'editor.addresses',
  sensitivity: 'public',
  isPresent: (party) => hasOwn(party.organizationDetails, 'addresses'),
  read: (party) => party.organizationDetails?.addresses,
  write: (party, value) => {
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === 'object')
    ) {
      return;
    }
    party.organizationDetails = {
      ...party.organizationDetails,
      addresses: structuredClone(value as MaintenanceAddress[]),
    };
  },
  format: formatAddresses,
};

const organizationIdsDescriptor: MaintenanceFieldDescriptor = {
  field: 'organizationIds',
  labelKey: 'onboarding-overview:fields.organizationIdEin.label',
  sensitivity: 'masked',
  isPresent: (party) => hasOwn(party.organizationDetails, 'organizationIds'),
  read: (party) => party.organizationDetails?.organizationIds,
  write: (party, value) => {
    if (!Array.isArray(value)) return;
    party.organizationDetails = {
      ...party.organizationDetails,
      organizationIds: structuredClone(value as MaintenanceIndividualId[]),
    };
  },
  format: (value) => {
    if (!Array.isArray(value)) return '';
    const identity = value[0] as MaintenanceIndividualId | undefined;
    return identity?.value
      ? `${identity.idType ?? ''} ••••${identity.value.slice(-4)}`.trim()
      : '';
  },
};

const organizationPhoneDescriptor: MaintenanceFieldDescriptor = {
  field: 'organizationPhone',
  labelKey: 'organizationDetails.phone',
  sensitivity: 'masked',
  isPresent: (party) => hasOwn(party.organizationDetails, 'phone'),
  read: (party) => party.organizationDetails?.phone,
  write: (party, value) => {
    if (Array.isArray(value) || typeof value !== 'object') return;
    party.organizationDetails = {
      ...party.organizationDetails,
      phone: structuredClone(value as MaintenancePhone),
    };
  },
  format: phoneDescriptor.format,
};

export const MAINTENANCE_FIELD_DESCRIPTORS: MaintenanceFieldDescriptor[] = [
  stringField('organizationDetails', 'organizationName', 'legalName'),
  stringField('organizationDetails', 'dbaName', 'editor.dbaName'),
  stringField(
    'organizationDetails',
    'organizationType',
    'onboarding-overview:fields.organizationType.label'
  ),
  stringField(
    'organizationDetails',
    'countryOfFormation',
    'onboarding-overview:fields.countryOfFormation.label'
  ),
  stringField(
    'organizationDetails',
    'yearOfFormation',
    'onboarding-overview:fields.yearOfFormation.label'
  ),
  organizationIdsDescriptor,
  stringField(
    'organizationDetails',
    'organizationDescription',
    'onboarding-overview:fields.organizationDescription.label'
  ),
  stringField(
    'organizationDetails',
    'website',
    'onboarding-overview:fields.website.label'
  ),
  organizationPhoneDescriptor,
  addressDescriptor,
  stringField('individualDetails', 'firstName', 'editor.firstName'),
  stringField('individualDetails', 'middleName', 'editor.middleName'),
  stringField('individualDetails', 'lastName', 'editor.lastName'),
  stringField(
    'individualDetails',
    'nameSuffix',
    'individualDetails.nameSuffix'
  ),
  stringField('individualDetails', 'birthDate', 'editor.birthDate', 'masked'),
  stringField(
    'individualDetails',
    'countryOfResidence',
    'individualDetails.countryOfResidence'
  ),
  individualIdsDescriptor,
  stringField('individualDetails', 'jobTitle', 'individualDetails.jobTitle'),
  stringField(
    'individualDetails',
    'jobTitleDescription',
    'onboarding-overview:fields.controllerJobTitleDescription.label'
  ),
  stringField(
    'individualDetails',
    'natureOfOwnership',
    'individualDetails.ownership'
  ),
  emailDescriptor,
  phoneDescriptor,
  individualAddressDescriptor,
  rolesDescriptor,
];

const birthDateDescriptor = MAINTENANCE_FIELD_DESCRIPTORS.find(
  (descriptor) => descriptor.field === 'birthDate'
);
if (birthDateDescriptor) {
  birthDateDescriptor.format = (value) =>
    typeof value === 'string' && value ? '••••••••' : '';
}

export const getMaintenanceFieldDescriptor = (field: EditablePartyField) =>
  MAINTENANCE_FIELD_DESCRIPTORS.find(
    (descriptor) => descriptor.field === field
  );
