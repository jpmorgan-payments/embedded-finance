import { TFunction } from 'i18next';





const maskIdentification = (value: string) => {
  if (!value) return value;
  const lastFourDigits = value.slice(-4);
  return `****${lastFourDigits}`;
};

const formatIdentifications = (
  ids: Array<{ idType: string; value: string; issuer: string }> | undefined,
  t: TFunction
) => {
  if (!Array.isArray(ids) || !ids.length) return [];
  return ids.map(
    (id) =>
      `${t(`idValueLabels.individual.${id.idType}`)} (${id.issuer}): ${maskIdentification(id.value)}`
  );
};

const formatPhoneNumber = (phone: any, t: TFunction) =>
  phone
    ? `${t(`phoneTypes.${phone.phoneType}`)}: ${phone.countryCode} ${phone.phoneNumber}`
    : undefined;

const formatAddresses = (addresses: any[] | undefined, t: TFunction) => {
  if (!Array.isArray(addresses)) return [];
  return addresses.map(
    (address) =>
      `${t(`addressTypes.${address?.addressType}`)}: ${address?.addressLines?.join(' ') || ''}, ${address?.city || ''}, ${
        address?.state || ''
      }, ${address?.country || ''}, ${address?.postalCode || ''}`
  );
};

const formatSocialMedia = (socialMedia: any[] | undefined, t: TFunction) => {
  if (!Array.isArray(socialMedia)) return [];
  return socialMedia.map(
    (s) => `${t(`socialMediaPlatform.${s.profilePlatform}`)}: ${s.username}`
  );
};

const formatRoles = (roles: string[] | undefined, t: TFunction) => {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) => t(`partyRoles.${role}`));
};

export const organizationFields = (t: TFunction) => [
  {
    label: t('fields.organizationName.label'),
    path: 'organizationDetails.organizationName',
  },
  {
    label: t('fields.organizationType.label'),
    path: 'organizationDetails.organizationType',
    transformFunc: (type: string) =>
      type ? t(`organizationTypes.${type}`) : undefined,
  },
  {
    label: t('fields.organizationDescription.label'),
    path: 'organizationDetails.organizationDescription',
  },
  {
    label: t('fields.dbaName.label'),
    path: 'organizationDetails.dbaName',
  },
  {
    label: t('fields.industry.label'),
    path: 'organizationDetails.industryCategory',
  },
  {
    label: t('fields.industry.label'),
    path: 'organizationDetails.industryType',
  },
  {
    label: t('fields.industry.label'),
    path: 'organizationDetails.industry',
    transformFunc: (industry: any) =>
      industry ? `${industry.codeType}: ${industry.code}` : undefined,
  },
  {
    label: t('fields.countryOfFormation.label'),
    path: 'organizationDetails.countryOfFormation',
  },
  {
    label: t('fields.associatedCountries.headerLabel'),
    path: 'organizationDetails.associatedCountries',
  },
  {
    label: t('fields.yearOfFormation.label'),
    path: 'organizationDetails.yearOfFormation',
  },
  {
    label: t('fields.organizationEmail.label'),
    path: 'email',
  },
  {
    label: t('fields.organizationPhone.phoneType.label'),
    path: 'organizationDetails.phone',
    transformFunc: (phone: any) => formatPhoneNumber(phone, t),
  },
  {
    label: t('fields.website.label'),
    path: 'organizationDetails.website',
  },
  {
    label: t('fields.websiteAvailable.label'),
    path: 'organizationDetails.websiteAvailable',
    transformFunc: (value: boolean) =>
      value ? t('common:yes') : t('common:no'),
  },
  {
    label: t('fields.addresses.label'),
    path: 'organizationDetails.addresses',
    transformFunc: (addresses: any) => formatAddresses(addresses, t),
  },
  {
    label: t('fields.organizationIds.label'),
    path: 'organizationDetails.organizationIds',
    transformFunc: (ids: any) => formatIdentifications(ids, t),
  },
  {
    label: t('fields.jurisdiction.label'),
    path: 'organizationDetails.jurisdiction',
  },
  {
    label: t('fields.mcc.label'),
    path: 'organizationDetails.mcc',
  },
  {
    label: t('fields.secondaryMccList.headerLabel'),
    path: 'organizationDetails.secondaryMccList',
  },
  {
    label: t('missingPartyFields.fields.entitiesInOwnership'),
    path: 'organizationDetails.entitiesInOwnership',
    transformFunc: (value: boolean) =>
      value ? t('common:yes') : t('common:no'),
  },
];

export const individualFields = (t: TFunction) => [
  {
    label: t('fields.controllerEmail.label'),
    path: 'email',
  },
  {
    label: t('fields.roles.label'),
    path: 'roles',
    transformFunc: (roles: string[]) => formatRoles(roles, t),
  },
  {
    label: t('fields.controllerFirstName.label'),
    path: 'individualDetails.firstName',
  },
  {
    label: t('fields.controllerMiddleName.label'),
    path: 'individualDetails.middleName',
  },
  {
    label: t('fields.controllerLastName.label'),
    path: 'individualDetails.lastName',
  },
  {
    label: t('fields.controllerNameSuffix.label'),
    path: 'individualDetails.nameSuffix',
  },
  {
    label: t('fields.birthDate.label'),
    path: 'individualDetails.birthDate',
  },
  {
    label: t('fields.countryOfResidence.label'),
    path: 'individualDetails.countryOfResidence',
  },
  {
    label: t('fields.countryOfCitizenship.label'),
    path: 'individualDetails.countryOfCitizenship',
  },
  {
    label: t('fields.controllerJobTitle.label'),
    path: 'individualDetails.jobTitle',
  },
  {
    label: t('fields.controllerJobTitleDescription.label'),
    path: 'individualDetails.jobTitleDescription',
  },
  {
    label: t('fields.natureOfOwnership.label'),
    path: 'individualDetails.natureOfOwnership',
  },
  {
    label: t('fields.soleOwner.label'),
    path: 'individualDetails.soleOwner',
    transformFunc: (value: boolean) =>
      value ? t('common:yes') : t('common:no'),
  },
  {
    label: t('fields.controllerPhone.phoneType.label'),
    path: 'individualDetails.phone',
    transformFunc: (phone: any) => formatPhoneNumber(phone, t),
  },
  {
    label: t('fields.addresses.label'),
    path: 'individualDetails.addresses',
    transformFunc: (addresses: any) => formatAddresses(addresses, t),
  },
  {
    label: t('fields.controllerIds.label'),
    path: 'individualDetails.individualIds',
    transformFunc: (ids: any) => formatIdentifications(ids, t),
  },
  {
    label: t('fields.socialMedia.label'),
    path: 'individualDetails.socialMedia',
    transformFunc: (social: any) => formatSocialMedia(social, t),
  },
];