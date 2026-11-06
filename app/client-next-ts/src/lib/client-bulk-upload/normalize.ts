import { NAME_ALLOWED_CHAR, NAME_PATTERN, ORGANIZATION_TYPES } from './schema';

const LINE_BREAKS_AND_TABS = /[\r\n\t\v\f]+/g;
const INVISIBLE_CHARS = /[\uFEFF\u200B-\u200D\u2060\u00AD]/g;
const NON_BREAKING_SPACES = /[\u00A0\u2007\u202F]/g;

/**
 * Makes a pasted or typed value safe for a single CSV line: each record must
 * stay on one line, so line breaks and tabs become spaces and invisible
 * characters are dropped. Whitespace is not trimmed here so people can keep
 * typing between words; trimming happens on export.
 */
export function cleanCell(value: string): string {
  return value
    .replace(INVISIBLE_CHARS, '')
    .replace(NON_BREAKING_SPACES, ' ')
    .replace(LINE_BREAKS_AND_TABS, ' ');
}

/** Lowercase alphanumerics only, for forgiving header and enum matching. */
export function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ORGANIZATION_TYPE_LOOKUP = new Map<string, string>();
for (const option of ORGANIZATION_TYPES) {
  for (const spelling of [option.value, option.label, ...option.aliases]) {
    ORGANIZATION_TYPE_LOOKUP.set(normalizeKey(spelling), option.value);
  }
}

/**
 * Maps friendly spellings ("LLC", "S corp", "Sole proprietorship") to the API
 * enum. Unknown values are returned trimmed so validation can flag them.
 */
export function normalizeOrganizationType(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return ORGANIZATION_TYPE_LOOKUP.get(normalizeKey(trimmed)) ?? trimmed;
}

const YES_VALUES = new Set(['y', 'yes', 'true', '1', 'x', '✓', '✔']);
const NO_VALUES = new Set(['', 'n', 'no', 'false', '0', '-']);

export function parseYesNo(value: string): boolean | undefined {
  const key = value.trim().toLowerCase();
  if (YES_VALUES.has(key)) return true;
  if (NO_VALUES.has(key)) return false;
  return undefined;
}

const SPECIAL_LETTERS: Record<string, string> = {
  ß: 'ss',
  Æ: 'AE',
  æ: 'ae',
  Ø: 'O',
  ø: 'o',
  Œ: 'OE',
  œ: 'oe',
  Ł: 'L',
  ł: 'l',
  Đ: 'D',
  đ: 'd',
  Þ: 'Th',
  þ: 'th',
  ı: 'i',
  '\u2018': "'",
  '\u2019': "'",
  '\u201B': "'",
  '\u02BC': "'",
  '`': "'",
  '\u00B4': "'",
  '\u2010': '-',
  '\u2011': '-',
  '\u2012': '-',
  '\u2013': '-',
  '\u2014': '-',
};

/**
 * Converts accented and typographic characters to the plain ASCII the API
 * accepts for names, e.g. "José Núñez-O’Brien" -> "Jose Nunez-O'Brien".
 */
export function transliterateName(value: string): string {
  const replaced = Array.from(value)
    .map((char) => SPECIAL_LETTERS[char] ?? char)
    .join('');
  return replaced.normalize('NFD').replace(/\p{M}/gu, '');
}

export function findInvalidNameChars(value: string): string[] {
  if (NAME_PATTERN.test(value)) return [];
  const invalid = new Set<string>();
  for (const char of value) {
    if (!NAME_ALLOWED_CHAR.test(char)) invalid.add(char);
  }
  return Array.from(invalid);
}

/** Returns a fixed name if transliteration makes it valid, otherwise undefined. */
export function suggestNameFix(value: string): string | undefined {
  const fixed = transliterateName(value.trim());
  return fixed !== value.trim() && NAME_PATTERN.test(fixed) ? fixed : undefined;
}
