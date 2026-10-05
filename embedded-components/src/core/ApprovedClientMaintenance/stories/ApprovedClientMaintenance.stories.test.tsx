import { server } from '@/msw/server';
import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import type { HttpHandler } from 'msw';
import { describe, expect, test } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import * as ClientProfiles from './ApprovedClientMaintenance.ClientProfiles.story';
import * as EligibilityMatrix from './ApprovedClientMaintenance.EligibilityMatrix.story';
import * as RequestStatuses from './ApprovedClientMaintenance.RequestStatuses.story';
import * as OutstandingInformation from './edge-cases/ApprovedClientMaintenance.OutstandingInformation.story';

// The client load failure story retries by design; the component tests cover it.
const storyGroups = {
  EligibilityMatrix: composeStories(EligibilityMatrix),
  ClientProfiles: composeStories(ClientProfiles),
  RequestStatuses: composeStories(RequestStatuses),
  OutstandingInformation: composeStories(OutstandingInformation),
};

describe('ApprovedClientMaintenance stories', () => {
  Object.entries(storyGroups).forEach(([groupName, stories]) => {
    describe(groupName, () => {
      Object.entries(stories).forEach(([storyName, Story]) => {
        test(`${storyName} loads its mocked client`, async () => {
          const handlers = (
            Story.parameters as { msw?: { handlers?: HttpHandler[] } }
          ).msw?.handlers;
          expect(handlers?.length).toBeGreaterThan(0);
          server.use(...handlers!);

          render(
            <EBComponentsProvider apiBaseUrl="" clientId={Story.args.clientId}>
              <Story />
            </EBComponentsProvider>
          );

          expect(
            await screen.findByRole(
              'heading',
              { level: 2, name: 'Business profile' },
              { timeout: 5000 }
            )
          ).toBeInTheDocument();
        });
      });
    });
  });
});
