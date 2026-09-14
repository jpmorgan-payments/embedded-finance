const INVALID_EIN_VALUES = new Set([
  '000000000',
  '111111111',
  '222222222',
  '333333333',
  '444444444',
  '555555555',
  '666666666',
  '777777777',
  '888888888',
  '999999999',
  '123456789',
  '987654321',
  '012345678',
]);

export function isValidEin(value: string): boolean {
  return getEinValidationIssue(value) === undefined;
}

export function getEinValidationIssue(
  value: string
): 'required' | 'length' | 'digitsOnly' | 'invalidValue' | undefined {
  const normalizedValue = value.replace(/[\s-]/g, '');
  if (!normalizedValue) return 'required';
  if (normalizedValue.length !== 9) return 'length';
  if (!/^\d{9}$/.test(normalizedValue)) return 'digitsOnly';
  return INVALID_EIN_VALUES.has(normalizedValue) ? 'invalidValue' : undefined;
}
