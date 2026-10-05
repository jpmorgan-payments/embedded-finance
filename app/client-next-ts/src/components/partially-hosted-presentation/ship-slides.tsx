import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CirclePlay,
  ExternalLink,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  Lock,
  Monitor,
  Radio,
  Server,
  ShieldCheck,
  Webhook,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  Mono,
  Pill,
  Reveal,
  SlideHeader,
  type SlideViewProps,
} from './deck-ui';
import {
  GUIDE_URL,
  LIVE_ONBOARDING_DEMO_PATH,
  SESSION_TRANSFER_SAMPLE_URL,
  URL_SIZE_GUIDE_URL,
  UTILITY_GUIDE_URL,
} from './slides';

const SECURITY_GROUPS = [
  {
    icon: KeyRound,
    title: 'Identity & access (yours)',
    highlight: true,
    items: [
      'Your IAM signs users in, with MFA',
      'Authorize the user for the client before POST /sessions',
      'Session token is short-lived; never log it',
    ],
  },
  {
    icon: Lock,
    title: 'Iframe boundary',
    items: [
      'sandbox with least privilege',
      'referrerpolicy="no-referrer"',
      'CSP frame-src limited to the hosted domain',
    ],
  },
  {
    icon: Radio,
    title: 'postMessage',
    items: [
      'Always validate event.origin',
      'Always send with an explicit targetOrigin, never "*"',
      'Treat event.data as untrusted: validate and sanitise',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Trust the server',
    items: [
      'HTTPS; J.P. Morgan credentials stay on your server',
      'Re-verify status server-to-server before “complete”',
      'Verify webhook authenticity (signatures, allow-lists)',
    ],
  },
];

export function SecuritySlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Ship it"
        title="Security, from sign-in to the iframe"
        lead="Access starts with your IAM and MFA. Your platform never holds the token that calls banking APIs."
      />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
        {SECURITY_GROUPS.map(({ icon: Icon, title, items, highlight }, i) => (
          <Reveal key={title} shown={step >= i}>
            <div
              className={cn(
                'ph-dimmable h-full rounded-2xl p-6',
                highlight
                  ? 'border-2 border-ph-accent bg-ph-accent-soft'
                  : 'border border-ph-border'
              )}
              data-focus={step === i}
            >
              <p className="ph-heading flex items-center gap-3 text-[27px] font-bold">
                <Icon className="h-7 w-7 text-ph-brand" />
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
          </Reveal>
        ))}
      </div>
    </>
  );
}

const STATUSES = [
  { label: 'NEW', tone: 'neutral' },
  { label: 'REVIEW_IN_PROGRESS', tone: 'brand' },
  { label: 'INFORMATION_REQUESTED', tone: 'warn' },
  { label: 'APPROVED', tone: 'good' },
  { label: 'DECLINED', tone: 'bad' },
] as const;

export function ResultsSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Ship it"
        title="Handling results and re-entry"
        lead="Two channels, two jobs. Then remember where every user is."
      />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-5">
        <ResultColumn
          shown
          icon={<Monitor className="h-7 w-7" />}
          title="postMessage"
          caption="Real-time UI"
          items={[
            'Intermediate statuses and errors',
            'Update your page instantly',
            'Origin-checked, never final',
          ]}
        />
        <ArrowRight className="mt-28 h-9 w-9 text-ph-muted" />
        <ResultColumn
          shown={step >= 1}
          icon={<Webhook className="h-7 w-7" />}
          title="Webhooks"
          caption="Definitive status"
          items={[
            'Final decisions such as APPROVED or DECLINED',
            'Verify authenticity on ingestion',
            'Correlate to the right user',
          ]}
        />
        <ArrowRight className="mt-28 h-9 w-9 text-ph-muted" />
        <ResultColumn
          shown={step >= 2}
          icon={<Server className="h-7 w-7" />}
          title="Your records"
          caption="Re-entry"
          items={[
            'Store status, IDs and a timestamp',
            'Resume incomplete applications',
            'Show “submitted, awaiting review” instead of restarting',
          ]}
        >
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Pill
                key={s.label}
                tone={s.tone}
                className="font-mono text-[13px]"
              >
                {s.label}
              </Pill>
            ))}
          </div>
        </ResultColumn>
      </div>
    </>
  );
}

function ResultColumn({
  shown,
  icon,
  title,
  caption,
  items,
  children,
}: {
  shown: boolean;
  icon: ReactNode;
  title: string;
  caption: string;
  items: string[];
  children?: ReactNode;
}) {
  return (
    <Reveal shown={shown} className="h-full">
      <div className="h-full rounded-2xl bg-ph-soft p-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-ph-brand-soft text-ph-brand">
          {icon}
        </span>
        <p className="ph-heading mt-4 text-[30px] font-bold">{title}</p>
        <p className="text-[17px] font-bold uppercase tracking-[0.14em] text-ph-brand">
          {caption}
        </p>
        <ul className="mt-4 grid gap-2.5 text-[20px] leading-snug">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-1 h-5 w-5 shrink-0 text-ph-good" />
              {item}
            </li>
          ))}
        </ul>
        {children}
      </div>
    </Reveal>
  );
}

const OWNERS = [
  {
    icon: Server,
    title: 'Your backend',
    tone: 'accent',
    items: [
      'POST /sessions for MFA-verified users',
      'J.P. Morgan credentials, stored securely',
      'Error handling and retries',
      'Webhook ingestion and verification',
      'Server-side status re-verification',
    ],
  },
  {
    icon: Monitor,
    title: 'Your frontend',
    tone: 'accent',
    items: [
      'Entry point with loading state',
      'Iframe with the URL as returned',
      'Loading, error and refresh states',
      'Origin-checked postMessage listener',
      'Responsive, accessible container',
    ],
  },
  {
    icon: Landmark,
    title: 'J.P. Morgan',
    tone: 'brand',
    items: [
      'Session API and short-lived tokens',
      'Hosted onboarding, documents, linked accounts',
      'Secure token exchange and banking APIs',
      'Validation of theme, content and properties',
      'Status events and webhooks',
    ],
  },
] as const;

export function ResponsibilitiesSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader kicker="Ship it" title="Who owns what" />
      <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-ph-accent bg-ph-accent-soft px-6 py-4 text-[22px]">
        <KeyRound className="h-8 w-8 shrink-0 text-ph-accent" />
        <p>
          <strong>Your platform owns identity &amp; access management</strong>{' '}
          for every user who can open the hosted UI, including MFA.
        </p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-8">
        {OWNERS.map(({ icon: Icon, title, tone, items }, i) => (
          <Reveal key={title} shown={step >= i}>
            <div
              className={cn(
                'h-full rounded-2xl border-t-[8px] bg-ph-soft p-7',
                tone === 'accent' ? 'border-ph-accent' : 'border-ph-brand'
              )}
            >
              <p
                className={cn(
                  'ph-heading flex items-center gap-3 text-[30px] font-bold',
                  tone === 'accent' ? 'text-ph-accent' : 'text-ph-brand'
                )}
              >
                <Icon className="h-8 w-8" />
                {title}
              </p>
              <ul className="mt-5 grid gap-3 text-[21px] leading-snug">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-1 h-5 w-5 shrink-0 text-ph-good" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}

const LINKS = [
  {
    icon: CirclePlay,
    title: 'Interactive integration guide',
    text: 'Every step with full code, on the showcase site',
    href: '/partially-hosted-demo',
  },
  {
    icon: Monitor,
    title: 'Live onboarding demo',
    text: 'The onboarding experience in the SellSense demo',
    href: LIVE_ONBOARDING_DEMO_PATH,
  },
  {
    icon: BookOpen,
    title: 'Integration guide',
    text: 'PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md',
    href: GUIDE_URL,
  },
  {
    icon: FileText,
    title: 'Utility library guide',
    text: 'PartiallyHostedUIComponent API reference',
    href: UTILITY_GUIDE_URL,
  },
  {
    icon: Gauge,
    title: 'URL size & compact cfg',
    text: 'Budget, diagnosis, encoders in four languages',
    href: URL_SIZE_GUIDE_URL,
  },
  {
    icon: Server,
    title: 'Session transfer sample',
    text: 'Node demo: certificate auth, session, iframe',
    href: SESSION_TRANSFER_SAMPLE_URL,
  },
];

export function NextStepsSlide() {
  return (
    <>
      <SlideHeader
        kicker="Ship it"
        title="Go deeper"
        lead={
          <>
            Everything in this deck is open source in{' '}
            <Mono>jpmorgan-payments/embedded-finance</Mono>.
          </>
        }
      />
      <div className="grid grid-cols-3 gap-6">
        {LINKS.map(({ icon: Icon, title, text, href }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-2xl border border-ph-border p-6 transition-colors hover:border-ph-brand hover:bg-ph-brand-soft"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ph-brand-soft text-ph-brand group-hover:bg-ph-brand group-hover:text-ph-on-brand">
              <Icon className="h-6 w-6" />
            </span>
            <span>
              <span className="flex items-center gap-2 text-[23px] font-bold">
                {title}
                <ExternalLink className="h-4 w-4 text-ph-muted" />
              </span>
              <span className="block text-[18px] leading-snug text-ph-muted">
                {text}
              </span>
            </span>
          </a>
        ))}
      </div>
      <p className="ph-heading mt-auto text-center text-[56px] font-bold text-ph-brand">
        Questions?
      </p>
    </>
  );
}
