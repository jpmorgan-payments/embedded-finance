/**
 * Integration: OnboardingFlow with minimal LLC NEW seeded `GET /clients/:id`.
 *
 * Fixture: `createMinimalLlcNewClient`.
 */
import { i18n } from '@/i18n/config';
import { server } from '@/msw/server';
import { beforeEach, describe, expect, test } from 'vitest';
import { screen, userEvent } from '@test-utils';

import {
  createMinimalLlcNewClient,
  MINIMAL_LLC_NEW_CLIENT_ID,
} from '@/core/OnboardingFlow/fixtures/scenarios/minimalLlcNew.fixture';
import {
  assertSeededLegalNameVisibleInBusinessSection,
  renderSeededOnboardingFlow,
  setupSeededOnboardingScenarioHooks,
  waitForOverview,
} from '@/core/OnboardingFlow/onboardingSeededScenarioTestUtils';
import { resetAndSeedClient } from '@/core/OnboardingFlow/stories/story-utils';

describe('OnboardingFlow seeded GET — minimal LLC NEW', () => {
  setupSeededOnboardingScenarioHooks(server);

  beforeEach(() => {
    resetAndSeedClient(createMinimalLlcNewClient(), MINIMAL_LLC_NEW_CLIENT_ID);
  });

  test('skips gateway; Overview shows LLC type; Business identity carries seeded legal name', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSeededOnboardingFlow(MINIMAL_LLC_NEW_CLIENT_ID);
    await waitForOverview();

    expect(
      screen.queryByText(/Let's help you get started/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        i18n.t(
          'onboarding-overview:organizationTypes.LIMITED_LIABILITY_COMPANY'
        )
      )
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('business-section-button'));

    await assertSeededLegalNameVisibleInBusinessSection('Minimal LLC Seed');
  });
});
