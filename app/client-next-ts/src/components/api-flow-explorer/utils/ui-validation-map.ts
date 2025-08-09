// Static UI validation map for compact display in Payload Table
// This maps JSONPath-like paths to concise UI validation descriptions derived from Zod schemas

export interface UiValidationRule {
  path: string; // e.g. $.organization.organizationName
  rules: string[]; // compact phrases like "required", "min:2", "max:100", "pattern: NAME_PATTERN"
  source?: string; // optional: which schema/file it’s from
}

// Import the static JSON list to allow non-code contributions and simpler maintenance
// Vite supports JSON imports natively
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import uiValidationJson from './ui-validation-map.json';

export const UI_VALIDATION_RULES: UiValidationRule[] =
  (uiValidationJson as UiValidationRule[]) ?? [];

/**
 * Resolve UI validation by matching a JSON path against the static map.
 * Supports wildcard segments like [*]. Performs simple normalization.
 */
export function getUiValidationForPath(path: string): string {
  if (!path) return '';

  // Normalize array numeric indices to wildcard for matching
  const wildcardPath = path.replace(/\[\d+\]/g, '[*]');

  // Build candidate canonical paths using aliasing rules between API payload and UI form fields
  const candidates = new Set<string>([wildcardPath, path]);

  // Aliases for common containers and field name differences
  const aliases: Array<(p: string) => string> = [
    // Parties → Organization
    (p) =>
      p.replace(/^\$\.parties\[\*\]\.organizationDetails\./, '$.organization.'),
    // Parties → Individual (Controller)
    (p) =>
      p.replace(/^\$\.parties\[\*\]\.individualDetails\./, '$.controller.'),
    // Address nesting under party to top-level addresses mapping
    (p) =>
      p.replace(/^\$\.parties\[\*\]\.addresses\[\*\]\./, '$.addresses[*].'),
    // Organization IDs under party → UI organization.organizationIds
    (p) =>
      p.replace(
        /^\$\.parties\[\*\]\.organizationIds\[\*\]\./,
        '$.organization.organizationIds[*].',
      ),
    // Individual IDs field name difference to controllerIds
    (p) => p.replace(/\.individualIds\[/, '.controllerIds['),
    // Organization phone at party level
    (p) => p.replace(/^\$\.parties\[\*\]\.phone\./, '$.organizationPhone.'),
  ];

  for (const transform of aliases) {
    candidates.add(transform(wildcardPath));
  }

  // Try exact matches across candidates
  for (const c of candidates) {
    const found = UI_VALIDATION_RULES.find((r) => r.path === c);
    if (found) return found.rules.join(', ');
  }

  // If we matched a container (e.g., $.organization or $.controller), summarize child rules
  const containerBases = Array.from(candidates).filter(
    (c) =>
      c === '$.organization' ||
      c === '$.controller' ||
      c === '$.addresses[*]' ||
      c === '$.organizationPhone' ||
      c === '$.controller.phone',
  );
  for (const base of containerBases) {
    const children = UI_VALIDATION_RULES.filter((r) =>
      r.path.startsWith(`${base}.`),
    );
    if (children.length > 0) {
      const sample = children.slice(0, 4).map((r) => {
        const label = r.path.split('.').slice(-1)[0];
        return `${label}: ${r.rules.join(' ')}`;
      });
      const more = children.length > 4 ? `, +${children.length - 4} more` : '';
      return `${sample.join(' | ')}${more}`;
    }
  }

  // Try suffix match using last 2-3 segments for resilience
  const segmentTail = (p: string, n: number) =>
    p.split('.').slice(-n).join('.');
  for (const c of candidates) {
    const tails = [segmentTail(c, 2), segmentTail(c, 3)];
    for (const r of UI_VALIDATION_RULES) {
      if (r.path.endsWith(tails[0]) || r.path.endsWith(tails[1])) {
        return r.rules.join(', ');
      }
    }
  }

  return '';
}
