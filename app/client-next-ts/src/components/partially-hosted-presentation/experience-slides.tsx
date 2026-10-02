import {
  Check,
  FileUp,
  Landmark,
  Link2,
  Plus,
  TriangleAlert,
  Upload,
} from 'lucide-react';

import {
  BrowserFrame,
  CodePanel,
  Mono,
  Pill,
  Reveal,
  SlideHeader,
  type SlideViewProps,
} from './deck-ui';
import { FitToWidth, OnboardingFlowWireframe } from './onboarding-wireframe';

function DocUploadMock() {
  return (
    <div className="flex h-full flex-col gap-3 p-5 text-[15px]">
      <p className="ph-heading text-[19px] font-bold">Documents requested</p>
      <div className="flex items-center justify-between rounded-lg border border-ph-border px-3 py-2">
        <span>Articles of incorporation</span>
        <span className="inline-flex items-center gap-1 font-semibold text-ph-good">
          <Check className="h-4 w-4" /> Uploaded
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-ph-border px-3 py-2">
        <span>Proof of address</span>
        <span className="font-semibold text-ph-warn">Needed</span>
      </div>
      <div className="mt-1 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ph-brand bg-ph-brand-soft text-ph-brand-strong">
        <Upload className="h-7 w-7" />
        <span className="font-semibold">Drop a file or browse</span>
      </div>
    </div>
  );
}

function LinkedAccountsMock() {
  return (
    <div className="flex h-full flex-col gap-3 p-5 text-[15px]">
      <p className="ph-heading text-[19px] font-bold">Linked bank accounts</p>
      <div className="rounded-lg border border-ph-border px-3 py-2">
        <p className="font-semibold">Business checking ••••6789</p>
        <p className="font-semibold text-ph-good">Active</p>
      </div>
      <div className="rounded-lg border border-ph-border px-3 py-2">
        <p className="font-semibold">Operating account ••••1234</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-ph-warn">Pending verification</span>
          <span className="rounded-md bg-ph-brand px-2.5 py-1 text-[13px] font-semibold text-ph-on-brand">
            Verify microdeposits
          </span>
        </div>
      </div>
      <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md border border-ph-brand px-3 py-1.5 font-semibold text-ph-brand">
        <Plus className="h-4 w-4" /> Link an account
      </span>
    </div>
  );
}

const EXPERIENCES = [
  {
    type: 'HOSTED_ONBOARDING_UI',
    name: 'Full onboarding',
    icon: Landmark,
    text: 'The complete KYC / KYB flow for new clients: business, people, questions, documents and review.',
    mock: (
      <FitToWidth designWidth={800} className="h-full">
        <OnboardingFlowWireframe />
      </FitToWidth>
    ),
  },
  {
    type: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
    name: 'Document upload',
    icon: FileUp,
    text: 'Just the outstanding document requests, the common re-entry point after review.',
    mock: <DocUploadMock />,
    isDefault: true,
  },
  {
    type: 'HOSTED_LINKED_ACCOUNTS_UI',
    name: 'Linked accounts',
    icon: Link2,
    text: 'List, link, edit and remove external bank accounts, including microdeposit verification.',
    mock: <LinkedAccountsMock />,
  },
];

export function ExperiencesSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Hosted experiences"
        title="Three hosted experiences, one integration"
        lead={
          <>
            Same session, same iframe. <Mono>hostedExperienceType</Mono> decides
            what renders.
          </>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-8">
        {EXPERIENCES.map((exp, i) => (
          <div
            key={exp.type}
            className="ph-dimmable flex min-h-0 flex-col gap-4 rounded-3xl border border-ph-border bg-ph-soft p-5"
            data-dim={i !== step}
            data-focus={i === step}
          >
            <BrowserFrame
              address="iframe · hosted by J.P. Morgan"
              className="h-[330px] shrink-0"
            >
              {exp.mock}
            </BrowserFrame>
            <div className="flex items-center gap-3">
              <exp.icon className="h-7 w-7 shrink-0 text-ph-brand" />
              <p className="ph-heading text-[28px] font-bold">{exp.name}</p>
              {exp.isDefault ? <Pill tone="accent">Default</Pill> : null}
            </div>
            <p className="font-mono text-[16px] font-semibold text-ph-brand-strong">
              {exp.type}
            </p>
            <p className="text-[19px] leading-snug text-ph-muted">{exp.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

const ONBOARDING_PROPS = `hostedExperienceType: 'HOSTED_ONBOARDING_UI',
componentProperties: {
  showLinkAccountStep: true,
  hideSidebar: false,
  alertOnExit: true,
  showDisclosureFooter: true,
  disclosurePlatformName: 'SellSense Marketplace',
  disclosureProductName: 'Wallet Accounts',
}`;

const LINKED_PROPS = `hostedExperienceType: 'HOSTED_LINKED_ACCOUNTS_UI',
componentProperties: {
  mode: 'single',
  viewMode: 'compact-cards',
  hideRemoveRecipient: true,
  showRejectedAccounts: true,
}`;

export function ComponentPropertiesSlide({ step }: SlideViewProps) {
  return (
    <>
      <SlideHeader
        kicker="Hosted experiences"
        title="Tune each experience with componentProperties"
        lead="JSON-serialisable props travel in the URL. Each experience has its own set."
      />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-10">
        <div
          className="ph-dimmable flex min-h-0 flex-col gap-3"
          data-dim={step === 1}
        >
          <CodePanel
            code={ONBOARDING_PROPS}
            language="javascript"
            fontSize={20}
            label="Onboarding"
          />
          <p className="text-[19px] text-ph-muted">
            <Mono>showLinkAccountStep</Mono> adds linked bank accounts inside
            onboarding. Disclosure props name your platform and product.
          </p>
        </div>
        <Reveal shown={step >= 1} className="flex min-h-0 flex-col gap-3">
          <CodePanel
            code={LINKED_PROPS}
            language="javascript"
            fontSize={20}
            label="Linked accounts"
          />
          <p className="text-[19px] text-ph-muted">
            Lists or a single account, cards or table, and whether users can
            remove or see rejected accounts.
          </p>
        </Reveal>
      </div>
      <Reveal shown={step >= 2} className="mt-6">
        <div className="flex gap-5 rounded-2xl border-l-[6px] border-ph-warn bg-ph-warn-soft px-6 py-4">
          <TriangleAlert className="mt-1 h-8 w-8 shrink-0 text-ph-warn" />
          <div className="text-[20px] leading-snug">
            <p className="font-bold">Validation is strict</p>
            <p>
              One unknown key or invalid value rejects the whole object and the
              experience falls back to defaults. <Mono>showLinkedAccounts</Mono>{' '}
              is not <Mono>showLinkAccountStep</Mono>. Callbacks, render
              functions and class names cannot travel in a URL.
            </p>
          </div>
        </div>
      </Reveal>
    </>
  );
}
