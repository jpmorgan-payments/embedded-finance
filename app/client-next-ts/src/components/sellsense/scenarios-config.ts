// Centralized scenario configuration to eliminate duplication across files

export const SCENARIO_KEYS = {
  NEW_SELLER_ONBOARDING: 'new-seller-onboarding',
  ONBOARDING_DOCS_NEEDED: 'onboarding-docs-needed',
  ONBOARDING_IN_REVIEW: 'onboarding-in-review',
  ACTIVE_SELLER_FRESH_START: 'active-seller-fresh-start',
  ACTIVE_SELLER_ESTABLISHED: 'active-seller-established',
} as const;

export type ScenarioKey = typeof SCENARIO_KEYS[keyof typeof SCENARIO_KEYS];

// Scenario configuration with display names and metadata
export const SCENARIOS_CONFIG = {
  [SCENARIO_KEYS.NEW_SELLER_ONBOARDING]: {
    displayName: 'New Seller - Onboarding',
    shortName: 'Onboarding',
    description: 'New Client (US/Embedded Payments, no mocked data)',
    clientId: undefined,
    scenarioId: 'scenario5',
    category: 'onboarding' as const,
  },
  [SCENARIO_KEYS.ONBOARDING_DOCS_NEEDED]: {
    displayName: 'Onboarding - Docs Needed',
    shortName: 'Docs Needed',
    description: 'US LLC (outstanding documents requested)',
    clientId: '0030000133',
    scenarioId: 'scenario3',
    category: 'onboarding' as const,
  },
  [SCENARIO_KEYS.ONBOARDING_IN_REVIEW]: {
    displayName: 'Onboarding - In Review',
    shortName: 'In Review',
    description: 'US LLC (review in progress)',
    clientId: '0030000134',
    scenarioId: 'scenario4',
    category: 'onboarding' as const,
  },
  [SCENARIO_KEYS.ACTIVE_SELLER_FRESH_START]: {
    displayName: 'Active Seller with Direct Payouts',
    shortName: 'Direct Payouts',
    description: 'US Sole Proprietor (onboarding completed, fresh seller)',
    clientId: '0030000131',
    scenarioId: 'scenario1',
    category: 'active' as const,
  },
  [SCENARIO_KEYS.ACTIVE_SELLER_ESTABLISHED]: {
    displayName: 'Active Seller with Recipients',
    shortName: 'Recipients',
    description: 'US LLC (established seller with transaction history)',
    clientId: '0030000132',
    scenarioId: 'scenario2',
    category: 'active' as const,
  },
} as const;

// Scenario order for cycling
export const SCENARIO_ORDER: ScenarioKey[] = [
  SCENARIO_KEYS.NEW_SELLER_ONBOARDING,
  SCENARIO_KEYS.ONBOARDING_DOCS_NEEDED,
  SCENARIO_KEYS.ONBOARDING_IN_REVIEW,
  SCENARIO_KEYS.ACTIVE_SELLER_FRESH_START,
  SCENARIO_KEYS.ACTIVE_SELLER_ESTABLISHED,
];

// Utility functions
export const getScenarioByKey = (key: ScenarioKey) => {
  return SCENARIOS_CONFIG[key];
};

export const getScenarioByDisplayName = (displayName: string) => {
  return Object.values(SCENARIOS_CONFIG).find(
    scenario => scenario.displayName === displayName
  );
};

export const getScenarioKeyByDisplayName = (displayName: string): ScenarioKey | undefined => {
  const entry = Object.entries(SCENARIOS_CONFIG).find(
    ([_, config]) => config.displayName === displayName
  );
  return entry?.[0] as ScenarioKey | undefined;
};

export const getNextScenario = (currentKey: ScenarioKey): ScenarioKey => {
  const currentIndex = SCENARIO_ORDER.indexOf(currentKey);
  const isLastScenario = currentIndex === SCENARIO_ORDER.length - 1;
  return isLastScenario ? SCENARIO_ORDER[0] : SCENARIO_ORDER[currentIndex + 1];
};

export const getScenarioDisplayNames = () => {
  return Object.values(SCENARIOS_CONFIG).map(config => config.displayName);
};

export const getOnboardingScenarios = () => {
  return Object.entries(SCENARIOS_CONFIG)
    .filter(([_, config]) => config.category === 'onboarding')
    .map(([key, config]) => ({ key: key as ScenarioKey, ...config }));
};

export const getActiveScenarios = () => {
  return Object.entries(SCENARIOS_CONFIG)
    .filter(([_, config]) => config.category === 'active')
    .map(([key, config]) => ({ key: key as ScenarioKey, ...config }));
}; 