import { useEffect, useState, type ReactNode } from 'react';
import {
  Building2,
  KeyRound,
  Landmark,
  Monitor,
  Server,
  UserRound,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  CodePanel,
  Mono,
  Pill,
  Reveal,
  SlideHeader,
  type SlideViewProps,
} from './deck-ui';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export function PrerequisitesSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Integration journey"
        title="Before the first session"
        lead="A hosted session always targets an existing client. Three things to settle up front."
      />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-8">
        <PrereqCard
          n={1}
          icon={<Users className="h-7 w-7" />}
          title="Create the client"
          shown
        >
          <p>
            Every session needs a <strong>Client ID</strong>.
          </p>
          <div className="rounded-xl bg-ph-soft p-4">
            <p className="font-bold">API</p>
            <p className="text-ph-muted">
              <Mono>POST /clients</Mono> with products, partyType, roles and
              organization name.
            </p>
          </div>
          <p className="text-[18px] leading-snug text-ph-muted">
            Clients are created one at a time through the API; batch CSV
            creation is not supported.
          </p>
        </PrereqCard>
        <PrereqCard
          n={2}
          icon={<Building2 className="h-7 w-7" />}
          title="Check status (optional)"
          shown={step >= 1}
        >
          <p>
            <Mono>GET /clients/:id</Mono> before rendering the entry point.
          </p>
          <p className="text-ph-muted">
            When the status is <Mono>INFORMATION_REQUESTED</Mono>, flag it in
            your UI so the user knows to come back.
          </p>
          <span className="relative mt-2 inline-flex w-fit items-center rounded-lg bg-ph-accent px-5 py-2.5 text-[19px] font-semibold text-white">
            Complete onboarding
            <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ph-bad text-[15px] font-bold text-white">
              !
            </span>
          </span>
        </PrereqCard>
        <PrereqCard
          n={3}
          icon={<Monitor className="h-7 w-7" />}
          title="Pick the experience"
          shown={step >= 2}
        >
          <p>
            <Mono>hostedExperienceType</Mono> selects the hosted UI:
          </p>
          {[
            ['HOSTED_ONBOARDING_UI', 'Full onboarding'],
            ['HOSTED_DOC_UPLOAD_ONBOARDING_UI', 'Document upload (default)'],
            ['HOSTED_LINKED_ACCOUNTS_UI', 'Linked bank accounts'],
          ].map(([type, text]) => (
            <div key={type} className="rounded-xl bg-ph-soft px-4 py-3">
              <p className="font-mono text-[16px] font-semibold text-ph-brand-strong">
                {type}
              </p>
              <p className="text-ph-muted">{text}</p>
            </div>
          ))}
        </PrereqCard>
      </div>
    </>
  );
}

function PrereqCard({
  n,
  icon,
  title,
  shown,
  children,
}: {
  n: number;
  icon: ReactNode;
  title: string;
  shown: boolean;
  children: ReactNode;
}) {
  return (
    <Reveal shown={shown} className="h-full">
      <div className="flex h-full flex-col gap-4 rounded-2xl border border-ph-border p-7 text-[20px] leading-snug">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ph-brand text-[19px] font-bold text-ph-on-brand">
            {n}
          </span>
          <span className="text-ph-brand">{icon}</span>
        </div>
        <p className="ph-heading text-[28px] font-bold">{title}</p>
        {children}
      </div>
    </Reveal>
  );
}

const LANES = [
  { icon: UserRound, label: 'User', sub: 'Signed in with MFA', side: 'user' },
  {
    icon: Monitor,
    label: 'Your frontend',
    sub: 'Platform web app',
    side: 'platform',
  },
  {
    icon: Server,
    label: 'Your backend',
    sub: 'POST /sessions',
    side: 'platform',
  },
  {
    icon: Landmark,
    label: 'J.P. Morgan API',
    sub: 'Sessions & banking',
    side: 'jpm',
  },
  { icon: KeyRound, label: 'Hosted UI', sub: 'Inside the iframe', side: 'jpm' },
] as const;

interface SequenceMessage {
  from: number;
  to: number;
  label: string;
  reply?: boolean;
  title: string;
  text: string;
}

export const SEQUENCE: readonly SequenceMessage[] = [
  {
    from: 0,
    to: 1,
    label: 'Open onboarding',
    title: 'The user starts from your UI',
    text: 'A button such as “Complete onboarding”. Show a loading state on it while the session is created.',
  },
  {
    from: 1,
    to: 2,
    label: 'POST /sessions { clientId }',
    title: 'Your frontend calls your backend',
    text: 'Authenticated by your IAM, with MFA, and authorized for this client. The browser never creates J.P. Morgan sessions directly.',
  },
  {
    from: 2,
    to: 3,
    label: 'Create session · EMBEDDED_UI',
    title: 'Server-to-server session request',
    text: 'Your backend sends { type: "EMBEDDED_UI", target: { id: clientId, type: "CLIENT" } } with its own credentials.',
  },
  {
    from: 3,
    to: 2,
    label: '{ id, url, token }',
    reply: true,
    title: 'A short-lived session comes back',
    text: 'The url already embeds the token. The JWT is expected to be valid for about 60 seconds.',
  },
  {
    from: 2,
    to: 1,
    label: '{ url }',
    reply: true,
    title: 'Hand the URL to the browser',
    text: 'Return only what the frontend needs, and load it promptly: the token expires quickly.',
  },
  {
    from: 1,
    to: 4,
    label: 'iframe src = url   (+ theme, content, props)',
    title: 'Mount the hosted UI',
    text: 'Use the url as the iframe src, optionally adding themeTokens, contentTokens and componentProperties, or one compact cfg.',
  },
  {
    from: 4,
    to: 3,
    label: 'Token exchange → banking APIs',
    title: 'The secure token stays inside',
    text: 'The hosted UI exchanges the session token for a secure token and calls the banking APIs. Your frontend never holds it.',
  },
  {
    from: 4,
    to: 1,
    label: 'postMessage events (optional)',
    reply: true,
    title: 'Events back to your page',
    text: 'Status changes, errors and completion. Always validate event.origin before acting on a message.',
  },
  {
    from: 2,
    to: 3,
    label: 'Verify status · webhooks',
    title: 'Trust the server, not the browser',
    text: 'Re-verify status server-to-server, or receive webhooks, before you update your own records.',
  },
];

const LANE_W = 1440 / LANES.length;
const ROW_H = 44;
const laneX = (i: number) => LANE_W / 2 + LANE_W * i;

export function SequenceSlide({ step }: SlideViewProps) {
  const reducedMotion = usePrefersReducedMotion();
  const active = SEQUENCE[Math.min(step, SEQUENCE.length - 1)];
  const height = SEQUENCE.length * ROW_H + 12;

  return (
    <>
      <SlideHeader
        kicker="Integration journey"
        title="The session-transfer journey"
      />
      <div className="grid grid-cols-5 text-center text-[15px] font-bold uppercase tracking-[0.14em]">
        <span />
        <span className="col-span-2 mx-6 border-b-4 border-ph-accent pb-1 text-ph-accent">
          Your platform
        </span>
        <span className="col-span-2 mx-6 border-b-4 border-ph-brand pb-1 text-ph-brand">
          J.P. Morgan
        </span>
      </div>
      <div className="mt-3 grid grid-cols-5">
        {LANES.map(({ icon: Icon, label, sub, side }) => (
          <div key={label} className="flex justify-center">
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-2',
                side === 'platform' && 'border-ph-accent bg-ph-accent-soft',
                side === 'jpm' && 'border-ph-brand bg-ph-brand-soft',
                side === 'user' && 'border-ph-border bg-ph-soft'
              )}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span className="text-left">
                <span className="block text-[19px] font-bold leading-tight">
                  {label}
                </span>
                <span className="block text-[14px] text-ph-muted">{sub}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 1440 ${height}`}
        width={1440}
        height={height}
        className="mt-1 shrink-0 overflow-visible"
        role="img"
        aria-label={`Step ${step + 1} of ${SEQUENCE.length}: ${active.title}`}
      >
        <defs>
          {(['active', 'idle'] as const).map((kind) => (
            <marker
              key={kind}
              id={`ph-arrow-${kind}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L10,5 L0,10 z"
                className={
                  kind === 'active' ? 'fill-ph-brand' : 'fill-ph-muted'
                }
              />
            </marker>
          ))}
        </defs>
        {LANES.map((lane, i) => (
          <line
            key={lane.label}
            x1={laneX(i)}
            x2={laneX(i)}
            y1={0}
            y2={height}
            strokeDasharray="4 6"
            strokeWidth={2}
            className="stroke-ph-border"
          />
        ))}
        {SEQUENCE.map((msg, i) => {
          const state = i < step ? 'past' : i === step ? 'active' : 'future';
          const isActive = state === 'active';
          const dir = msg.to > msg.from ? 1 : -1;
          const x1 = laneX(msg.from) + dir * 6;
          const x2 = laneX(msg.to) - dir * 6;
          const y = 30 + i * ROW_H;
          return (
            <g key={msg.label} className="ph-seq-row" data-state={state}>
              <line
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                strokeWidth={isActive ? 3.5 : 2}
                strokeDasharray={msg.reply ? '8 6' : undefined}
                markerEnd={`url(#ph-arrow-${isActive ? 'active' : 'idle'})`}
                className={isActive ? 'stroke-ph-brand' : 'stroke-ph-muted'}
              />
              <text
                x={(x1 + x2) / 2}
                y={y - 9}
                textAnchor="middle"
                fontSize={isActive ? 19 : 17}
                fontWeight={isActive ? 700 : 600}
                className={isActive ? 'fill-ph-brand-strong' : 'fill-ph-ink'}
              >
                <tspan className="fill-ph-brand">{i + 1}. </tspan>
                {msg.label}
              </text>
              {isActive && !reducedMotion ? (
                <circle r={7} cy={y} className="fill-ph-brand">
                  <animate
                    attributeName="cx"
                    from={x1}
                    to={x2}
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div
        className="mt-auto flex items-center gap-6 rounded-2xl bg-ph-brand-soft px-7 py-4"
        aria-live="polite"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ph-brand text-[26px] font-bold text-ph-on-brand">
          {Math.min(step, SEQUENCE.length - 1) + 1}
        </span>
        <div>
          <p className="ph-heading text-[25px] font-bold text-ph-brand-strong">
            {active.title}
          </p>
          <p className="text-[20px] leading-snug text-ph-ink">{active.text}</p>
        </div>
      </div>
    </>
  );
}

const SESSION_CODE = `app.post('/sessions', requireMfaUser, async (req, res) => {
  const { clientId } = req.body; // must belong to req.user

  const response = await fetchWithRetry(\`\${JPM_API}/sessions\`, {
    method: 'POST',
    headers: jpmHeaders, // J.P. Morgan credentials stay server-side
    body: JSON.stringify({
      type: 'EMBEDDED_UI',
      target: { id: clientId, type: 'CLIENT' },
    }),
  });

  if (!response.ok) {
    // 400 bad input · 404 not found · 422 invalid · 500 → retry
    return res.status(502).json({ error: 'Could not start onboarding' });
  }

  const { url } = await response.json(); // { id, type, target, url, token }
  return res.json({ url }); // token is already in the url (~60 s)
});`;

const SESSION_STEPS = [
  {
    lines: [1, 2],
    title: 'Your IAM, with MFA',
    text: 'Only a user signed in with MFA, and authorized for this client, can start a session.',
  },
  {
    lines: [4, 5, 6, 7, 8, 9, 10, 11],
    title: 'Create the session',
    text: 'Server-to-server: type EMBEDDED_UI, target type CLIENT.',
  },
  {
    lines: [13, 14, 15, 16],
    title: 'Handle errors',
    text: '400, 404, 422 and 500 are documented. Retry transient failures.',
  },
  {
    lines: [18, 19],
    title: 'Return the URL',
    text: 'The token is embedded in the url and short-lived. Keep it out of logs.',
  },
];

export function SessionApiSlide({ step }: SlideViewProps) {
  const current = SESSION_STEPS[Math.min(step, SESSION_STEPS.length - 1)];
  return (
    <>
      <SlideHeader
        kicker="Integration journey"
        title="Your backend: POST /sessions"
      />
      <div className="grid min-h-0 flex-1 grid-cols-[880px_1fr] gap-10">
        <CodePanel
          code={SESSION_CODE}
          language="javascript"
          highlight={current.lines}
          fontSize={18}
          label="Express example"
        />
        <div className="flex min-h-0 flex-col gap-3">
          {SESSION_STEPS.map((item, i) => (
            <div
              key={item.title}
              className="ph-dimmable rounded-2xl border border-ph-border px-5 py-3"
              data-dim={i !== step}
              data-focus={i === step}
            >
              <p className="text-[22px] font-bold">
                <span className="text-ph-brand">{i + 1}.</span> {item.title}
              </p>
              <p className="text-[18px] leading-snug text-ph-muted">
                {item.text}
              </p>
            </div>
          ))}
          <Reveal shown={step >= 3} className="mt-auto">
            <CodePanel
              code={`{
  "id": "9000005555",
  "type": "EMBEDDED_UI",
  "target": { "id": "1000000000", "type": "CLIENT" },
  "url": "https://…/onboarding?token=…",
  "token": "eyJhbGciOiJIUzUxMiJ9…"
}`}
              language="json"
              fontSize={15}
              label="Response from J.P. Morgan"
            />
          </Reveal>
        </div>
      </div>
    </>
  );
}

const IFRAME_CODE = `<section role="region" aria-labelledby="ob-title" class="ob-frame">
  <h2 id="ob-title" class="sr-only">Onboarding</h2>
  <div role="status" aria-live="polite">Loading onboarding…</div>

  <iframe
    src="{url from your backend}"
    title="Complete your account onboarding"
    sandbox="allow-scripts allow-same-origin allow-forms
             allow-popups allow-modals"
    referrerpolicy="no-referrer"
    loading="lazy"
    width="100%"
  ></iframe>
</section>

<style>
  .ob-frame { container-type: inline-size; }
  @container (min-width: 769px) { iframe { min-height: 700px; } }
</style>`;

const IFRAME_STEPS = [
  {
    lines: [6],
    title: 'Use the URL exactly as returned',
    text: 'The session token is already inside. Optional parameters are appended, never rewritten.',
  },
  {
    lines: [8, 9, 10],
    title: 'Least privilege',
    text: 'Sandbox only what the UI needs, send no referrer, and add CSP frame-src for the hosted domain.',
  },
  {
    lines: [1, 2, 3, 7],
    title: 'Accessible by default',
    text: 'A titled region, a polite loading status, and role="alert" for errors. Accessibility of the frame is the platform’s responsibility.',
  },
  {
    lines: [12, 17, 18],
    title: 'Responsive',
    text: 'Full width, container queries, and a height capped around 85% of the viewport.',
  },
];

export function IframeSlide({ step }: SlideViewProps) {
  const current = IFRAME_STEPS[Math.min(step, IFRAME_STEPS.length - 1)];
  return (
    <>
      <SlideHeader
        kicker="Integration journey"
        title="Your frontend: mount the iframe"
      />
      <div className="grid min-h-0 flex-1 grid-cols-[880px_1fr] gap-10">
        <CodePanel
          code={IFRAME_CODE}
          language="markup"
          highlight={current.lines}
          fontSize={18}
          label="HTML"
        />
        <div className="flex flex-col gap-3">
          {IFRAME_STEPS.map((item, i) => (
            <div
              key={item.title}
              className="ph-dimmable rounded-2xl border border-ph-border px-5 py-4"
              data-dim={i !== step}
              data-focus={i === step}
            >
              <p className="text-[22px] font-bold">
                <span className="text-ph-brand">{i + 1}.</span> {item.title}
              </p>
              <p className="text-[18px] leading-snug text-ph-muted">
                {item.text}
              </p>
            </div>
          ))}
          <div className="mt-auto flex flex-wrap gap-2">
            <Pill>Any framework</Pill>
            <Pill tone="accent">React, Vue, Angular or plain HTML</Pill>
          </div>
        </div>
      </div>
    </>
  );
}
