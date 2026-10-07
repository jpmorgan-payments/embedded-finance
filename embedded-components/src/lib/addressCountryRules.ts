export function usesPlaceholderPostalCode(
  country: string | undefined
): boolean {
  return country === 'HK' || country === 'AE' || country === 'QA';
}
