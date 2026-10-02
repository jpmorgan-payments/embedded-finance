import {
  Boxes,
  Layers,
  Radio,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import {
  CodePanel,
  Mono,
  Pill,
  SlideHeader,
  type SlideViewProps,
} from './deck-ui';

const UTILITY_CODE = `import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';

const ui = new PartiallyHostedUIComponent({
  sessionToken,                          // from your POST /sessions
  experienceType: 'HOSTED_ONBOARDING_UI',
  theme: { colorScheme: 'light', variables: { /* tokens */ } },
  contentTokens: { name: 'enUS' },
  componentProperties: { showLinkAccountStep: true },
});

ui.mount('onboarding-container');

const unsubscribe = ui.subscribe((event) => {
  if (event.message === 'OnboardingComplete') notifyBackend(event.payload);
});

ui.updateTheme({ colorScheme: 'dark' }); // or updateContentTokens, refresh
ui.destroy();`;

const UTILITY_STEPS = [
  {
    lines: [1],
    icon: Boxes,
    title: 'Drop it in',
    text: 'Zero dependencies. ES module or UMD build. Works with React, Vue, Angular or plain HTML.',
  },
  {
    lines: [3, 4, 5, 6, 7, 8, 9],
    icon: Layers,
    title: 'Configure once',
    text: 'Builds the URL, encodes each JSON parameter exactly once, and throws before mounting if the request URI would pass 2,047 characters.',
  },
  {
    lines: [11],
    icon: ShieldCheck,
    title: 'Mount safely',
    text: 'Creates a titled, sandboxed iframe with referrerpolicy="no-referrer" inside your container.',
  },
  {
    lines: [13, 14, 15],
    icon: Radio,
    title: 'Subscribe to events',
    text: 'Origin-checked postMessage, published as { level, namespace, message, payload }.',
  },
  {
    lines: [17, 18],
    icon: RefreshCw,
    title: 'Change at runtime',
    text: 'updateTheme, updateContentTokens, updateComponentProperties, refresh, unmount and destroy.',
  },
];

export function UtilitySlide({ step }: SlideViewProps) {
  const current = UTILITY_STEPS[Math.min(step, UTILITY_STEPS.length - 1)];
  return (
    <>
      <SlideHeader
        kicker="Utility library"
        title="The PartiallyHostedUIComponent utility"
      />
      <div className="grid min-h-0 flex-1 grid-cols-[900px_1fr] gap-10">
        <div className="flex min-h-0 flex-col gap-4">
          <CodePanel
            code={UTILITY_CODE}
            language="javascript"
            highlight={current.lines}
            fontSize={17}
            label="partially-hosted-ui-component.mjs"
          />
          <div className="flex flex-wrap gap-2">
            <Pill>Zero dependencies</Pill>
            <Pill>ES module + UMD</Pill>
            <Pill tone="accent">Framework-agnostic</Pill>
            <Pill tone="neutral">One readable file</Pill>
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-2.5">
          {UTILITY_STEPS.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className="ph-dimmable flex gap-4 rounded-2xl border border-ph-border px-5 py-3"
              data-dim={i !== step}
              data-focus={i === step}
            >
              <Icon className="mt-1 h-7 w-7 shrink-0 text-ph-brand" />
              <div>
                <p className="text-[21px] font-bold">{title}</p>
                <p className="text-[17px] leading-snug text-ph-muted">{text}</p>
              </div>
            </div>
          ))}
          <p className="mt-auto flex items-start gap-2 text-[15px] leading-snug text-ph-muted">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ph-warn" />
            <span>
              Reference implementation, work in progress: adapt and test before
              production. Docs: <Mono>PARTIALLY_HOSTED_UTILITY_GUIDE.md</Mono>
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
