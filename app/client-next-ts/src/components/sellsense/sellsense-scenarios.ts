import {
  getScenarioDisplayNames,
  SCENARIOS_CONFIG,
  type ScenarioKey,
} from './scenarios-config';

// Legacy type for backward compatibility - will be removed after migration
// Note: This type is now derived from the centralized configuration
export type ClientScenario = ReturnType<typeof getScenarioDisplayNames>[number];

// Mapping SellSense client scenarios to onboarding scenario data
// This is now derived from the centralized configuration
export const sellSenseScenarioMapping = Object.fromEntries(
  Object.entries(SCENARIOS_CONFIG).map(([, config]) => [
    config.displayName,
    {
      clientId: config.clientId,
      description: config.description,
      scenarioId: config.scenarioId,
    },
  ])
) as Record<
  ClientScenario,
  {
    clientId: string | undefined;
    description: string;
    scenarioId: string;
  }
>;

export const getScenarioData = (scenario: ClientScenario) => {
  return sellSenseScenarioMapping[scenario];
};

export const getClientIdFromScenario = (
  scenario: ClientScenario
): string | undefined => {
  return sellSenseScenarioMapping[scenario]?.clientId;
};

// New functions using ScenarioKey
export const getScenarioDataByKey = (scenarioKey: ScenarioKey) => {
  return SCENARIOS_CONFIG[scenarioKey];
};

export const getClientIdFromScenarioKey = (
  scenarioKey: ScenarioKey
): string | undefined => {
  return SCENARIOS_CONFIG[scenarioKey].clientId;
};
