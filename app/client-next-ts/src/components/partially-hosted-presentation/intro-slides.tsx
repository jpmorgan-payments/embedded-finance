import type { ReactNode } from 'react';
import {
  Building2,
  Check,
  Landmark,
  Layers,
  LayoutDashboard,
  Palette,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  BrowserFrame,
  Reveal,
  SlideHeader,
  type SlideViewProps,
} from './deck-ui';
import { FitToWidth, OnboardingFlowWireframe } from './onboarding-wireframe';

const PLATFORM_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Orders', icon: ShoppingBag },
  { label: 'Wallet', icon: Wallet },
  { label: 'Settings', icon: Settings },
];

function PlatformShell({
  showHosted,
  compactNav = false,
}: {
  showHosted: boolean;
  compactNav?: boolean;
}) {
  return (
    <BrowserFrame
      address="https://your-platform.example/wallet"
      className="h-full"
    >
      <div className="flex h-full">
        <nav
          className={cn(
            'flex shrink-0 flex-col gap-2 border-r border-ph-border bg-ph-soft py-4 text-[15px] font-semibold text-ph-muted',
            compactNav ? 'w-[60px] items-center px-2' : 'w-[170px] px-4'
          )}
        >
          <span className="ph-heading mb-3 text-[18px] text-ph-accent">
            {compactNav ? 'YP' : 'Your platform'}
          </span>
          {PLATFORM_NAV.map(({ label, icon: Icon }) => (
            <span
              key={label}
              title={label}
              className={cn(
                'flex items-center gap-2 rounded-md py-1.5',
                compactNav ? 'px-2' : 'px-3',
                label === 'Wallet' && 'bg-ph-accent-soft text-ph-accent'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {compactNav ? null : label}
            </span>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="ph-heading text-[22px] font-bold">Wallet</span>
            <span className="rounded-md bg-ph-accent px-3 py-1 text-[14px] font-semibold text-white">
              Complete onboarding
            </span>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <Reveal
              shown={showHosted}
              className="flex min-h-0 flex-1 flex-col gap-3"
            >
              <span className="w-fit rounded-full bg-ph-brand px-3 py-1 text-[13px] font-bold text-ph-on-brand">
                iframe · hosted by J.P. Morgan
              </span>
              <FitToWidth
                designWidth={800}
                className="min-h-0 flex-1 rounded-xl border-2 border-ph-brand"
              >
                <OnboardingFlowWireframe />
              </FitToWidth>
            </Reveal>
            {!showHosted ? (
              <p className="absolute inset-0 grid place-items-center rounded-xl border-2 border-dashed border-ph-border text-[16px] font-semibold text-ph-muted">
                Your page, your layout
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

const AGENDA = [
  {
    icon: Server,
    label: 'Session transfer',
    text: 'POST /sessions and the iframe',
  },
  {
    icon: Layers,
    label: 'Hosted experiences',
    text: 'onboarding, documents, linked accounts',
  },
  {
    icon: Palette,
    label: 'Utility library & theming',
    text: 'config, events, URL budget',
  },
  {
    icon: ShieldCheck,
    label: 'Security & results',
    text: 'iframe boundary, webhooks, status',
  },
];

export function WelcomeSlide() {
  return (
    <div className="grid h-full grid-cols-[1fr_680px] items-center gap-12">
      <div>
        <p className="text-[18px] font-bold uppercase tracking-[0.2em] text-ph-brand">
          Embedded Finance · Integration overview
        </p>
        <h1 className="ph-heading mt-4 text-[88px] font-bold leading-[1.02]">
          Partially Hosted UI
        </h1>
        <p className="mt-6 max-w-[700px] text-[28px] leading-[1.45] text-ph-muted">
          Embed J.P. Morgan-hosted onboarding and account experiences in your
          platform with{' '}
          <strong className="text-ph-ink">one backend endpoint</strong> and{' '}
          <strong className="text-ph-ink">one iframe</strong>.
        </p>
        <ul className="mt-10 grid max-w-[700px] gap-3">
          {AGENDA.map(({ icon: Icon, label, text }) => (
            <li
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-ph-border bg-ph-soft px-5 py-3"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ph-brand-soft text-ph-brand">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-[21px]">
                <strong>{label}</strong>
                <span className="text-ph-muted"> · {text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[16px] text-ph-muted">
          Based on the current Partially Hosted UI Integration Guide (draft,
          under review).
        </p>
      </div>
      <div className="h-[620px]">
        <PlatformShell showHosted compactNav />
      </div>
    </div>
  );
}

const PLATFORM_OWNS = [
  'Entry point, navigation and page layout',
  'Your user’s login and the POST /sessions endpoint',
  'Brand: theme tokens, content tokens, component properties',
  'Status in your own records',
];

const JPM_OWNS = [
  'Hosted onboarding, document and linked-account UI',
  'KYC / KYB questions, document requests and validation',
  'Banking API calls with a token that stays in the iframe',
  'Flow and rule updates without a platform release',
];

export function SplitSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Why partially hosted"
        title="Hosted by J.P. Morgan, framed by your platform"
      />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_480px] gap-10">
        <PlatformShell showHosted={step >= 1} />
        <div className="flex flex-col gap-6">
          <Reveal shown={step >= 2}>
            <OwnershipCard
              icon={<Building2 className="h-6 w-6" />}
              title="Your platform owns"
              items={PLATFORM_OWNS}
              tone="accent"
            />
          </Reveal>
          <Reveal shown={step >= 3}>
            <OwnershipCard
              icon={<Landmark className="h-6 w-6" />}
              title="J.P. Morgan owns"
              items={JPM_OWNS}
              tone="brand"
            />
          </Reveal>
        </div>
      </div>
    </>
  );
}

function OwnershipCard({
  icon,
  title,
  items,
  tone,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  tone: 'accent' | 'brand';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border-l-[6px] bg-ph-soft p-6',
        tone === 'accent' ? 'border-ph-accent' : 'border-ph-brand'
      )}
    >
      <p
        className={cn(
          'ph-heading flex items-center gap-3 text-[26px] font-bold',
          tone === 'accent' ? 'text-ph-accent' : 'text-ph-brand'
        )}
      >
        {icon}
        {title}
      </p>
      <ul className="mt-3 grid gap-2 text-[20px] leading-snug">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <Check className="mt-1 h-5 w-5 shrink-0 text-ph-good" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const OPTION_COLUMNS = [
  {
    id: 'api',
    name: 'API only',
    sub: 'Build it yourself',
    values: ['Longest', 'Total', 'Yes', 'You', 'Any', 'Largest'],
  },
  {
    id: 'components',
    name: 'Embedded components',
    sub: 'npm package, build time',
    values: [
      'Medium',
      'High: props, themes',
      'Yes',
      'You (upgrade package)',
      'React 18 or 19',
      'API proxy + UI',
    ],
  },
  {
    id: 'partial',
    name: 'Partially hosted',
    sub: 'iframe, runtime',
    values: [
      'Fast',
      'Theme, content, props',
      'Yes (iframe)',
      'J.P. Morgan',
      'Any framework',
      'One session endpoint',
    ],
  },
  {
    id: 'full',
    name: 'Fully hosted',
    sub: 'J.P. Morgan site',
    values: [
      'Fastest',
      'Minimal',
      'No (redirect)',
      'J.P. Morgan',
      'None',
      'Smallest',
    ],
  },
];

const OPTION_ROWS = [
  'Time to market',
  'UI & UX control',
  'Inside your page',
  'Ships flow & rule changes',
  'Frontend stack',
  'Your security surface',
];

export function OptionsSlide({ step }: SlideViewProps) {
  const highlight = step >= 4;
  return (
    <>
      <SlideHeader
        kicker="Why partially hosted"
        title="Four ways to integrate"
      />
      <div className="mb-3 grid grid-cols-[260px_repeat(4,1fr)] items-center gap-x-4 text-[16px] font-bold uppercase tracking-[0.12em] text-ph-muted">
        <span />
        <span className="col-span-4 flex items-center gap-3">
          More control and effort
          <span className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-ph-accent to-ph-brand" />
          Faster to market
        </span>
      </div>
      <div className="grid min-h-0 grid-cols-[260px_repeat(4,1fr)] gap-x-4">
        <div className="grid grid-rows-[96px_repeat(6,64px)]">
          <span />
          {OPTION_ROWS.map((row) => (
            <span
              key={row}
              className="flex items-center border-t border-ph-border text-[19px] font-semibold text-ph-muted"
            >
              {row}
            </span>
          ))}
        </div>
        {OPTION_COLUMNS.map((col, i) => {
          const isPartial = col.id === 'partial';
          return (
            <Reveal key={col.id} shown={step >= i}>
              <div
                className={cn(
                  'ph-dimmable grid grid-rows-[96px_repeat(6,64px)] rounded-2xl px-4',
                  isPartial ? 'bg-ph-brand-soft' : 'bg-ph-soft'
                )}
                data-dim={highlight && !isPartial}
                data-focus={highlight && isPartial}
              >
                <div className="flex flex-col justify-center">
                  <span className="ph-heading text-[24px] font-bold leading-tight">
                    {col.name}
                  </span>
                  <span className="text-[16px] text-ph-muted">{col.sub}</span>
                </div>
                {col.values.map((value, r) => (
                  <span
                    key={OPTION_ROWS[r]}
                    className={cn(
                      'flex items-center border-t border-ph-border text-[19px]',
                      isPartial && 'font-semibold text-ph-brand-strong'
                    )}
                  >
                    {value}
                  </span>
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal shown={highlight} className="mt-auto">
        <p className="flex items-center gap-4 rounded-2xl bg-ph-brand px-6 py-4 text-[22px] font-semibold text-ph-on-brand">
          <Users className="h-7 w-7 shrink-0" />
          Choose partially hosted when J.P. Morgan should own the regulated
          flow, but users must stay on your page, on any frontend stack.
        </p>
      </Reveal>
      <p className="mt-3 text-[14px] text-ph-muted">
        Indicative comparison; your effort depends on scope and existing stack.
      </p>
    </>
  );
}
