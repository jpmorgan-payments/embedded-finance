/**
 * Normalizes routing information from either the current (V1) or future (V2)
 * Accounts API shape into a consistent format for the UI.
 *
 * V1 (ep-accounts 1.x):  { type: 'ABA', value: '028000024' }
 * V2 (ep-accounts 2.x):  { routingCodeType: 'ABA', routingNumber: '028000024', transactionType: 'ACH' }
 *
 * All fields are optional so RoutingInformationDto (V1 generated type) is
 * structurally assignable — no cast needed at the call site.
 */

/**
 * Superset of V1 and V2 routing entry fields.
 *
 * Because every field is optional, the V1 generated type (`RoutingInformationDto`)
 * is assignable to this interface, so callers can pass the API response directly.
 */
export interface ApiRoutingEntry {
  /** V1 – routing code type (e.g. 'ABA') */
  type?: string;
  /** V1 – routing number */
  value?: string;
  /** V2 – routing code type (e.g. 'ABA') */
  routingCodeType?: string;
  /** V2 – routing number */
  routingNumber?: string;
  /** V2 – transaction type (e.g. 'ACH', 'WIRE', 'RTP') */
  transactionType?: string;
}

/** Normalized routing entry for UI consumption. */
export interface NormalizedRoutingEntry {
  /** Routing code type (e.g. 'ABA') */
  routingCodeType: string;
  /** Routing number (e.g. '028000024') */
  routingNumber: string;
  /** Transaction type (e.g. 'ACH') — inferred from routingCodeType when not explicit */
  transactionType?: string;
}

/**
 * Known routing-code-type → default transaction-type mapping.
 *
 * V1 responses don't include transactionType, so we infer it from the
 * routing code type.  ABA routing numbers are used for ACH, which is the
 * only code type in the current API.  This map is easy to extend if new
 * code types are introduced.
 */
const ROUTING_CODE_DEFAULT_TRANSACTION_TYPE: Record<string, string> = {
  ABA: 'ACH',
};

/**
 * Normalize the `routingInformation` array from an Accounts API response.
 *
 * Handles V1-shaped, V2-shaped, or mixed entries. V2 fields take precedence
 * when both are present. Malformed entries (missing code type or number) are
 * silently dropped.
 *
 * When `transactionType` is absent (V1), it is inferred from
 * `ROUTING_CODE_DEFAULT_TRANSACTION_TYPE` so the UI can show "ACH Routing
 * Number" regardless of which API version responded.
 */
export function normalizeRoutingInformation(
  entries?: ApiRoutingEntry[]
): NormalizedRoutingEntry[] {
  if (!entries?.length) return [];

  return entries.reduce<NormalizedRoutingEntry[]>((acc, entry) => {
    const routingCodeType = entry.routingCodeType ?? entry.type;
    const routingNumber = entry.routingNumber ?? entry.value;

    if (routingCodeType && routingNumber) {
      acc.push({
        routingCodeType,
        routingNumber,
        transactionType:
          entry.transactionType ??
          ROUTING_CODE_DEFAULT_TRANSACTION_TYPE[routingCodeType],
      });
    }
    return acc;
  }, []);
}
