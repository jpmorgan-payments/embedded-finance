import JSON5 from 'json5';

export type FlexibleJsonParseResult =
  | {
      ok: true;
      parsed: Record<string, unknown>;
      format: 'json' | 'json5';
    }
  | {
      ok: false;
      error: string;
      hint?: string;
    };

const ASSIGNMENT_PREFIX =
  /^(?:export\s+)?(?:const|let|var)\s+[\w$]+\s*=\s*/;
const TRAILING_SEMICOLON = /;\s*$/;

function stripCodeWrappers(input: string): string {
  let text = input.trim();

  if (text.startsWith('```')) {
    text = text.replace(/^```[\w-]*\n?/, '').replace(/\n?```\s*$/, '');
  }

  text = text.trim();
  text = text.replace(ASSIGNMENT_PREFIX, '');
  text = text.replace(TRAILING_SEMICOLON, '').trim();

  return text;
}

function wrapBareObjectLiteral(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;
  if (!trimmed) return trimmed;

  const looksLikePropertyList =
    /^[\w$'"[\]{}]/.test(trimmed) && /:\s*/.test(trimmed);
  if (looksLikePropertyList) {
    return `{\n${trimmed}\n}`;
  }

  return trimmed;
}

function getLineColumn(
  input: string,
  position: number
): { line: number; column: number; snippet: string } {
  const safePos = Math.max(0, Math.min(position, input.length));
  const before = input.slice(0, safePos);
  const lines = before.split('\n');
  const line = lines.length;
  const column = (lines[lines.length - 1]?.length ?? 0) + 1;
  const lineText = input.split('\n')[line - 1] ?? '';
  const snippet = lineText.trim().slice(0, 80) || '(empty line)';

  return { line, column, snippet };
}

function formatParseError(
  input: string,
  error: unknown,
  parserLabel: string
): string {
  const message =
    error instanceof Error ? error.message : 'Unknown parse error';
  const positionMatch = message.match(/position\s+(\d+)/i);
  const lineMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (positionMatch) {
    const position = Number(positionMatch[1]);
    const { line, column, snippet } = getLineColumn(input, position);
    return `${parserLabel}: ${message} (line ${line}, column ${column}). Near: "${snippet}"`;
  }

  if (lineMatch) {
    const line = Number(lineMatch[1]);
    const column = Number(lineMatch[2]);
    const snippet = input.split('\n')[line - 1]?.trim().slice(0, 80) ?? '';
    return `${parserLabel}: ${message}. Near: "${snippet || `(line ${line}, column ${column})`}"`;
  }

  return `${parserLabel}: ${message}`;
}

function assertPlainObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Parse JSON pasted from TS mocks: unquoted keys, single quotes, trailing commas, comments.
 */
export function parseFlexibleJsonObject(
  rawInput: string
): FlexibleJsonParseResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: false, error: 'Empty input', hint: 'Enter a JSON object or paste from a TS mock.' };
  }

  const normalized = wrapBareObjectLiteral(stripCodeWrappers(trimmed));

  try {
    const parsed = assertPlainObject(JSON.parse(normalized));
    if (parsed) {
      return { ok: true, parsed, format: 'json' };
    }
    return {
      ok: false,
      error: 'Value must be a JSON object (not an array, string, or primitive).',
      hint: 'Wrap your content in `{ ... }`.',
    };
  } catch (jsonError) {
    try {
      const parsed = assertPlainObject(JSON5.parse(normalized));
      if (parsed) {
        return { ok: true, parsed, format: 'json5' };
      }
      return {
        ok: false,
        error: 'Value must be an object (not an array, string, or primitive).',
        hint: 'Paste a TS/JS object literal like `{ foo: "bar" }`.',
      };
    } catch (json5Error) {
      const strictMessage = formatParseError(normalized, jsonError, 'Strict JSON');
      const relaxedMessage = formatParseError(
        normalized,
        json5Error,
        'Relaxed JSON'
      );

      return {
        ok: false,
        error: relaxedMessage,
        hint: `${strictMessage}. Tip: unquoted keys, single quotes, trailing commas, and // comments require relaxed JSON — fix the relaxed error above.`,
      };
    }
  }
}

export function formatFlexibleJsonSuccess(format: 'json' | 'json5'): string {
  return format === 'json5'
    ? 'Valid object (parsed as TS/JS-style JSON)'
    : 'Valid JSON object';
}
