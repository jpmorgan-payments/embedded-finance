import type { ClientScenario } from './dashboard-layout';

// Mapping SellSense client scenarios to onboarding scenario data
export const sellSenseScenarioMapping = {
  'New Seller - Onboarding': {
    clientId: undefined, // New client, scenario5 from onboardingScenarios.ts
    description: 'New Client (US/Embedded Payments, no mocked data)',
    scenarioId: 'scenario5',
  },
  'Onboarding - Docs Needed': {
    clientId: '0030000133', // scenario3 from onboardingScenarios.ts
    description: 'US LLC (outstanding documents requested)',
    scenarioId: 'scenario3',
  },
  'Onboarding - In Review': {
    clientId: '0030000134', // scenario4 from onboardingScenarios.ts
    description: 'US LLC (review in progress)',
    scenarioId: 'scenario4',
  },
  'Active Seller - Fresh Start': {
    clientId: '0030000131', // Could use scenario1 (onboarding in progress)
    description: 'US Sole Proprietor (onboarding completed, fresh seller)',
    scenarioId: 'scenario1',
  },
  'Active Seller - Established': {
    clientId: '0030000132', // Could use scenario2 (established business)
    description: 'US LLC (established seller with transaction history)',
    scenarioId: 'scenario2',
  },
} as const;

export const getScenarioData = (scenario: ClientScenario) => {
  return sellSenseScenarioMapping[scenario];
};

export const getClientIdFromScenario = (
  scenario: ClientScenario,
): string | undefined => {
  return sellSenseScenarioMapping[scenario].clientId;
};
