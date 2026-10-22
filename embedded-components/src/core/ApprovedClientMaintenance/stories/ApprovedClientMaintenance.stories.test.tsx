import { server } from '@/msw/server';
import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import type { HttpHandler } from 'msw';
import { describe, expect, test } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import * as EligibilityMatrix from './ApprovedClientMaintenance.EligibilityMatrix.story';
import * as Controllers from './client-profiles/ApprovedClientMaintenance.Controllers.story';
import * as OrganizationsAndProducts from './client-profiles/ApprovedClientMaintenance.OrganizationsAndProducts.story';
import * as OwnershipStructures from './client-profiles/ApprovedClientMaintenance.OwnershipStructures.story';
import * as DataAndApi from './edge-cases/ApprovedClientMaintenance.DataAndApi.story';
import * as OutstandingInformation from './edge-cases/ApprovedClientMaintenance.OutstandingInformation.story';
import * as DraftChanges from './maintenance-requests/ApprovedClientMaintenance.DraftChanges.story';
import * as OutstandingQuestions from './maintenance-requests/ApprovedClientMaintenance.OutstandingQuestions.story';
import * as Statuses from './maintenance-requests/ApprovedClientMaintenance.Statuses.story';

// The client load failure story retries by design; the component tests cover it.
const { ClientLoadFailure: _clientLoadFailure, ...dataAndApiStories } =
  composeStories(DataAndApi);

const storyGroups = {
  EligibilityMatrix: composeStories(EligibilityMatrix),
  Controllers: composeStories(Controllers),
  OwnershipStructures: composeStories(OwnershipStructures),
  OrganizationsAndProducts: composeStories(OrganizationsAndProducts),
  Statuses: composeStories(Statuses),
  DraftChanges: composeStories(DraftChanges),
  OutstandingQuestions: composeStories(OutstandingQuestions),
  OutstandingInformation: composeStories(OutstandingInformation),
  DataAndApi: dataAndApiStories,
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
          expect(
            screen.queryByText('These changes cannot be reviewed')
          ).not.toBeInTheDocument();
        });
      });
    });
  });
});
