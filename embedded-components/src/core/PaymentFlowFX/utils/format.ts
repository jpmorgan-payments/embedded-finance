/**
 * FX display formatting helpers.
 */
import {
  CURRENCY_TO_COUNTRY,
  SUPPORTED_TARGET_CURRENCIES,
} from '../PaymentFlowFX.constants';

/**
 * Format an amount in the given currency using `Intl.NumberFormat`, which applies
 * the correct minor units per currency (e.g. 0 for JPY/KRW/VND). Falls back to a
 * plain number + code when the currency is not recognised by the runtime.
 */
export function formatTargetCurrency(
  value: number,
  currency: string,
  locale = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Convert an ISO 4217 currency code into a flag emoji derived from its default
 * country (§FR-FX-2). Returns an empty string when unknown.
 */
export function currencyToFlag(currency?: string): string {
  if (!currency) return '';
  const country = CURRENCY_TO_COUNTRY[currency];
  if (!country || country.length !== 2 || country === 'EU') {
    // EU has no single flag codepoint pair; skip.
    return '';
  }
  const codePoints = country
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

/**
 * Is the given currency a non-USD, FX-eligible target currency?
 * A payee is "FX" when its account currency is set and not USD.
 */
export function isFxCurrency(
  currency: string | undefined,
  supported: string[] = SUPPORTED_TARGET_CURRENCIES
): boolean {
  return !!currency && currency !== 'USD' && supported.includes(currency);
}
