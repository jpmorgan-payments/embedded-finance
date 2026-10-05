import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Check, Gauge, Sparkles, X } from 'lucide-react';

import {
  useSellSenseThemes,
  type ThemeOption,
} from '@/components/sellsense/use-sellsense-themes';
import { cn } from '@/lib/utils';

import {
  CodePanel,
  Mono,
  Reveal,
  SlideHeader,
  type SlideViewProps,
} from './deck-ui';
import {
  cfgEnvelope,
  cfgRequestUri,
  encodeCfg,
  GATEWAY_LIMIT,
  sampleSessionToken,
  standardBreakdown,
  type BudgetSegment,
  type HostedUrlConfig,
} from './url-budget';

type TokenValue = string | number | boolean | undefined;
type TokenMap = Record<string, TokenValue>;
type TokenSet = 'essential' | 'full';

export const PLAYGROUND_THEMES: readonly {
  id: ThemeOption;
  platform: string;
}[] = [
  { id: 'Salt Theme', platform: 'Your Platform' },
  { id: 'SellSense', platform: 'SellSense Marketplace' },
  { id: 'PayFicient', platform: 'PayFicient' },
  { id: 'Create Commerce', platform: 'Create Commerce' },
  { id: 'Default Blue', platform: 'Your Platform' },
];

const ESSENTIAL_TOKENS = [
  'contentFontFamily',
  'textHeadingFontFamily',
  'actionableFontFamily',
  'containerPrimaryBackground',
  'containerCardBackground',
  'contentPrimaryForeground',
  'actionableAccentedBoldBackground',
  'actionableAccentedBoldForeground',
  'actionableSubtleForeground',
  'actionableBorderRadius',
  'editableBorderRadius',
  'focusedRingColor',
];

const AUTOPLAY_THEME_MS = 3200;
const SESSION_TOKEN = sampleSessionToken();

function pickTokens(all: TokenMap, set: TokenSet): TokenMap {
  if (set === 'full') return all;
  return Object.fromEntries(
    ESSENTIAL_TOKENS.filter((key) => all[key] !== undefined).map((key) => [
      key,
      all[key],
    ])
  );
}

function tokenReader(vars: TokenMap) {
  return (key: string, fallback: string): string => {
    const value = vars[key];
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : fallback;
  };
}

function configCode(variables: TokenMap, platform: string): string {
  const entries = Object.entries(variables);
  const shown = entries
    .slice(0, 5)
    .map(([key, value]) => `      ${key}: ${JSON.stringify(value)},`);
  const more =
    entries.length > 5 ? [`      // …${entries.length - 5} more tokens`] : [];
  return [
    'new PartiallyHostedUIComponent({',
    '  sessionToken,',
    "  experienceType: 'HOSTED_ONBOARDING_UI',",
    '  theme: {',
    "    colorScheme: 'light',",
    '    variables: {',
    ...shown,
    ...more,
    '    },',
    '  },',
    "  contentTokens: { name: 'enUS' },",
    '  componentProperties: {',
    '    showDisclosureFooter: true,',
    `    disclosurePlatformName: ${JSON.stringify(platform)},`,
    '  },',
    '});',
  ].join('\n');
}

function ThemedPreview({
  vars,
  platform,
}: {
  vars: TokenMap;
  platform: string;
}) {
  const t = tokenReader(vars);
  const ink = t(
    'contentPrimaryForeground',
    t('containerPrimaryForeground', '#1e293b')
  );
  const muted = t('containerSecondaryForeground', '#64748b');
  const primary = t('actionableAccentedBoldBackground', '#18181b');
  const radius = t('actionableBorderRadius', '6px');
  const font = t('contentFontFamily', 'inherit');
  const button: CSSProperties = {
    fontFamily: t('actionableFontFamily', font),
    textTransform: t(
      'actionableTextTransform',
      'none'
    ) as CSSProperties['textTransform'],
    letterSpacing: t('actionableLetterSpacing', 'normal'),
    fontWeight: Number(t('actionableAccentedBoldFontWeight', '600')),
    borderRadius: radius,
    padding: '8px 18px',
    fontSize: 14,
  };
  const field: CSSProperties = {
    height: 38,
    borderRadius: t('editableBorderRadius', '6px'),
    border: `1px solid ${t('editableBorderColor', '#d4d4d8')}`,
    background: t('editableBackground', '#ffffff'),
  };

  return (
    <div
      className="h-full overflow-hidden p-5"
      style={{
        background: t('containerPrimaryBackground', '#ffffff'),
        color: ink,
        fontFamily: font,
      }}
      data-testid="ph-themed-preview"
    >
      <div
        className="flex h-full flex-col gap-3 p-5"
        style={{
          background: t('containerCardBackground', '#ffffff'),
          border: `1px solid ${t('separableBorderColor', '#e4e4e7')}`,
          borderRadius: t('separableBorderRadius', '8px'),
        }}
      >
        <div className="flex flex-wrap gap-1.5 text-[13px] font-semibold">
          <span
            className="rounded-full px-2.5 py-0.5"
            style={{
              color: t('statusSuccessForeground', '#047857'),
              background: t('statusSuccessAccentBackground', '#d1fae5'),
            }}
          >
            ✓ Business
          </span>
          <span
            className="rounded-full px-2.5 py-0.5"
            style={{
              background: primary,
              color: t('actionableAccentedBoldForeground', '#ffffff'),
            }}
          >
            People
          </span>
          <span className="rounded-full px-2.5 py-0.5" style={{ color: muted }}>
            Documents
          </span>
        </div>
        <p
          className="text-[22px] font-bold leading-tight"
          style={{ fontFamily: t('textHeadingFontFamily', font) }}
        >
          Tell us about the people behind your business
        </p>
        <div>
          <p
            className="mb-1 text-[13px] font-semibold"
            style={{ color: t('editableLabelForeground', ink) }}
          >
            Legal first name
          </p>
          <div
            style={{
              ...field,
              boxShadow: `0 0 0 2px ${t('focusedRingColor', primary)}`,
            }}
          />
        </div>
        <div>
          <p
            className="mb-1 text-[13px] font-semibold"
            style={{ color: t('editableLabelForeground', ink) }}
          >
            Job title
          </p>
          <div style={field} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-[12px]" style={{ color: muted }}>
            {platform} · disclosure footer
          </span>
          <div className="flex gap-2">
            <span
              style={{
                ...button,
                color: t('actionableSubtleForeground', primary),
                background: t('actionableSubtleBackground', 'transparent'),
                border: `${t('actionableSubtleBorderWidth', '1px')} solid ${t('actionableSubtleForeground', primary)}`,
              }}
            >
              Back
            </span>
            <span
              style={{
                ...button,
                background: primary,
                color: t('actionableAccentedBoldForeground', '#ffffff'),
              }}
            >
              Continue
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SEGMENT_STYLE: Record<
  BudgetSegment['id'],
  { className: string; label: string }
> = {
  fixed: { className: 'bg-ph-border', label: 'path + token + type' },
  themeTokens: { className: 'bg-ph-brand', label: 'themeTokens' },
  contentTokens: { className: 'bg-ph-accent', label: 'contentTokens' },
  componentProperties: {
    className: 'bg-ph-brand-strong',
    label: 'componentProperties',
  },
  cfg: { className: 'bg-ph-good', label: 'cfg' },
};

export function BudgetBar({
  label,
  segments,
  scale,
}: {
  label: string;
  segments: readonly BudgetSegment[];
  scale: number;
}) {
  const total = segments.reduce((n, s) => n + s.chars, 0);
  const fits = total <= GATEWAY_LIMIT;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[16px]">
        <span className="font-semibold">{label}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1 font-bold',
            fits ? 'text-ph-good' : 'text-ph-bad'
          )}
        >
          {fits ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {total.toLocaleString('en-US')} chars
        </span>
      </div>
      <div className="relative h-7 overflow-hidden rounded-md bg-ph-soft">
        <div className="absolute inset-y-0 left-0 flex">
          {segments
            .filter((s) => s.chars > 0)
            .map((s) => (
              <span
                key={s.id}
                className={cn(
                  'h-full border-r border-ph-surface transition-[width] duration-500',
                  SEGMENT_STYLE[s.id].className
                )}
                style={{ width: `${(s.chars / scale) * 100}%` }}
                title={`${SEGMENT_STYLE[s.id].label}: ${s.chars}`}
              />
            ))}
        </div>
        <span
          className="absolute inset-y-0 w-[3px] bg-ph-bad"
          style={{ left: `${(GATEWAY_LIMIT / scale) * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function PlaygroundSlide({ autoplay }: SlideViewProps) {
  const { mapThemeOption } = useSellSenseThemes();
  const [themeIndex, setThemeIndex] = useState(0);
  const [tokenSet, setTokenSet] = useState<TokenSet>('essential');
  const [cfg, setCfg] = useState<string | null>(null);

  useEffect(() => {
    if (!autoplay) return undefined;
    const id = window.setInterval(
      () => setThemeIndex((i) => (i + 1) % PLAYGROUND_THEMES.length),
      AUTOPLAY_THEME_MS
    );
    return () => window.clearInterval(id);
  }, [autoplay]);

  const { id: themeId, platform } = PLAYGROUND_THEMES[themeIndex];
  const allVariables = useMemo(
    () => mapThemeOption(themeId).variables as TokenMap,
    [mapThemeOption, themeId]
  );
  const variables = useMemo(
    () => pickTokens(allVariables, tokenSet),
    [allVariables, tokenSet]
  );

  const config: HostedUrlConfig = useMemo(
    () => ({
      experienceType: 'HOSTED_ONBOARDING_UI',
      themeTokens: { colorScheme: 'light', variables },
      contentTokens: { name: 'enUS' },
      componentProperties: {
        showDisclosureFooter: true,
        disclosurePlatformName: platform,
      },
    }),
    [variables, platform]
  );

  useEffect(() => {
    let cancelled = false;
    void encodeCfg(cfgEnvelope(config)).then((value) => {
      if (!cancelled) setCfg(value);
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

  const standard = standardBreakdown(config, SESSION_TOKEN);
  const standardTotal = standard.reduce((n, s) => n + s.chars, 0);
  const compactTotal = cfg
    ? cfgRequestUri(config, SESSION_TOKEN, cfg).length
    : null;
  const fixed = standard[0];
  const scale = Math.max(2600, standardTotal) * 1.04;

  return (
    <>
      <SlideHeader
        kicker="Make it yours"
        title="Showcase themes, straight into the utility"
      />
      <div className="grid min-h-0 flex-1 grid-cols-[300px_560px_1fr] gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-[15px] font-bold uppercase tracking-[0.14em] text-ph-muted">
            Showcase theme
          </p>
          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Showcase theme"
          >
            {PLAYGROUND_THEMES.map((theme, i) => {
              const swatch = tokenReader(
                mapThemeOption(theme.id).variables as TokenMap
              )('actionableAccentedBoldBackground', '#18181b');
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={i === themeIndex}
                  onClick={() => setThemeIndex(i)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[19px] font-semibold',
                    i === themeIndex
                      ? 'border-ph-brand bg-ph-brand-soft text-ph-brand-strong'
                      : 'border-ph-border text-ph-ink hover:bg-ph-soft'
                  )}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-ph-border"
                    style={{ background: swatch }}
                  />
                  {theme.id}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[15px] font-bold uppercase tracking-[0.14em] text-ph-muted">
            Tokens to send
          </p>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Tokens to send"
          >
            {(['essential', 'full'] as const).map((set) => (
              <button
                key={set}
                type="button"
                role="radio"
                aria-checked={tokenSet === set}
                onClick={() => setTokenSet(set)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[16px] font-semibold',
                  tokenSet === set
                    ? 'border-ph-brand bg-ph-brand text-ph-on-brand'
                    : 'border-ph-border hover:bg-ph-soft'
                )}
              >
                {set === 'essential' ? 'Essential' : 'Full theme'}
              </button>
            ))}
          </div>
          <p className="text-[15px] leading-snug text-ph-muted">
            {Object.keys(variables).length} design tokens. Same presets as the
            SellSense demo on the showcase site.
          </p>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="h-[380px] shrink-0 overflow-hidden rounded-2xl border border-ph-border shadow-lg">
            <ThemedPreview vars={allVariables} platform={platform} />
          </div>
          <div
            className="flex flex-col gap-3 rounded-2xl bg-ph-soft p-4"
            aria-live="polite"
          >
            <p className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-[0.14em] text-ph-muted">
              <Gauge className="h-4 w-4" /> Request URI vs{' '}
              {GATEWAY_LIMIT.toLocaleString('en-US')} limit
            </p>
            <BudgetBar
              label="Three JSON parameters"
              segments={standard}
              scale={scale}
            />
            <BudgetBar
              label="Compact cfg"
              segments={
                compactTotal === null
                  ? [fixed]
                  : [fixed, { id: 'cfg', chars: compactTotal - fixed.chars }]
              }
              scale={scale}
            />
            <p className="text-[15px] leading-snug text-ph-muted">
              {standardTotal > GATEWAY_LIMIT ? (
                <>
                  Over the limit: the gateway answers 403, and the utility
                  throws before mounting.{' '}
                  <strong className="text-ph-ink">cfg</strong>{' '}
                  {compactTotal === null
                    ? 'is being measured…'
                    : `fits in ${compactTotal.toLocaleString('en-US')}.`}
                </>
              ) : (
                <>
                  Fits as three parameters. cfg leaves more headroom for content
                  tokens.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <CodePanel
            code={configCode(variables, platform)}
            language="javascript"
            fontSize={15}
            label="Generated utility config"
          />
          <p className="flex items-start gap-2 text-[15px] leading-snug text-ph-muted">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ph-brand" />
            <span>
              Theme objects are <Mono>{'{ colorScheme, variables }'}</Mono>, the
              shape the showcase passes to its embedded components.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

const DOC_FIXED: BudgetSegment = { id: 'fixed', chars: 612 };
const DOC_STANDARD: readonly BudgetSegment[] = [
  DOC_FIXED,
  { id: 'themeTokens', chars: 682 },
  { id: 'contentTokens', chars: 405 },
  { id: 'componentProperties', chars: 622 },
];
const DOC_CFG: readonly BudgetSegment[] = [
  DOC_FIXED,
  { id: 'cfg', chars: 840 },
];
const DOC_SCALE = 2600;

export function UrlBudgetSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Make it yours"
        title="The 2,047-character budget"
        lead="The gateway caps path + query. Above it, requests are rejected at the edge."
      />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_520px] gap-10">
        <div className="flex flex-col gap-7 pt-2">
          <BudgetBar
            label="Fixed: /smbdo/app.html + token + experience type"
            segments={[DOC_FIXED]}
            scale={DOC_SCALE}
          />
          <Reveal shown={step >= 1}>
            <BudgetBar
              label="+ themeTokens, contentTokens, componentProperties"
              segments={DOC_STANDARD}
              scale={DOC_SCALE}
            />
          </Reveal>
          <Reveal shown={step >= 2}>
            <BudgetBar
              label="Same configuration as one compact cfg"
              segments={DOC_CFG}
              scale={DOC_SCALE}
            />
          </Reveal>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[16px]">
            {(Object.keys(SEGMENT_STYLE) as BudgetSegment['id'][]).map((id) => (
              <span key={id} className="inline-flex items-center gap-2">
                <span
                  className={cn('h-4 w-4 rounded', SEGMENT_STYLE[id].className)}
                />
                {SEGMENT_STYLE[id].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-[3px] bg-ph-bad" /> 2,047 limit
            </span>
          </div>
          <p className="mt-auto text-[15px] text-ph-muted">
            Typical costs from <Mono>URL_SIZE_AND_COMPACT_CONFIG.md</Mono>, with
            a ~548-character session token.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <BudgetCard shown dim={step > 0} title="1,435 left for configuration">
            The path, a typical token and the experience type already use 612.
          </BudgetCard>
          <BudgetCard
            shown={step >= 1}
            dim={step > 1}
            tone="bad"
            title="403 before your app sees it"
          >
            Each parameter works alone; only the combination fails. No app log,
            no error event, no postMessage. A real partner URL: 2,408 → 403.
          </BudgetCard>
          <BudgetCard
            shown={step >= 2}
            dim={step > 2}
            tone="good"
            title="cfg: one compressed parameter"
          >
            <Mono>cfg=z.&lt;base64url(deflate-raw(json))&gt;</Mono>. Same
            partner: 1,459 → 200. <Mono>token</Mono> and{' '}
            <Mono>hostedExperienceType</Mono> stay separate.
          </BudgetCard>
          <BudgetCard shown={step >= 3} title="Quick wins first">
            Minify JSON, drop defaults and empty values, encode exactly once
            (double encoding adds ~24%). Diagnose with{' '}
            <Mono>pathname.length + search.length</Mono>.
          </BudgetCard>
        </div>
      </div>
    </>
  );
}

function BudgetCard({
  shown,
  dim = false,
  tone = 'brand',
  title,
  children,
}: {
  shown: boolean;
  dim?: boolean;
  tone?: 'brand' | 'good' | 'bad';
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal shown={shown}>
      <div
        className={cn(
          'ph-dimmable rounded-2xl border-l-[6px] bg-ph-soft px-5 py-3',
          tone === 'brand' && 'border-ph-brand',
          tone === 'good' && 'border-ph-good',
          tone === 'bad' && 'border-ph-bad'
        )}
        data-dim={dim}
      >
        <p
          className={cn(
            'text-[21px] font-bold',
            tone === 'good' && 'text-ph-good',
            tone === 'bad' && 'text-ph-bad'
          )}
        >
          {title}
        </p>
        <p className="text-[17px] leading-snug">{children}</p>
      </div>
    </Reveal>
  );
}
