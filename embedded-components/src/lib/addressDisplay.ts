import { usesPlaceholderPostalCode } from './addressCountryRules';

export function getAddressDisplayLocationParts(address: {
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string[] {
  return [
    address.city,
    address.country === 'HK' && address.state === 'HK'
      ? undefined
      : address.state,
    usesPlaceholderPostalCode(address.country) && address.postalCode === 'n/a'
      ? undefined
      : address.postalCode,
  ].filter((part): part is string => Boolean(part));
}
