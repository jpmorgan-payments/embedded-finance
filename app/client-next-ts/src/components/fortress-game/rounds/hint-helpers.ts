// =============================================================================
// Helpers for context-aware hints — small readers over the player's raw payload,
// which may be half-edited and any shape at all.
// =============================================================================

import { getPersonaClient } from '../data/personas';
import type { HintContext, OrganizationDetails } from '../types';

type Json = Record<string, unknown>;

/** Reads a dot path, tolerating anything missing or of the wrong type along the way. */
export function at(payload: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Json)[key];
  }, payload);
}

export function str(payload: unknown, path: string): string | undefined {
  const value = at(payload, path);
  return typeof value === 'string' ? value : undefined;
}

export function isMissing(payload: unknown, path: string): boolean {
  const value = at(payload, path);
  return value === undefined || value === null || value === '' || value === '__FILL_ME__';
}

export function arr(payload: unknown, path: string): unknown[] {
  const value = at(payload, path);
  return Array.isArray(value) ? value : [];
}

/** The party carrying the CLIENT role — where all the organization data belongs. */
export function clientParty(payload: unknown): Json | undefined {
  const parties = Array.isArray((payload as Json)?.parties) ? ((payload as Json).parties as unknown[]) : [];
  return parties.find(
    (p): p is Json =>
      typeof p === 'object' && p !== null && Array.isArray((p as Json).roles) && ((p as Json).roles as unknown[]).includes('CLIENT')
  );
}

export function orgAddresses(payload: unknown): Json[] {
  const party = clientParty(payload);
  const addresses = at(party, 'organizationDetails.addresses');
  return Array.isArray(addresses) ? (addresses.filter((a) => typeof a === 'object' && a !== null) as Json[]) : [];
}

/** Flattens an address to one lowercase string so a hint can look for a known tenant. */
export function addressText(address: Json): string {
  const lines = Array.isArray(address.addressLines) ? address.addressLines.join(' ') : '';
  return [lines, address.city, address.state, address.postalCode].filter(Boolean).join(' ').toLowerCase();
}

/**
 * Rewrites one part of the CLIENT party's organizationDetails from the verified persona
 * record, leaving every other edit the player made in place.
 */
export function patchClientOrg(
  payload: Json,
  ctx: HintContext,
  patch: (current: Json, source: OrganizationDetails) => Json
): unknown[] {
  const source = getPersonaClient(ctx.persona);
  const sourceOrg = source.parties.find((p) => p.roles.includes('CLIENT'))?.organizationDetails;
  const parties = Array.isArray(payload.parties) ? payload.parties : source.parties;
  if (!sourceOrg) return parties;

  return parties.map((party) => {
    if (typeof party !== 'object' || party === null) return party;
    const record = party as Json;
    if (!Array.isArray(record.roles) || !record.roles.includes('CLIENT')) return party;
    const current = typeof record.organizationDetails === 'object' && record.organizationDetails !== null
      ? (record.organizationDetails as Json)
      : {};
    return { ...record, organizationDetails: patch(current, sourceOrg) };
  });
}
