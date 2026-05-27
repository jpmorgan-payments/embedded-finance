/**
 * Sole proprietorship NEW client — canonical mock shared with demos / MSW fixtures
 * ({@link efClientSolPropNew}).
 */
import { efClientSolPropNew } from '@/mocks/efClientSolPropNew.mock';
import { cloneDeep } from 'lodash';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

export const SOLE_PROP_NEW_CLIENT_ID = efClientSolPropNew.id;

export function createSolePropNewClient(): ClientResponse {
  return cloneDeep(efClientSolPropNew) as ClientResponse;
}
