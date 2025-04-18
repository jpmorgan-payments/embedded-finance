const availableOrganizationTypes = [
  'SOLE_PROPRIETORSHIP',
  'LIMITED_LIABILITY_COMPANY',
  'LIMITED_LIABILITY_PARTNERSHIP',
  'GENERAL_PARTNERSHIP',
  'LIMITED_PARTNERSHIP',
  'C_CORPORATION',
  'S_CORPORATION',
  'PARTNERSHIP',
  'PUBLICLY_TRADED_COMPANY',
];

export const onboardingScenarios = [
  {
    id: 'scenario1',
    name: 'Sole Proprietor (US/Embedded Payments mocked data)',
    clientId: '0030000131',
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingWizardBasic',
  },
  {
    id: 'scenario2',
    name: 'LLC (US/Embedded Payments mocked data)',
    clientId: '0030000132',
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingWizardBasic',
  },
  {
    id: 'scenario3',
    name: 'LLC (US/Embedded Payments) - Outstanding Documents',
    clientId: '0030000133',
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingWizardBasic',
  },
  {
    id: 'scenario4',
    name: 'LLC (US/Embedded Payments) - review in progress',
    clientId: '0030000134',
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingWizardBasic',
  },
  {
    id: 'scenario5',
    name: 'New Client (US/Embedded Payments, no mocked data)',
    clientId: undefined,
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingWizardBasic',
  },
  {
    id: 'scenario6',
    name: 'Overview Layout - Sole Proprietor',
    clientId: '0030000131',
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingOverviewFlow',
  },
  {
    id: 'scenario7',
    name: 'Overview Layout - LLC',
    clientId: '0030000132',
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    baseURL: '/ef/do/v1/',
    gatewayID: '',
    availableOrganizationTypes,
    component: 'OnboardingOverviewFlow',
  },
];
