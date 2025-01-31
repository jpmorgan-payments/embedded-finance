const maskIdentification = (value: string) => {
  if (!value) return value;
  const lastFourDigits = value.slice(-4);
  return `****${lastFourDigits}`;
};

const formatIdentifications = (
  ids: Array<{ idType: string; value: string; issuer: string }>
) => {
  if (!ids?.length) return [];
  return ids.map(
    (id) => `${id.idType} (${id.issuer}): ${maskIdentification(id.value)}`
  );
};

export const organizationFields = [
  {
    label: 'Legal Business Name',
    path: 'organizationDetails.organizationName',
  },
  { label: 'Organization Type', path: 'organizationDetails.organizationType' },
  { label: 'Industry Category', path: 'organizationDetails.industryCategory' },
  { label: 'Industry Type', path: 'organizationDetails.industryType' },
  {
    label: 'Country of Formation',
    path: 'organizationDetails.countryOfFormation',
  },
  { label: 'Year of Formation', path: 'organizationDetails.yearOfFormation' },
  { label: 'Email', path: 'email' },
  {
    label: 'Addresses',
    path: 'organizationDetails.addresses',
    transformFunc: (d: any) =>
      d?.map(
        (address: any) =>
          `${address?.addressType}: ${address?.addressLines?.join(' ')}, ${address?.city}, ${address?.state}, ${address?.country}, ${address?.postalCode}`
      ),
  },
  {
    label: 'Business Identifications',
    path: 'organizationDetails.organizationIds',
    transformFunc: formatIdentifications,
  },
];

export const individualFields = [
  { label: 'Email', path: 'email' },
  { label: 'Roles', path: 'roles' },
  { label: 'First Name', path: 'individualDetails.firstName' },
  { label: 'Last Name', path: 'individualDetails.lastName' },
  {
    label: 'Country of Residence',
    path: 'individualDetails.countryOfResidence',
  },
  { label: 'Nature of Ownership', path: 'individualDetails.natureOfOwnership' },
  { label: 'Job Title', path: 'individualDetails.jobTitle' },
  {
    label: 'Job Title Description',
    path: 'individualDetails.jobTitleDescription',
  },
  { label: 'Sole Owner', path: 'individualDetails.soleOwner' },
  {
    label: 'Addresses',
    path: 'individualDetails.addresses',
    transformFunc: (d: any) =>
      d?.map(
        (address: any) =>
          `${address?.addressType}: ${address?.addressLines?.join(' ')}, ${address?.city}, ${address?.state}, ${address?.country}, ${address?.postalCode}`
      ),
  },
  {
    label: 'Personal Identifications',
    path: 'individualDetails.individualIds',
    transformFunc: formatIdentifications,
  },
];
