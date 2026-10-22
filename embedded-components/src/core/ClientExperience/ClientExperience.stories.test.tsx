import { server } from '@/msw/server';
import { composeStories } from '@storybook/react-vite';
import { render, waitFor } from '@testing-library/react';
import type { HttpHandler } from 'msw';
import { describe, expect, test, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import * as stories from './ClientExperience.story';

// The load failure story retries by design; ClientExperience.test.tsx covers it.
const { ClientLoadFailure: _clientLoadFailure, ...routedStories } =
  composeStories(stories);

const expectedKinds: Record<keyof typeof routedStories, string> = {
  OnboardingInProgress: 'onboarding',
  OnboardingUnderReview: 'onboarding',
  ApprovedProfile: 'approved-profile',
  ActiveMaintenanceRequest: 'maintenance',
  UnreviewedPartyRoutesToOnboarding: 'onboarding',
};

describe('ClientExperience stories', () => {
  Object.entries(routedStories).forEach(([storyName, Story]) => {
    test(`${storyName} resolves to ${expectedKinds[storyName as keyof typeof routedStories]}`, async () => {
      server.use(
        ...(Story.parameters as { msw: { handlers: HttpHandler[] } }).msw
          .handlers
      );
      await Story.load();
      const onExperienceResolved = vi.fn();

      render(
        <EBComponentsProvider apiBaseUrl="" clientId={Story.args.clientId}>
          <Story onExperienceResolved={onExperienceResolved} />
        </EBComponentsProvider>
      );

      await waitFor(
        () =>
          expect(onExperienceResolved).toHaveBeenCalledWith(
            expect.objectContaining({
              kind: expectedKinds[storyName as keyof typeof routedStories],
            })
          ),
        { timeout: 5000 }
      );
    });
  });
});
