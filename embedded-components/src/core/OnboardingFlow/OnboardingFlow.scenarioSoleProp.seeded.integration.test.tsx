/**
 * Integration: OnboardingFlow with sole proprietorship NEW seeded `GET /clients/:id`.
 *
 * Fixture: `createSolePropNewClient` (`efClientSolPropNew.mock.ts`).
 */
import { i18n } from '@/i18n/config';
import { server } from '@/msw/server';
import { beforeEach, describe, expect, test } from 'vitest';
import { screen, userEvent } from '@test-utils';

import {
  createSolePropNewClient,
  SOLE_PROP_NEW_CLIENT_ID,
} from '@/core/OnboardingFlow/fixtures/scenarios/solePropNew.fixture';
import {
  assertSeededLegalNameVisibleInBusinessSection,
  renderSeededOnboardingFlow,
  setupSeededOnboardingScenarioHooks,
  waitForOverview,
} from '@/core/OnboardingFlow/onboardingSeededScenarioTestUtils';
import { resetAndSeedClient } from '@/core/OnboardingFlow/stories/story-utils';

describe('OnboardingFlow seeded GET — sole proprietorship NEW', () => {
  setupSeededOnboardingScenarioHooks(server);

  beforeEach(() => {
    resetAndSeedClient(createSolePropNewClient(), SOLE_PROP_NEW_CLIENT_ID);
  });

  test('skips gateway; Overview shows sole prop type; Business identity carries owner legal name seed', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSeededOnboardingFlow(SOLE_PROP_NEW_CLIENT_ID);
    await waitForOverview();

    expect(
      screen.getByText(
        i18n.t('onboarding-overview:organizationTypes.SOLE_PROPRIETORSHIP')
      )
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('business-section-button'));

    await assertSeededLegalNameVisibleInBusinessSection('Monica Gellar');
  });
});
