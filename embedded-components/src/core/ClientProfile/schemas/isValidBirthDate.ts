export function isValidBirthDate(
  value: string,
  today = new Date(),
  ageRange?: { minimumAge: number; maximumAge: number }
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  const normalizedToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  const isCalendarDateValid =
    birthDate.getUTCFullYear() === year &&
    birthDate.getUTCMonth() === month - 1 &&
    birthDate.getUTCDate() === day &&
    birthDate.getTime() <= normalizedToday;
  if (!isCalendarDateValid || !ageRange) return isCalendarDateValid;

  let age = today.getUTCFullYear() - year;
  const monthDifference = today.getUTCMonth() - (month - 1);
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < day)
  ) {
    age -= 1;
  }
  return age >= ageRange.minimumAge && age <= ageRange.maximumAge;
}

export function getBirthDateValidationIssue(
  value: string,
  today = new Date(),
  ageRange = { minimumAge: 18, maximumAge: 120 }
):
  | 'required'
  | 'format'
  | 'invalid'
  | 'future'
  | 'tooYoung'
  | 'tooOld'
  | undefined {
  if (!value) return 'required';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return 'format';
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const birthDate = new Date(year, month - 1, day);
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return 'invalid';
  }
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  if (birthDate > endOfToday) return 'future';

  let age = today.getFullYear() - year;
  const monthDifference = today.getMonth() - (month - 1);
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < day)) {
    age -= 1;
  }
  if (age < ageRange.minimumAge) return 'tooYoung';
  return age > ageRange.maximumAge ? 'tooOld' : undefined;
}
