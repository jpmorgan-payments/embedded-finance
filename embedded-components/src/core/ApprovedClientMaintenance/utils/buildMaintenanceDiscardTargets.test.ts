import { describe, expect, test } from 'vitest';

import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import { buildMaintenanceDiscardTargets } from './buildMaintenanceDiscardTargets';
import { buildMaintenanceEntityTasks } from './buildMaintenanceEntityTasks';
import { buildMaintenanceProjection } from './buildMaintenanceProjection';

const client: MaintenanceClient = {
  id: 'client-1',
  partyId: 'organization-1',
  status: 'APPROVED',
  updateRequest: { status: 'NEW', requestId: 'request-1' },
  productDetails: [
    {
      product: 'EMBEDDED_PAYMENTS',
      subProduct: 'LIMITED_DDA_PAYMENTS',
      action: 'ADD',
      onboardingStatus: 'NEW',
    },
  ],
  parties: [
    {
      id: 'organization-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: { organizationName: 'Client LLC' },
    },
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      individualDetails: { firstName: 'Jane', lastName: 'Doe' },
    },
  ],
};

const proposal = (
  party: Omit<MaintenanceParty, 'updateRequest'>,
  submittedAt: string
): MaintenanceParty => ({
  ...party,
  updateRequest: {
    status: 'NEW',
    action: party.id === 'organization-1' ? 'MODIFY' : 'ADD',
    requestId: 'request-1',
    submittedAt,
  },
});

describe('buildMaintenanceDiscardTargets', () => {
  test('lists every request target, not only people', () => {
    const projection = buildMaintenanceProjection(client, [
      proposal(
        {
          id: 'organization-1',
          organizationDetails: { dbaName: 'Client Co.' },
        },
        '2026-09-03T10:00:00.000Z'
      ),
      proposal(
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Wendy', lastName: 'Darling' },
        },
        '2026-09-03T10:01:00.000Z'
      ),
      proposal(
        {
          id: 'intermediary-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: { organizationName: 'Holding LLC' },
        },
        '2026-09-03T10:02:00.000Z'
      ),
    ]);
    const entityTasks = buildMaintenanceEntityTasks(client, projection, []);

    expect(
      buildMaintenanceDiscardTargets(projection, entityTasks, 2, {
        product: (product, subProduct) =>
          `Product: ${product}${subProduct ? ` · ${subProduct}` : ''}`,
        business: 'Business profile changes',
        personChange: (name) => `Changes for ${name}`,
        personAddition: (name) => `Add person: ${name}`,
        intermediaryAddition: (name) => `Add intermediary business: ${name}`,
        requiredWork: (count) => `${count} required tasks`,
        notProvided: 'N/A',
      })
    ).toEqual([
      {
        type: 'product',
        label: 'Product: EMBEDDED_PAYMENTS · LIMITED_DDA_PAYMENTS',
      },
      { type: 'business', label: 'Business profile changes' },
      { type: 'person', label: 'Add person: Wendy Darling' },
      {
        type: 'intermediary',
        label: 'Add intermediary business: Holding LLC',
      },
      { type: 'required-work', label: '2 required tasks' },
    ]);
  });
});
