import { describe, expect, it } from 'vitest';

import {
  cfgEnvelope,
  cfgRequestUri,
  encodeCfg,
  GATEWAY_LIMIT,
  HOSTED_PATH,
  SAMPLE_TOKEN_LENGTH,
  sampleSessionToken,
  standardBreakdown,
  standardRequestUri,
  toBase64Url,
  type HostedUrlConfig,
} from './url-budget';

const token = sampleSessionToken();

const config: HostedUrlConfig = {
  experienceType: 'HOSTED_ONBOARDING_UI',
  themeTokens: {
    colorScheme: 'light',
    variables: Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [
        `designToken${i}`,
        `#1A7B${(i % 90) + 10}`,
      ])
    ),
  },
  contentTokens: { name: 'enUS' },
  componentProperties: {
    showLinkAccountStep: true,
    disclosurePlatformName: 'SellSense Marketplace',
  },
};

describe('url-budget', () => {
  it('produces a JWT-shaped token of the documented typical length', () => {
    expect(token).toHaveLength(SAMPLE_TOKEN_LENGTH);
    expect(token.startsWith('eyJ')).toBe(true);
    expect(token).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  it('builds the standard request URI with each JSON parameter encoded once', () => {
    const uri = standardRequestUri(config, token);
    expect(uri.startsWith(`${HOSTED_PATH}?token=`)).toBe(true);
    expect(uri).toContain('hostedExperienceType=HOSTED_ONBOARDING_UI');
    expect(uri).toContain('themeTokens=%7B');
    expect(uri).not.toContain('%257B');
  });

  it('breaks the standard URI down into segments that sum to its length', () => {
    const segments = standardBreakdown(config, token);
    const sum = segments.reduce((n, s) => n + s.chars, 0);
    expect(sum).toBe(standardRequestUri(config, token).length);
    expect(segments.find((s) => s.id === 'fixed')?.chars).toBeGreaterThan(
      SAMPLE_TOKEN_LENGTH
    );
  });

  it('omits parameters that are not configured', () => {
    const minimal = { experienceType: 'HOSTED_LINKED_ACCOUNTS_UI' };
    expect(standardRequestUri(minimal, 't')).toBe(
      `${HOSTED_PATH}?token=t&hostedExperienceType=HOSTED_LINKED_ACCOUNTS_UI`
    );
    expect(cfgEnvelope(minimal)).toEqual({});
  });

  it('base64url-encodes without padding or unsafe characters', () => {
    expect(toBase64Url(new Uint8Array([0x68, 0x69, 0x3f]))).toBe('aGk_');
    expect(toBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
  });

  it('encodes cfg compactly enough to fit where three parameters overflow', async () => {
    const cfg = await encodeCfg(cfgEnvelope(config));
    expect(cfg).toMatch(/^[zj]\.[A-Za-z0-9_-]+$/);

    const compact = cfgRequestUri(config, token, cfg);
    expect(compact).toContain(`&cfg=${cfg}`);
    if (cfg.startsWith('z.')) {
      expect(compact.length).toBeLessThan(
        standardRequestUri(config, token).length
      );
      expect(compact.length).toBeLessThanOrEqual(GATEWAY_LIMIT);
    }
  });
});
