/**
 * Integration: OnboardingFlow with rich LLC NEW seeded `GET /clients/:id`
 * (Storybook parity: same payload as `mockClientNew` in `story-utils.tsx`).
 *
 * Fixture: `createLlcCorpRichNewClient`.
 */
import { server } from '@/msw/server';
import { beforeEach, describe, expect, test } from 'vitest';
import { screen, userEvent } from '@test-utils';

import {
  createLlcCorpRichNewClient,
  LLC_CORP_RICH_NEW_SEEDED_CLIENT_ID,
} from '@/core/OnboardingFlow/fixtures/scenarios/llcCorpRichNew.fixture';
import {
  assertSeededLegalNameVisibleInBusinessSection,
  renderSeededOnboardingFlow,
  setupSeededOnboardingScenarioHooks,
  waitForOverview,
} from '@/core/OnboardingFlow/onboardingSeededScenarioTestUtils';
import { resetAndSeedClient } from '@/core/OnboardingFlow/stories/story-utils';

describe('OnboardingFlow seeded GET — LLC corp rich NEW', () => {
  setupSeededOnboardingScenarioHooks(server);

  beforeEach(() => {
    resetAndSeedClient(
      createLlcCorpRichNewClient(),
      LLC_CORP_RICH_NEW_SEEDED_CLIENT_ID
    );
  });

  test('skips gateway; Owners section visible; Business identity shows seeded legal name', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSeededOnboardingFlow(LLC_CORP_RICH_NEW_SEEDED_CLIENT_ID);
    await waitForOverview();

    expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('business-section-button'));

    await assertSeededLegalNameVisibleInBusinessSection('Neverland Books');
  });
});
