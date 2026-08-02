'use client';

import { useEffect } from 'react';
import {
  Brush,
  Building2,
  CheckCircle,
  Circle,
  Database,
  Info,
  Languages,
  Link,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  UserCheck,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  AVAILABLE_COMPONENTS,
  getScenarioByKey,
  getVisibleComponentsForScenario,
  SCENARIO_ORDER,
  type ScenarioKey,
} from './scenarios-config';
import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeOption;
}

const COMPONENT_BLURBS: Record<string, string> = {
  OnboardingFlow:
    'Hosted onboarding wizard: business/controller/owners, operational questions, document upload, review & attest. Supports delta mode, link-account step, and PTC paths.',
  Accounts: 'Embedded account cards with balances and account identifiers.',
  LinkedAccountWidget:
    'Link and manage external bank accounts (cards/table views, microdeposits when applicable).',
  TransactionsDisplay:
    'Transaction history list with filtering/search patterns.',
  Recipients:
    'Payment recipients list; Pay can open domestic PaymentFlow or FX PaymentFlowFX by scenario.',
  PaymentFlow:
    'Domestic payment initiation used from Recipients (and related wallet demos).',
  ClientDetails:
    'Read-only client profile/status summary used on richer active-seller layouts.',
};

/** Short “what to look for” copy for integrators — kept here so scenario-config stays demo-runtime focused. */
const SCENARIO_INTEGRATOR_NOTES: Partial<Record<ScenarioKey, string>> = {
  'new-seller-onboarding':
    'Empty client — full step-by-step OnboardingFlow from gateway.',
  'onboarding-in-review':
    'Prefilled US LLC — standard overview / complete remaining sections.',
  'onboarding-in-review-delta':
    'Same rich LLC shape with a few operational questions outstanding; `deltaMode` + skip terms-document acknowledgment.',
  'onboarding-in-review-link-account':
    'In-review client with editable link-account step and microdeposits mock.',
  'onboarding-docs-needed':
    'INFORMATION_REQUESTED — lands on document upload for outstanding requests.',
  'fresh-start': 'Active sole prop — Accounts + LinkedAccountWidget only.',
  'active-seller-limited-dda':
    'Limited DDA wallet: accounts, linked accounts, transactions.',
  'active-seller-limited-dda-payments':
    'Payments DDA layout: client details, accounts, linked accounts (table), recipients, transactions.',
  'active-seller-fx-payments':
    'Same Payments DDA shell with FX recipients / PaymentFlowFX on Pay.',
};

export function InfoModal({ isOpen, onClose, theme }: InfoModalProps) {
  const themeStyles = useThemeStyles(theme);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getComponentIcon = (componentName: string) => {
    switch (componentName) {
      case 'OnboardingFlow':
        return <Users className="h-4 w-4" />;
      case 'Accounts':
        return <Building2 className="h-4 w-4" />;
      case 'LinkedAccountWidget':
        return <Link className="h-4 w-4" />;
      case 'TransactionsDisplay':
        return <Receipt className="h-4 w-4" />;
      case 'Recipients':
        return <UserCheck className="h-4 w-4" />;
      case 'PaymentFlow':
        return <Zap className="h-4 w-4" />;
      case 'ClientDetails':
        return <Users className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getScenarioCategoryColor = (category: string) => {
    switch (category) {
      case 'onboarding':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`flex h-[min(80vh,52rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg shadow-2xl ${themeStyles.getModalStyles()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sellsense-info-title"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-600" />
            <div>
              <h2 id="sellsense-info-title" className="text-xl font-bold">
                SellSense Demo Showcase
              </h2>
              <p className="text-xs text-slate-500">
                Integrator reference — what’s in this shell and how to drive it
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pb-8">
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              What you’re looking at
            </h3>
            <Card>
              <CardContent className="space-y-2 p-4 text-sm text-gray-600">
                <p>
                  SellSense is a <strong>marketplace-shaped host app</strong>{' '}
                  that embeds{' '}
                  <code className="rounded bg-slate-100 px-1 text-xs">
                    @jpmorgan-payments/embedded-finance-components
                  </code>
                  . Use it to walk through real component surfaces (onboarding,
                  accounts, linked accounts, recipients, payments, transactions)
                  against <strong>in-browser MSW mocks</strong> — nothing is
                  sent to J.P. Morgan backends from this demo.
                </p>
                <p>
                  Scenarios swap client seed data and which widgets are mounted.
                  Header tools let you change theme / content tone, override
                  OnboardingFlow host props, edit content tokens, and patch mock
                  API JSON for the current session.
                </p>
              </CardContent>
            </Card>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                'Scenario switcher (short names, grouped list, prev/next)',
                'Themes + content tone (Standard / Friendly)',
                'Component props drawer (OnboardingFlow host config)',
                'Content token editor + mock API response editor',
                'Fullscreen component links from card controls',
                'All network I/O mocked with MSW (reload mock data to reseed)',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              How to drive the demo
            </h3>
            <Card>
              <CardContent className="grid gap-3 p-4 text-sm text-gray-600 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 font-semibold text-gray-800">
                    Scenario & chrome
                  </h4>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      Center pill: prev/next, open scenario menu, index{' '}
                      <span className="tabular-nums">n/N</span>
                    </li>
                    <li>
                      Onboarding scenarios force the Onboarding view; active
                      scenarios open the wallet/dashboard layout
                    </li>
                    <li>
                      Theme and content tone are controlled via URL params and
                      the header tool drawers (brush / languages)
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">
                    Header tool icons
                  </h4>
                  <ul className="space-y-2">
                    {(
                      [
                        {
                          Icon: Info,
                          label: 'Demo information',
                          detail: 'This dialog',
                        },
                        {
                          Icon: Brush,
                          label: 'Customize theme',
                          detail: 'Theme tokens / custom theme',
                        },
                        {
                          Icon: Languages,
                          label: 'Edit content tokens',
                          detail: 'Copy / token overrides',
                        },
                        {
                          Icon: SlidersHorizontal,
                          label: 'Edit component props',
                          detail:
                            'OnboardingFlow host props (deltaMode, link-account, …)',
                        },
                        {
                          Icon: Database,
                          label: 'Edit mock API responses',
                          detail: 'Per-endpoint mock JSON overrides',
                        },
                        {
                          Icon: RotateCcw,
                          label: 'Reset overrides',
                          detail:
                            'Clear theme, content token, and prop overrides',
                        },
                      ] as const satisfies ReadonlyArray<{
                        Icon: LucideIcon;
                        label: string;
                        detail: string;
                      }>
                    ).map(({ Icon, label, detail }) => (
                      <li key={label} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                          aria-hidden="true"
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 leading-snug">
                          <span className="block font-medium text-gray-800">
                            {label}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {detail}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-800">
                Scenarios ({SCENARIO_ORDER.length})
              </h3>
              <p className="text-xs text-slate-500">
                Sourced from live <code>SCENARIO_ORDER</code>
              </p>
            </div>
            <div className="space-y-2">
              {SCENARIO_ORDER.map((scenarioKey, index) => {
                const scenario = getScenarioByKey(scenarioKey);
                const visibleComponents = getVisibleComponentsForScenario(
                  scenario.displayName
                );
                const note = SCENARIO_INTEGRATOR_NOTES[scenarioKey];

                return (
                  <Card
                    key={scenarioKey}
                    className="border-l-4 border-l-blue-500"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm">
                              {scenario.shortName}
                            </CardTitle>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {scenario.displayName}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {note ?? scenario.description}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={getScenarioCategoryColor(
                            scenario.category
                          )}
                        >
                          {scenario.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {scenario.category === 'onboarding' ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                          >
                            {getComponentIcon('OnboardingFlow')}
                            OnboardingFlow
                          </Badge>
                        ) : null}
                        {visibleComponents.map((config) => (
                          <Badge
                            key={`${scenarioKey}-${config.component}-${config.paymentFlowVariant ?? 'default'}`}
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                          >
                            {getComponentIcon(config.component)}
                            {config.component}
                            {config.paymentFlowVariant === 'fx'
                              ? ' → FX'
                              : null}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              Embedded components in this package
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(AVAILABLE_COMPONENTS).map(
                ([key, componentName]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {getComponentIcon(componentName)}
                        <CardTitle className="text-sm">
                          {componentName}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600">
                        {COMPONENT_BLURBS[componentName]}
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
            <p className="text-xs text-slate-500">
              PaymentFlowFX is used when a scenario marks Recipients with{' '}
              <code>paymentFlowVariant: &apos;fx&apos;</code> (FX Payments
              scenario). It is not a separate entry in{' '}
              <code>AVAILABLE_COMPONENTS</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              Architecture (demo shell)
            </h3>
            <Card>
              <CardContent className="grid gap-4 p-4 text-sm text-gray-600 md:grid-cols-3">
                <div>
                  <h4 className="mb-1 font-semibold text-blue-700">Host app</h4>
                  <p>
                    Vite + React showcase (`client-next-ts`). SellSense layout,
                    URL search params (`scenario`, `theme`, `contentTone`,
                    `view`, `fullscreen`), and demo drawers.
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-green-700">
                    Component library
                  </h4>
                  <p>
                    Local <code>file:</code> dependency on{' '}
                    <code>embedded-components</code>. Rebuild that package when
                    you need latest OnboardingFlow / widget behaviour in the
                    demo.
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-purple-700">Mocks</h4>
                  <p>
                    MSW service worker + in-memory DB. Scenario switches call{' '}
                    <code>_reset</code> with a seed; optional localStorage
                    overrides reapply on reset.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
