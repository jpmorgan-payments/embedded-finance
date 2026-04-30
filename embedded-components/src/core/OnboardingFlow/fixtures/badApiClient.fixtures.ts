/**
 * Shared mock clients for Storybook **Bad API Data** stories and Vitest parity tests.
 */
import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import { cloneDeep } from 'lodash';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { DEFAULT_CLIENT_ID, mockClientNew } from '../stories/story-utils';

/**
 * Sole proprietorship where the controller's address country differs
 * from their countryOfResidence (Storybook: MismatchedAddressCountry).
 */
export function createMockClientMismatchedAddressCountry(): ClientResponse {
  const mock = cloneDeep(efClientSolPropWithMoreData);
  mock.id = DEFAULT_CLIENT_ID;
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as {
    individualDetails?: Record<string, unknown>;
  };

  if (controller?.individualDetails) {
    controller.individualDetails.countryOfResidence = 'US';
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['100 King Street West'],
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5X 1A1',
        country: 'CA',
      },
    ];
  }
  return mock;
}

/** Controller SSN too short (Storybook: InvalidSSN). */
export function createMockClientInvalidSSN(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as { individualDetails?: Record<string, unknown> };

  if (controller?.individualDetails) {
    controller.individualDetails.individualIds = [
      {
        idType: 'SSN',
        issuer: 'US',
        value: '123',
      },
    ];
  }
  return mock;
}

/** Organization EIN uses invalid prefix e.g. 91-xx-xxxxx (Storybook: InvalidEIN). */
export function createMockClientInvalidEIN(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const org = mock.parties?.find(
    (p) => (p as { partyType?: string }).partyType === 'ORGANIZATION'
  ) as { organizationDetails?: Record<string, unknown> };

  if (org?.organizationDetails) {
    org.organizationDetails.organizationIds = [
      {
        idType: 'EIN',
        issuer: 'US',
        value: '914316140',
      },
    ];
  }
  return mock;
}

/** Invalid US postal code (Storybook: InvalidPostalCode). */
export function createMockClientInvalidPostalCode(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as { individualDetails?: Record<string, unknown> };

  if (controller?.individualDetails) {
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['2029 Century Park E'],
        city: 'Los Angeles',
        state: 'CA',
        postalCode: 'ABCDE',
        country: 'US',
      },
    ];
  }
  return mock;
}

/** Invalid US state subdivision code (Storybook: InvalidStateCode). */
export function createMockClientInvalidState(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as { individualDetails?: Record<string, unknown> };

  if (controller?.individualDetails) {
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['2029 Century Park E'],
        city: 'Los Angeles',
        state: 'ZZ',
        postalCode: '90067',
        country: 'US',
      },
    ];
  }
  return mock;
}

/** Combined bad-data scenario (Storybook: MultipleDataIssues). */
export function createMockClientMultipleIssues(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as { individualDetails?: Record<string, unknown> };
  const org = mock.parties?.find(
    (p) => (p as { partyType?: string }).partyType === 'ORGANIZATION'
  ) as { organizationDetails?: Record<string, unknown> };

  if (controller?.individualDetails) {
    controller.individualDetails.countryOfResidence = 'US';
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['100 King Street West'],
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5X 1A1',
        country: 'CA',
      },
    ];
    controller.individualDetails.individualIds = [
      {
        idType: 'SSN',
        issuer: 'US',
        value: '123',
      },
    ];
  }

  if (org?.organizationDetails) {
    org.organizationDetails.organizationIds = [
      {
        idType: 'EIN',
        issuer: 'US',
        value: '12',
      },
    ];
  }

  return mock;
}

/** Job title not in enum (Storybook: InvalidJobTitle). */
export function createMockClientInvalidJobTitle(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as { individualDetails?: Record<string, unknown> };

  if (controller?.individualDetails) {
    controller.individualDetails.jobTitle = 'Associate';
    controller.individualDetails.jobTitleDescription = '';
  }
  return mock;
}

/** Valid COO + description (Storybook: COOWithDescription). */
export function createMockClientCOOWithDescription(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as { roles?: string[] }).roles?.includes('CONTROLLER')
  ) as { individualDetails?: Record<string, unknown> };

  if (controller?.individualDetails) {
    controller.individualDetails.jobTitle = 'COO';
    controller.individualDetails.jobTitleDescription = 'Top Dog';
  }
  return mock;
}
