// Centralized scenario configuration to eliminate duplication across files

export const SCENARIO_KEYS = {
  NEW_SELLER_ONBOARDING: 'new-seller-onboarding',
  ONBOARDING_DOCS_NEEDED: 'onboarding-docs-needed',
  ONBOARDING_IN_REVIEW: 'onboarding-in-review',
  FRESH_START: 'fresh-start',
  ACTIVE_SELLER_LIMITED_DDA: 'active-seller-limited-dda',
  ACTIVE_SELLER_LIMITED_DDA_PAYMENTS: 'active-seller-limited-dda-payments',
} as const;

export type ScenarioKey = (typeof SCENARIO_KEYS)[keyof typeof SCENARIO_KEYS];

// Available components that can be conditionally shown
export const AVAILABLE_COMPONENTS = {
  ACCOUNTS: 'Accounts',
  MAKE_PAYMENT: 'MakePayment',
  LINKED_ACCOUNTS: 'LinkedAccountWidget',
  TRANSACTIONS: 'TransactionsDisplay',
  RECIPIENTS: 'Recipients',
} as const;

export type ComponentName =
  (typeof AVAILABLE_COMPONENTS)[keyof typeof AVAILABLE_COMPONENTS];

// Scenario configuration with display names and metadata
export const SCENARIOS_CONFIG = {
  [SCENARIO_KEYS.NEW_SELLER_ONBOARDING]: {
    displayName: 'New Seller - Onboarding',
    shortName: 'Onboarding',
    description: 'New Client (US/Embedded Payments, no mocked data)',
    clientId: undefined,
    scenarioId: 'scenario5',
    category: 'onboarding' as const,
    headerTitle: 'Complete Your Business Onboarding',
    headerDescription:
      'Set up your business profile and verify your identity to start accepting payments.',
  },
  [SCENARIO_KEYS.ONBOARDING_DOCS_NEEDED]: {
    displayName: 'Onboarding - Docs Needed',
    shortName: 'Docs Needed',
    description: 'US LLC (outstanding documents requested)',
    clientId: '0030000133',
    scenarioId: 'scenario3',
    category: 'onboarding' as const,
    headerTitle: 'Additional Documents Required',
    headerDescription:
      'Please provide the requested documentation to complete your business verification.',
  },
  [SCENARIO_KEYS.ONBOARDING_IN_REVIEW]: {
    displayName: 'Onboarding - Seller with prefilled data',
    shortName: 'Seller with prefilled data',
    description: 'US LLC (review in progress)',
    clientId: '0030000132',
    scenarioId: 'scenario4',
    category: 'onboarding' as const,
    headerTitle: 'Application Under Review',
    headerDescription:
      "Seller onboarding data is partially prefilled. Please review and complete the remaining information.",
  },
  [SCENARIO_KEYS.FRESH_START]: {
    displayName: 'Linked Bank Account',
    shortName: 'Linked Bank Account',
    description: 'Linked Bank Account',
    clientId: '0030000131',
    scenarioId: 'scenario1',
    category: 'active' as const,
    resetDbScenario: 'empty' as const, // Optional: triggers DB reset with active scenario
    visibleComponents: [
      AVAILABLE_COMPONENTS.ACCOUNTS,
      AVAILABLE_COMPONENTS.LINKED_ACCOUNTS,
    ] as ComponentName[],
    headerTitle: 'Get Started with Your Bank Account',
    headerDescription:
      'Connect your external bank account to start making payments and managing your finances.',
  },
  [SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA]: {
    displayName: 'Seller with Limited DDA',
    shortName: 'Limited DDA',
    description: 'US Sole Proprietor (onboarding completed, fresh seller)',
    clientId: '0030000131',
    scenarioId: 'scenario1',
    category: 'active' as const,
    resetDbScenario: 'active' as const, // Optional: triggers DB reset with active scenario
    visibleComponents: [
      AVAILABLE_COMPONENTS.ACCOUNTS,
      AVAILABLE_COMPONENTS.LINKED_ACCOUNTS,
      AVAILABLE_COMPONENTS.TRANSACTIONS,
    ] as ComponentName[],
    headerTitle: 'Wallet Management',
    headerDescription:
      'Manage your embedded finance wallet, linked accounts, and transactions.',
  },
  [SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA_PAYMENTS]: {
    displayName: 'Seller with Limited DDA Payments',
    shortName: 'Limited DDA Payments',
    description: 'US LLC (established seller with transaction history)',
    clientId: '0030000132',
    scenarioId: 'scenario2',
    category: 'active' as const,
    resetDbScenario: 'active-with-recipients' as const, // Optional: triggers DB reset with recipients scenario
    visibleComponents: [
      AVAILABLE_COMPONENTS.ACCOUNTS,
      AVAILABLE_COMPONENTS.LINKED_ACCOUNTS,
      AVAILABLE_COMPONENTS.TRANSACTIONS,
      AVAILABLE_COMPONENTS.RECIPIENTS,
    ] as ComponentName[],
    headerTitle: 'Wallet Management with Limited DDA Payments account',
    headerDescription:
      'Manage your embedded finance wallet, linked accounts, transactions and recipients.',
  },
} as const;

// Scenario order for cycling
export const SCENARIO_ORDER: ScenarioKey[] = [
  SCENARIO_KEYS.NEW_SELLER_ONBOARDING,
  SCENARIO_KEYS.ONBOARDING_IN_REVIEW,
  SCENARIO_KEYS.ONBOARDING_DOCS_NEEDED,
  SCENARIO_KEYS.FRESH_START,
  SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA,
  SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA_PAYMENTS,
];

// Utility functions
export const getScenarioByKey = (key: ScenarioKey) => {
  return SCENARIOS_CONFIG[key];
};

export const getScenarioByDisplayName = (displayName: string) => {
  return Object.values(SCENARIOS_CONFIG).find(
    (scenario) => scenario.displayName === displayName,
  );
};

export const getScenarioKeyByDisplayName = (
  displayName: string,
): ScenarioKey | undefined => {
  const entry = Object.entries(SCENARIOS_CONFIG).find(
    ([_, config]) => config.displayName === displayName,
  );
  return entry?.[0] as ScenarioKey | undefined;
};

export const getNextScenario = (currentKey: ScenarioKey): ScenarioKey => {
  const currentIndex = SCENARIO_ORDER.indexOf(currentKey);
  const isLastScenario = currentIndex === SCENARIO_ORDER.length - 1;
  return isLastScenario ? SCENARIO_ORDER[0] : SCENARIO_ORDER[currentIndex + 1];
};

export const getScenarioDisplayNames = () => {
  const names = Object.values(SCENARIOS_CONFIG).map(
    (config) => config.displayName,
  );
  return names.length > 0 ? names : ['Active Seller with Direct Payouts']; // Fallback
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

// Utility function to check if a scenario should show recipients
export const shouldShowRecipientsForScenario = (
  scenarioDisplayName: string,
): boolean => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return false; // Fallback for unknown scenarios
  }
  const scenario = SCENARIOS_CONFIG[scenarioKey];
  // Onboarding scenarios don't have visibleComponents, so they can't show recipients
  if (scenario.category === 'onboarding') {
    return false;
  }
  return scenario.visibleComponents.includes(AVAILABLE_COMPONENTS.RECIPIENTS);
};

// Generic utility function to get visible components for a scenario
export const getVisibleComponentsForScenario = (
  scenarioDisplayName: string,
): ComponentName[] => {
  // Safety check for undefined or empty scenario name
  if (!scenarioDisplayName || typeof scenarioDisplayName !== 'string') {
    console.warn(
      'getVisibleComponentsForScenario: Invalid scenario name:',
      scenarioDisplayName,
    );
    return [];
  }

  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    console.warn(
      'getVisibleComponentsForScenario: Unknown scenario:',
      scenarioDisplayName,
    );
    return []; // Fallback for unknown scenarios
  }
  const scenario = SCENARIOS_CONFIG[scenarioKey];
  // Onboarding scenarios don't have visibleComponents, return empty array
  if (scenario.category === 'onboarding') {
    return [];
  }
  return scenario.visibleComponents || [];
};

// Utility function to check if a specific component should be visible for a scenario
export const isComponentVisibleForScenario = (
  scenarioDisplayName: string,
  componentName: ComponentName,
): boolean => {
  const visibleComponents =
    getVisibleComponentsForScenario(scenarioDisplayName);
  return visibleComponents.includes(componentName);
};

// Utility function to check if a scenario has a reset DB scenario
export const hasResetDbScenario = (scenarioDisplayName: string): boolean => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return false;
  }
  const scenario = SCENARIOS_CONFIG[scenarioKey];
  return (
    'resetDbScenario' in scenario &&
    (scenario as any).resetDbScenario !== undefined
  );
};

// Utility function to get the reset DB scenario value
export const getResetDbScenario = (
  scenarioDisplayName: string,
): string | undefined => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return undefined;
  }
  const scenario = SCENARIOS_CONFIG[scenarioKey];
  return (scenario as any).resetDbScenario;
};

// Utility function to get header title for a scenario
export const getHeaderTitleForScenario = (
  scenarioDisplayName: string,
): string => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return 'Wallet Management'; // Fallback
  }
  const scenario = SCENARIOS_CONFIG[scenarioKey];
  return (scenario as any).headerTitle || 'Wallet Management';
};

// Utility function to get header description for a scenario
export const getHeaderDescriptionForScenario = (
  scenarioDisplayName: string,
): string => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return 'Manage your embedded finance wallet, linked accounts, and transactions.'; // Fallback
  }
  const scenario = SCENARIOS_CONFIG[scenarioKey];
  return (
    (scenario as any).headerDescription ||
    'Manage your embedded finance wallet, linked accounts, and transactions.'
  );
};

// Utility function to check if a scenario is the ONBOARDING_DOCS_NEEDED scenario
export const isOnboardingDocsNeededScenario = (
  scenarioDisplayName: string,
): boolean => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return false;
  }
  return scenarioKey === SCENARIO_KEYS.ONBOARDING_DOCS_NEEDED;
};
