import { server } from '@/msw/server';
import { composeStories } from '@storybook/react-vite';
import { render, waitFor } from '@testing-library/react';
import type { HttpHandler } from 'msw';
import { describe, expect, test, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import * as approvedProfileStories from './stories/ClientExperience.ApprovedProfile.story';
import * as maintenanceStories from './stories/ClientExperience.Maintenance.story';
import * as onboardingStories from './stories/ClientExperience.Onboarding.story';

// Loading and error stories never resolve a route; ClientExperience.test.tsx covers them.
const groups = [
  {
    stories: composeStories(onboardingStories),
    expected: () => ({ kind: 'onboarding' }),
  },
  {
    stories: composeStories(approvedProfileStories),
    expected: (storyName: string) => ({
      kind: 'approved-profile',
      hasMaintenanceHistory: storyName.startsWith('After'),
    }),
  },
  {
    stories: composeStories(maintenanceStories),
    expected: () => ({ kind: 'maintenance' }),
  },
];

describe('ClientExperience stories', () => {
  groups.forEach(({ stories, expected }) => {
    Object.entries(stories).forEach(([storyName, Story]) => {
      test(`${storyName} resolves to ${expected(storyName).kind}`, async () => {
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
              expected(storyName)
            ),
          { timeout: 5000 }
        );
      });
    });
  });
});
