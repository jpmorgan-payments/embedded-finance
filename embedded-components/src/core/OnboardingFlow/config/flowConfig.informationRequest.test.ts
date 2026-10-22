import { describe, expect, test } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import type {
  FlowSessionData,
  SectionScreenConfig,
} from '@/core/OnboardingFlow/types/flow.types';

const getSection = (id: SectionScreenConfig['id']) =>
  flowConfig.screens.find(
    (screen): screen is SectionScreenConfig =>
      screen.isSection && screen.id === id
  )!;

const resolveStatus = (
  id: SectionScreenConfig['id'],
  clientData: ClientResponse,
  sessionData: FlowSessionData = {}
) =>
  getSection(id).sectionConfig.statusResolver!(
    sessionData,
    clientData,
    true,
    {},
    {},
    'overview'
  );

const buildClient = (
  status: ClientResponse['status'],
  outstanding: Partial<ClientResponse['outstanding']> = {}
) =>
  ({
    id: '3000005555',
    partyId: '2000000555',
    products: ['EMBEDDED_PAYMENTS'],
    status,
    parties: [
      {
        id: '2000000555',
        partyType: 'ORGANIZATION',
        roles: ['CLIENT'],
        organizationDetails: { organizationType: 'LIMITED_LIABILITY_COMPANY' },
      },
    ],
    outstanding: {
      questionIds: [],
      documentRequestIds: [],
      attestationDocumentIds: [],
      partyIds: [],
      partyRoles: [],
      ...outstanding,
    },
  }) as ClientResponse;

describe('flowConfig: information request sections', () => {
  test('requested questions section sits before supporting documents', () => {
    const sectionIds = flowConfig.screens
      .filter((screen) => screen.isSection)
      .map((screen) => screen.id);

    expect(sectionIds.indexOf('requested-questions-section')).toBe(
      sectionIds.indexOf('upload-documents-section') - 1
    );
  });

  describe('requested-questions-section', () => {
    test.each(['INFORMATION_REQUESTED', 'APPROVED'] as const)(
      'is ready to start while %s has outstanding questions',
      (status) => {
        expect(
          resolveStatus(
            'requested-questions-section',
            buildClient(status, { questionIds: ['30158'] })
          )
        ).toBe('not_started');
      }
    );

    test('shows as completed after the user answered everything this session', () => {
      expect(
        resolveStatus(
          'requested-questions-section',
          buildClient('INFORMATION_REQUESTED', {
            documentRequestIds: ['68803'],
          }),
          { requestedQuestionsSubmitted: true }
        )
      ).toBe('completed_disabled');
    });

    test('is hidden when the information request has no questions', () => {
      expect(
        resolveStatus(
          'requested-questions-section',
          buildClient('INFORMATION_REQUESTED', {
            documentRequestIds: ['68803'],
          })
        )
      ).toBe('hidden');
    });

    test.each(['NEW', 'REVIEW_IN_PROGRESS', 'DECLINED'] as const)(
      'is hidden for %s clients, even with outstanding questions',
      (status) => {
        expect(
          resolveStatus(
            'requested-questions-section',
            buildClient(status, { questionIds: ['30005'] }),
            { requestedQuestionsSubmitted: true }
          )
        ).toBe('hidden');
      }
    );
  });

  test('operational details stay locked during an information request', () => {
    expect(
      resolveStatus(
        'additional-questions-section',
        buildClient('INFORMATION_REQUESTED', { questionIds: ['30158'] })
      )
    ).toBe('completed_disabled');
  });

  test('supporting documents are still requested alongside questions', () => {
    expect(
      resolveStatus(
        'upload-documents-section',
        buildClient('INFORMATION_REQUESTED', {
          documentRequestIds: ['68803'],
          questionIds: ['30158'],
        })
      )
    ).toBe('not_started');
  });

  test('supporting documents open for an approved client only when requested', () => {
    expect(
      resolveStatus(
        'upload-documents-section',
        buildClient('APPROVED', { documentRequestIds: ['68803'] })
      )
    ).toBe('not_started');
    expect(
      resolveStatus('upload-documents-section', buildClient('APPROVED'))
    ).toBe('hidden');
  });
});
