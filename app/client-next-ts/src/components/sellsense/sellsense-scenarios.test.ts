import { describe, expect, it } from 'vitest';

import {
  getClientIdFromScenario,
  getScenarioData,
} from './sellsense-scenarios';

describe('SellSense Scenarios', () => {
  it('should return client ID for New Seller - Onboarding scenario', () => {
    const clientId = getClientIdFromScenario('New Seller - Onboarding');
    expect(clientId).toBeUndefined(); // This scenario has no clientId
  });

  it('should return client ID for Linked Bank Account scenario', () => {
    const clientId = getClientIdFromScenario('Linked Bank Account');
    expect(clientId).toBe('0030000131');
  });

  it('should return client ID for Onboarding - Seller with prefilled data scenario', () => {
    const clientId = getClientIdFromScenario(
      'Onboarding - Seller with prefilled data'
    );
    expect(clientId).toBe('0030000132');
  });

  it('should return client ID for Onboarding - Docs Needed scenario', () => {
    const clientId = getClientIdFromScenario('Onboarding - Docs Needed');
    expect(clientId).toBe('0030000133');
  });

  it('should return client ID for Seller with Limited DDA scenario', () => {
    const clientId = getClientIdFromScenario('Seller with Limited DDA');
    expect(clientId).toBe('0030000131');
  });

  it('should return client ID for Seller with Payments DDA scenario', () => {
    const clientId = getClientIdFromScenario('Seller with Payments DDA');
    expect(clientId).toBe('0030000132');
  });

  it('should return undefined for unknown scenario', () => {
    const clientId = getClientIdFromScenario('Unknown Scenario' as any);
    expect(clientId).toBeUndefined();
  });

  it('should return scenario data for New Seller - Onboarding scenario', () => {
    const data = getScenarioData('New Seller - Onboarding');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('clientId');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('scenarioId');
    expect(data.clientId).toBeUndefined(); // This scenario has no clientId
  });

  it('should return scenario data for Linked Bank Account scenario', () => {
    const data = getScenarioData('Linked Bank Account');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('clientId');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('scenarioId');
    expect(data.clientId).toBe('0030000131');
  });

  it('should return scenario data for Onboarding - Seller with prefilled data scenario', () => {
    const data = getScenarioData('Onboarding - Seller with prefilled data');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('clientId');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('scenarioId');
    expect(data.clientId).toBe('0030000132');
  });

  it('should return scenario data for Onboarding - Docs Needed scenario', () => {
    const data = getScenarioData('Onboarding - Docs Needed');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('clientId');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('scenarioId');
    expect(data.clientId).toBe('0030000133');
  });

  it('should return scenario data for Seller with Limited DDA scenario', () => {
    const data = getScenarioData('Seller with Limited DDA');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('clientId');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('scenarioId');
    expect(data.clientId).toBe('0030000131');
  });

  it('should return scenario data for Seller with Payments DDA scenario', () => {
    const data = getScenarioData('Seller with Payments DDA');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('clientId');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('scenarioId');
    expect(data.clientId).toBe('0030000132');
  });

  it('should return undefined for unknown scenario', () => {
    const data = getScenarioData('Unknown Scenario' as any);
    expect(data).toBeUndefined();
  });

  it('should have consistent client IDs between functions', () => {
    const scenarios = [
      'New Seller - Onboarding',
      'Linked Bank Account',
      'Onboarding - Seller with prefilled data',
      'Onboarding - Docs Needed',
      'Seller with Limited DDA',
      'Seller with Payments DDA',
    ] as const;

    scenarios.forEach((scenario) => {
      const clientId = getClientIdFromScenario(scenario);
      const data = getScenarioData(scenario);

      expect(data).toBeDefined();
      expect(data?.clientId).toBe(clientId);
    });
  });
});
