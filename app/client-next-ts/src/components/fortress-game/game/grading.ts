// =============================================================================
// Defense grading — compares the player's payload against the expected call
// =============================================================================

import { HINT_REMOVE } from '../types';
import type { HintContext, HintFault } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep partial match: every key present in `expected` must be present and equal in
 * `actual`. Extra keys in `actual` are ignored, so players can leave the rest of a
 * realistic payload intact.
 */
function partialMatch(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    return expected.every((item, i) => partialMatch(actual[i], item));
  }

  if (isRecord(expected)) {
    if (!isRecord(actual)) return false;
    return Object.entries(expected).every(([key, value]) => partialMatch(actual[key], value));
  }

  if (typeof expected === 'string' && typeof actual === 'string') {
    return actual.trim().toUpperCase() === expected.trim().toUpperCase();
  }

  return actual === expected;
}

export interface GradeResult {
  passed: boolean;
  /** Fields the player still needs to fix, for a targeted hint. */
  failedFields: string[];
  /** Fields left with the placeholder token untouched. */
  unfilledFields: string[];
}

const PLACEHOLDER = '__FILL_ME__';

function containsPlaceholder(value: unknown): boolean {
  if (typeof value === 'string') return value === PLACEHOLDER;
  if (Array.isArray(value)) return value.some(containsPlaceholder);
  if (isRecord(value)) return Object.values(value).some(containsPlaceholder);
  return false;
}

export function gradeDefensePayload(
  payload: Record<string, unknown>,
  expectedPayload: Record<string, unknown>,
  gradedFields: string[]
): GradeResult {
  const failedFields: string[] = [];
  const unfilledFields: string[] = [];

  for (const field of gradedFields) {
    const actual = payload[field];

    if (containsPlaceholder(actual)) {
      unfilledFields.push(field);
      failedFields.push(field);
      continue;
    }

    if (field in expectedPayload) {
      if (!partialMatch(actual, expectedPayload[field])) failedFields.push(field);
      continue;
    }

    // Fields graded for presence only, such as a free-text reason.
    const missing =
      actual === undefined ||
      actual === null ||
      (typeof actual === 'string' && actual.trim() === '');
    if (missing) failedFields.push(field);
  }

  return { passed: failedFields.length === 0, failedFields, unfilledFields };
}

/** Substitutes {{clientId}}-style tokens in a starter payload with live IDs. */
export function hydratePayload(
  payload: Record<string, unknown>,
  values: Record<string, string | null>
): Record<string, unknown> {
  const replace = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
    }
    if (Array.isArray(value)) return value.map(replace);
    if (isRecord(value)) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replace(v)]));
    }
    return value;
  };

  return replace(payload) as Record<string, unknown>;
}

export function hydrateText(text: string, values: Record<string, string | null>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

/** Shallow-merges a tier-3 hint fix into the player's JSON, preserving their other edits. */
export function applyHintFix(
  payload: string,
  fix: Record<string, unknown>
): { payload: string; changed: string[] } {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const changed: string[] = [];
  for (const [key, value] of Object.entries(fix)) {
    if (value === HINT_REMOVE) {
      if (key in parsed) {
        delete parsed[key];
        changed.push(`${key} (removed)`);
      }
      continue;
    }
    if (JSON.stringify(parsed[key]) !== JSON.stringify(value)) changed.push(key);
    parsed[key] = value;
  }

  return { payload: JSON.stringify(parsed, null, 2), changed };
}

/** The player's JSON as an object, or an empty one while it is mid-edit and unparseable. */
export function parsePayload(payload: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(payload) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Folds the fixes of the faults that are still present, one after another, so a later
 * fault patches the payload the earlier one produced instead of overwriting it.
 */
export function applyHintFaults(
  payload: string,
  faults: HintFault[],
  ctx: HintContext
): { payload: string; changed: string[] } {
  let current = payload;
  const changed: string[] = [];
  for (const fault of faults) {
    const result = applyHintFix(current, fault.fix(ctx, parsePayload(current)));
    current = result.payload;
    for (const key of result.changed) if (!changed.includes(key)) changed.push(key);
  }
  return { payload: current, changed };
}
