import { createContext, useContext } from 'react';

import type { PartyResponse } from '@/api/generated/smbdo.schemas';

/**
 * The party a group of onboarding fields belongs to. The `readonlyFields` prop
 * uses it to decide `whenPopulated` locks from that party's own saved values,
 * and to lock individual-party fields (e.g. `controllerEmail`) only for the
 * controller — the controller and owner forms share those field names.
 */
export type ReadonlyFieldsScope = {
  /** Party being edited; `undefined` while it is still being created. */
  party: PartyResponse | undefined;
  /** Whether the fields belong to the client's controller. */
  isController: boolean;
};

/**
 * `null` (no provider) means the fields belong to the client itself — its
 * organization and controller — e.g. on the gateway screen.
 */
export const ReadonlyFieldsScopeContext =
  createContext<ReadonlyFieldsScope | null>(null);

export const useReadonlyFieldsScope = (): ReadonlyFieldsScope | null =>
  useContext(ReadonlyFieldsScopeContext);
