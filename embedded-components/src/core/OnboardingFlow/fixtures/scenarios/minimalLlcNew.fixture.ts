/**
 * Sparse org-only LLC `ClientResponse` for Vitest scenarios that seed MSW `GET /clients/:id`.
 * RTL-only minimum shape (no Storybook twin yet); mirrors the spirit of minimum POST /clients payloads.
 */
import {
  ClientStatus,
  type ClientResponse,
} from '@/api/generated/smbdo.schemas';

/** Stable id for this suite — distinct from Storybook `DEFAULT_CLIENT_ID` and bad-API seeds. */
export const MINIMAL_LLC_NEW_CLIENT_ID = '0091000101';

/**
 * Minimal US LLC created with sparse organization party data.
 * Outstanding IDs mirror typical NEW onboarding follow-ups from MSW client creation handlers.
 */
export function createMinimalLlcNewClient(): ClientResponse {
  return {
    id: MINIMAL_LLC_NEW_CLIENT_ID,
    status: ClientStatus.NEW,
    partyId: '2910000111',
    parties: [
      {
        id: '2910000111',
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
        profileStatus: 'NEW',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        email: 'minimal@example.com',
        externalId: 'MIN-LLC-SEED',
        organizationDetails: {
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          organizationName: 'Minimal LLC Seed',
          countryOfFormation: 'US',
          jurisdiction: 'US',
        },
      },
    ],
    products: ['EMBEDDED_PAYMENTS'],
    outstanding: {
      documentRequestIds: [],
      questionIds: ['30005', '30026', '30088', '30095'],
      attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
      partyIds: [],
      partyRoles: [],
    },
    questionResponses: [],
    results: {
      customerIdentityStatus: 'NOT_STARTED',
    },
  };
}
