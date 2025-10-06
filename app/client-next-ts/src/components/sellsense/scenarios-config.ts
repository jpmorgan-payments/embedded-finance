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
  ONBOARDING_FLOW: 'OnboardingFlow',
} as const;

export type ComponentName =
  (typeof AVAILABLE_COMPONENTS)[keyof typeof AVAILABLE_COMPONENTS];

// Component position interface
export interface ComponentPosition {
  x: number; // Row number (0-based)
  y: number; // Column number (0-based)
}

// Component configuration with position
export interface ComponentConfig {
  component: ComponentName;
  position: ComponentPosition;
}

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
    headerTitle: 'Almost there - review and complete',
    headerDescription:
      'Seller onboarding data is partially prefilled. Please review and complete the remaining information.',
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
      {
        component: AVAILABLE_COMPONENTS.ACCOUNTS,
        position: { x: 0, y: 0 }, // Top left
      },
      {
        component: AVAILABLE_COMPONENTS.LINKED_ACCOUNTS,
        position: { x: 0, y: 1 }, // Top right
      },
    ] as ComponentConfig[],
    headerTitle: 'Get Started with Your Bank Account',
    headerDescription:
      'Connect your external bank account to start making payments and managing your finances.',
  },
  [SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA]: {
    displayName: 'Seller with Limited DDA',
    shortName: 'Limited DDA',
    description:
      'US Sole Proprietor with active Limited DDA and transaction history',
    clientId: '0030000131',
    scenarioId: 'scenario1',
    category: 'active' as const,
    resetDbScenario: 'active' as const, // Optional: triggers DB reset with active scenario
    visibleComponents: [
      {
        component: AVAILABLE_COMPONENTS.ACCOUNTS,
        position: { x: 0, y: 0 }, // Top left
      },
      {
        component: AVAILABLE_COMPONENTS.LINKED_ACCOUNTS,
        position: { x: 0, y: 1 }, // Top right
      },
      {
        component: AVAILABLE_COMPONENTS.TRANSACTIONS,
        position: { x: 1, y: 0 }, // Bottom left (spans both columns)
      },
    ] as ComponentConfig[],
    headerTitle: 'Seller with Limited DDA',
    headerDescription:
      'Manage your embedded finance wallet, linked accounts, and transactions.',
  },
  [SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA_PAYMENTS]: {
    displayName: 'Seller with Payments DDA',
    shortName: 'Payments DDA',
    description:
      'US LLC with the active Payments DDA account and transaction history',
    clientId: '0030000132',
    scenarioId: 'scenario2',
    category: 'active' as const,
    resetDbScenario: 'active-with-recipients' as const, // Optional: triggers DB reset with recipients scenario
    visibleComponents: [
      {
        component: AVAILABLE_COMPONENTS.ACCOUNTS,
        position: { x: 0, y: 0 }, // Top left
      },
      {
        component: AVAILABLE_COMPONENTS.LINKED_ACCOUNTS,
        position: { x: 0, y: 1 }, // Top right
      },
      {
        component: AVAILABLE_COMPONENTS.TRANSACTIONS,
        position: { x: 1, y: 1 }, // Bottom right
      },
      {
        component: AVAILABLE_COMPONENTS.RECIPIENTS,
        position: { x: 1, y: 0 }, // Bottom left
      },
    ] as ComponentConfig[],
    headerTitle: 'Payments DDA Account',
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
  const visibleComponents = (scenario as any).visibleComponents || [];
  return visibleComponents.some(
    (config: ComponentConfig) =>
      config.component === AVAILABLE_COMPONENTS.RECIPIENTS,
  );
};

// Enhanced utility function to get visible components with positions for a scenario
export const getVisibleComponentsForScenario = (
  scenarioDisplayName: string,
): ComponentConfig[] => {
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
  return (scenario as any).visibleComponents || [];
};

// Utility function to get just component names (for backward compatibility)
export const getVisibleComponentNamesForScenario = (
  scenarioDisplayName: string,
): ComponentName[] => {
  const componentConfigs = getVisibleComponentsForScenario(scenarioDisplayName);
  return componentConfigs.map((config) => config.component);
};

// Utility function to check if a specific component should be visible for a scenario
export const isComponentVisibleForScenario = (
  scenarioDisplayName: string,
  componentName: ComponentName,
): boolean => {
  const visibleComponents =
    getVisibleComponentsForScenario(scenarioDisplayName);
  return visibleComponents.some((config) => config.component === componentName);
};

// Utility function to get component position for a scenario
export const getComponentPosition = (
  scenarioDisplayName: string,
  componentName: ComponentName,
): ComponentPosition | null => {
  const visibleComponents =
    getVisibleComponentsForScenario(scenarioDisplayName);
  const componentConfig = visibleComponents.find(
    (config) => config.component === componentName,
  );
  return componentConfig?.position || null;
};

// Utility function to get grid dimensions for a scenario
export const getGridDimensions = (
  scenarioDisplayName: string,
): { maxRows: number; maxColumns: number } => {
  const visibleComponents =
    getVisibleComponentsForScenario(scenarioDisplayName);

  if (visibleComponents.length === 0) {
    return { maxRows: 0, maxColumns: 0 };
  }

  const maxRows =
    Math.max(...visibleComponents.map((config) => config.position.x)) + 1;
  const maxColumns =
    Math.max(...visibleComponents.map((config) => config.position.y)) + 1;

  return { maxRows, maxColumns };
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

// Utility function to get scenario number (1-based index from SCENARIO_ORDER)
export const getScenarioNumber = (scenarioDisplayName: string): number => {
  const scenarioKey = getScenarioKeyByDisplayName(scenarioDisplayName);
  if (!scenarioKey) {
    return 1; // Fallback to 1 for unknown scenarios
  }
  const index = SCENARIO_ORDER.indexOf(scenarioKey);
  return index >= 0 ? index + 1 : 1; // 1-based numbering
};
