/**
 * Request-URI budget maths for the partially hosted gateway, following
 * embedded-components/docs/partially-hosted/URL_SIZE_AND_COMPACT_CONFIG.md.
 */

export const GATEWAY_LIMIT = 2047;
export const HOSTED_PATH = '/smbdo/app.html';
/** "a typical ~548-character session token" (URL size guide). */
export const SAMPLE_TOKEN_LENGTH = 548;

export interface HostedUrlConfig {
  experienceType: string;
  themeTokens?: object;
  contentTokens?: object;
  componentProperties?: object;
}

export interface BudgetSegment {
  id: 'fixed' | 'themeTokens' | 'contentTokens' | 'componentProperties' | 'cfg';
  chars: number;
}

const BASE64URL_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Deterministic, JWT-shaped placeholder of the requested length. */
export function sampleSessionToken(length = SAMPLE_TOKEN_LENGTH): string {
  const header = 'eyJhbGciOiJIUzUxMiJ9.';
  let body = '';
  for (let i = 0; body.length < length - header.length; i += 1) {
    body += BASE64URL_CHARS[(i * 7 + 3) % BASE64URL_CHARS.length];
  }
  return (header + body).slice(0, length);
}

function fixedParams(config: HostedUrlConfig, token: string) {
  return new URLSearchParams({
    token,
    hostedExperienceType: config.experienceType,
  });
}

function jsonParamCost(name: string, value: object | undefined): number {
  if (!value) return 0;
  // "&" + name=value, percent-encoded exactly once (as URLSearchParams does).
  return (
    1 + new URLSearchParams({ [name]: JSON.stringify(value) }).toString().length
  );
}

/** The request URI the utility builds today: three JSON query parameters. */
export function standardRequestUri(
  config: HostedUrlConfig,
  token: string
): string {
  const params = fixedParams(config, token);
  if (config.themeTokens) {
    params.append('themeTokens', JSON.stringify(config.themeTokens));
  }
  if (config.contentTokens) {
    params.append('contentTokens', JSON.stringify(config.contentTokens));
  }
  if (config.componentProperties) {
    params.append(
      'componentProperties',
      JSON.stringify(config.componentProperties)
    );
  }
  return `${HOSTED_PATH}?${params.toString()}`;
}

export function standardBreakdown(
  config: HostedUrlConfig,
  token: string
): BudgetSegment[] {
  return [
    {
      id: 'fixed',
      chars: `${HOSTED_PATH}?${fixedParams(config, token).toString()}`.length,
    },
    {
      id: 'themeTokens',
      chars: jsonParamCost('themeTokens', config.themeTokens),
    },
    {
      id: 'contentTokens',
      chars: jsonParamCost('contentTokens', config.contentTokens),
    },
    {
      id: 'componentProperties',
      chars: jsonParamCost('componentProperties', config.componentProperties),
    },
  ];
}

/** cfg is base64url, so it is appended without percent-encoding. */
export function cfgRequestUri(
  config: HostedUrlConfig,
  token: string,
  cfg: string
): string {
  return `${HOSTED_PATH}?${fixedParams(config, token).toString()}&cfg=${cfg}`;
}

export function cfgEnvelope(config: HostedUrlConfig): Record<string, object> {
  const envelope: Record<string, object> = {};
  if (config.themeTokens) envelope.themeTokens = config.themeTokens;
  if (config.contentTokens) envelope.contentTokens = config.contentTokens;
  if (config.componentProperties) {
    envelope.componentProperties = config.componentProperties;
  }
  return envelope;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function deflateRaw(bytes: BufferSource): Promise<Uint8Array> {
  const stream = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  }).pipeThrough(new CompressionStream('deflate-raw'));

  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Encode the cfg envelope as `z.<base64url(deflate-raw(json))>`, falling back
 * to the uncompressed `j.` codec where CompressionStream is unavailable.
 */
export async function encodeCfg(envelope: object): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  if (typeof CompressionStream === 'function') {
    try {
      return `z.${toBase64Url(await deflateRaw(bytes))}`;
    } catch {
      // Older engines lack 'deflate-raw'.
    }
  }
  return `j.${toBase64Url(bytes)}`;
}
