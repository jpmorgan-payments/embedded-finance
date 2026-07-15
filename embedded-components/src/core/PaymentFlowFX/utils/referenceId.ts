/**
 * Transaction reference id generation (parity with PaymentFlow's private helper).
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique transaction reference id: `PHUI_` + a uuid with dashes
 * stripped, truncated to the API max of 35 chars. Matches the pattern
 * `[_0-9A-Za-z]+`.
 */
export function generateTransactionReferenceId(): string {
  const raw = `PHUI_${uuidv4().replace(/-/g, '')}`;
  return raw.slice(0, 35);
}
