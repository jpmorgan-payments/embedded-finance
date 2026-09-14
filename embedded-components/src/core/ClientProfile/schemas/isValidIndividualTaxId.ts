const KNOWN_INVALID_SSNS = new Set([
  '078051120',
  '219099999',
  '123456789',
  '888888888',
  '777777777',
  '555555555',
  '444444444',
  '333333333',
  '222222222',
  '111111111',
  '457555462',
  '012345678',
  '987654321',
]);

export const isKnownInvalidSsn = (value: string) =>
  KNOWN_INVALID_SSNS.has(value);

export const isValidItinMiddleDigits = (value: string) => {
  const middleDigits = Number(value.slice(3, 5));
  return (
    (middleDigits >= 50 && middleDigits <= 55) ||
    (middleDigits >= 60 && middleDigits <= 65) ||
    (middleDigits >= 70 && middleDigits <= 79) ||
    (middleDigits >= 80 && middleDigits <= 88) ||
    (middleDigits >= 90 && middleDigits <= 92) ||
    (middleDigits >= 94 && middleDigits <= 99)
  );
};

export function isValidSsn(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const firstThreeDigits = Number(value.slice(0, 3));
  return (
    value.charAt(0) !== '9' &&
    firstThreeDigits !== 0 &&
    firstThreeDigits !== 666 &&
    !isKnownInvalidSsn(value)
  );
}

export function isValidItin(value: string): boolean {
  if (!/^9\d{8}$/.test(value) || value === '987654321') return false;
  return isValidItinMiddleDigits(value);
}

export function getIndividualTaxIdValidationIssue(
  idType: string,
  value: string
): string | undefined {
  if (!value) return 'required';
  if (idType !== 'SSN' && idType !== 'ITIN') {
    return /\s/.test(value) ? 'noSpaces' : undefined;
  }
  if (value.length !== 9) {
    return idType === 'SSN' ? 'ssnLength' : 'itinLength';
  }
  if (!/^\d{9}$/.test(value)) {
    return idType === 'SSN' ? 'ssnDigitsOnly' : 'itinDigitsOnly';
  }
  if (idType === 'SSN') {
    const firstThreeDigits = Number(value.slice(0, 3));
    if (firstThreeDigits === 0 || value.charAt(0) === '9') {
      return 'ssnFirstThree';
    }
    if (firstThreeDigits === 666) return 'ssn666';
    return isKnownInvalidSsn(value) ? 'ssnKnownInvalid' : undefined;
  }
  if (!value.startsWith('9')) return 'itinStartsWith9';
  if (!isValidItin(value)) {
    return value === '987654321' ? 'itinKnownInvalid' : 'itinMiddleDigits';
  }
  return undefined;
}
