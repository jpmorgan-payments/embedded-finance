/**
 * Rich LLC NEW client for Vitest — same parties / status / outstanding as Storybook
 * {@link mockClientNew} (`DEFAULT_CLIENT_ID`). Id is overridden so this file can run in parallel
 * with suites that also seed MSW `db` (e.g. bad-API scenarios on `DEFAULT_CLIENT_ID`).
 */
import { cloneDeep } from 'lodash';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { mockClientNew } from '@/core/OnboardingFlow/stories/story-utils';

/** Isolated Vitest seed id; payload matches showcase Storybook NEW corp mock. */
export const LLC_CORP_RICH_NEW_SEEDED_CLIENT_ID = '0091000102';

export function createLlcCorpRichNewClient(): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = LLC_CORP_RICH_NEW_SEEDED_CLIENT_ID;
  return client;
}
