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
  { 
    label: 'Organization Description', 
    path: 'organizationDetails.organizationDescription' 
  },
  { label: 'DBA Name', path: 'organizationDetails.dbaName' },
  { label: 'Industry Category', path: 'organizationDetails.industryCategory' },
  { label: 'Industry Type', path: 'organizationDetails.industryType' },
  {
    label: 'Industry Code',
    path: 'organizationDetails.industry',
    transformFunc: (industry: any) => 
      industry ? `${industry.codeType}: ${industry.code}` : undefined,
  },
  {
    label: 'Country of Formation',
    path: 'organizationDetails.countryOfFormation',
  },
  {
    label: 'Associated Countries',
    path: 'organizationDetails.associatedCountries',
  },
  { label: 'Year of Formation', path: 'organizationDetails.yearOfFormation' },
  { label: 'Email', path: 'email' },
  {
    label: 'Phone',
    path: 'organizationDetails.phone',
    transformFunc: (phone: any) =>
      phone ? `${phone.phoneType}: +${phone.countryCode} ${phone.phoneNumber}` : undefined,
  },
  { label: 'Website', path: 'organizationDetails.website' },
  { 
    label: 'Website Available', 
    path: 'organizationDetails.websiteAvailable' 
  },
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
  { label: 'Middle Name', path: 'individualDetails.middleName' },
  { label: 'Last Name', path: 'individualDetails.lastName' },
  { label: 'Suffix', path: 'individualDetails.nameSuffix' },
  { 
    label: 'Date of Birth', 
    path: 'individualDetails.birthDate',
  },
  {
    label: 'Country of Residence',
    path: 'individualDetails.countryOfResidence',
  },
  {
    label: 'Country of Citizenship',
    path: 'individualDetails.countryOfCitizenship',
  },
  { label: 'Job Title', path: 'individualDetails.jobTitle' },
  {
    label: 'Job Title Description',
    path: 'individualDetails.jobTitleDescription',
  },
  { label: 'Nature of Ownership', path: 'individualDetails.natureOfOwnership' },
  { label: 'Sole Owner', path: 'individualDetails.soleOwner' },
  {
    label: 'Phone',
    path: 'individualDetails.phone',
    transformFunc: (phone: any) =>
      phone ? `${phone.phoneType}: +${phone.countryCode} ${phone.phoneNumber}` : undefined,
  },
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
  {
    label: 'Social Media',
    path: 'individualDetails.socialMedia',
    transformFunc: (social: any) =>
      social?.map((s: any) => `${s.profilePlatform}: ${s.username}`),
  },
];
