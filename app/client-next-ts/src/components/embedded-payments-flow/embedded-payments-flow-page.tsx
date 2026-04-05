import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  BookOpen,
  Boxes,
  ExternalLink,
  Github,
  Grid3x3,
  ListTree,
  SplitSquareVertical,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DataObjectMap,
  ScenarioObjectChips,
} from '@/components/embedded-payments-flow/data-object-map';
import { cn } from '@/lib/utils';
import {
  API_BASE_URLS,
  CAPABILITY_COLUMNS,
  INTEGRATION_SCENARIOS,
  PDP_OVERVIEW,
  type CapabilityColumnId,
  type CapabilityPresence,
  type FlowStep,
} from '@/lib/embedded-payments-flow/scenarios';

type MainView = 'flows' | 'matrix' | 'object-map';

function presenceSymbol(p: CapabilityPresence): string {
  if (p === 'yes') return 'Yes';
  if (p === 'no') return '—';
  return 'Optional';
}

function presenceClass(p: CapabilityPresence): string {
  if (p === 'yes') return 'bg-emerald-50 text-emerald-900';
  if (p === 'no') return 'bg-slate-50 text-slate-400';
  return 'bg-amber-50 text-amber-900';
}

export function EmbeddedPaymentsFlowPage() {
  const [view, setView] = useState<MainView>('flows');
  const [scenarioId, setScenarioId] = useState(INTEGRATION_SCENARIOS[0].id);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const scenario = useMemo(
    () => INTEGRATION_SCENARIOS.find((s) => s.id === scenarioId)!,
    [scenarioId]
  );

  useEffect(() => {
    if (scenario.layout === 'split' && scenario.branches) {
      setActiveStepId(scenario.branches[0].steps[0]?.id ?? null);
    } else {
      setActiveStepId(scenario.steps[0]?.id ?? null);
    }
  }, [scenario]);

  const flatSteps: FlowStep[] = useMemo(() => {
    if (scenario.layout === 'split' && scenario.branches) {
      return [...scenario.branches[0].steps, ...scenario.branches[1].steps];
    }
    return scenario.steps;
  }, [scenario]);

  const selectedStep: FlowStep | null = useMemo(() => {
    if (!activeStepId) return flatSteps[0] ?? null;
    return flatSteps.find((s) => s.id === activeStepId) ?? null;
  }, [activeStepId, flatSteps]);

  const scenarioObjectIdSet = useMemo(
    () => new Set(scenario.dataObjectsInvolved),
    [scenario]
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-sp-accent">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-sp-brand">
            Developer tool
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            Embedded Payments flow simulator
          </h1>
          <p className="mt-3 text-page-body leading-relaxed text-gray-600">
            Compare how Clients, Accounts, Recipients, Transactions, and
            Notifications fit together across common integration shapes. Links
            point to Payments Developer Portal topics and open-source recipes
            used in this showcase. Step paths follow the repo OpenAPI specs
            (Digital Onboarding, Embedded v1/v2, EF webhooks).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={PDP_OVERVIEW}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-sp-border bg-white px-3 py-1 text-xs font-semibold text-sp-brand shadow-sm transition-colors hover:bg-gray-50"
            >
              Embedded Payments on PDP
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <LinkToSellsense />
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg border border-sp-border bg-white p-1 shadow-sm">
            <Button
              type="button"
              variant={view === 'flows' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'gap-1.5',
                view === 'flows' ? '' : 'text-gray-600'
              )}
              onClick={() => setView('flows')}
            >
              <ListTree className="h-4 w-4" />
              Scenarios
            </Button>
            <Button
              type="button"
              variant={view === 'matrix' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'gap-1.5',
                view === 'matrix' ? '' : 'text-gray-600'
              )}
              onClick={() => setView('matrix')}
            >
              <Grid3x3 className="h-4 w-4" />
              Capability matrix
            </Button>
            <Button
              type="button"
              variant={view === 'object-map' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'gap-1.5',
                view === 'object-map' ? '' : 'text-gray-600'
              )}
              onClick={() => setView('object-map')}
            >
              <Boxes className="h-4 w-4" />
              Data objects
            </Button>
          </div>

          {(view === 'flows' || view === 'object-map') && (
            <div className="flex flex-col gap-1.5 sm:w-80">
              <Label htmlFor="scenario-select" className="text-xs text-gray-500">
                Integration scenario
              </Label>
              <Select value={scenarioId} onValueChange={setScenarioId}>
                <SelectTrigger id="scenario-select" className="bg-white">
                  <SelectValue placeholder="Select scenario">
                    {INTEGRATION_SCENARIOS.find((s) => s.id === scenarioId)
                      ?.name ?? scenarioId}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INTEGRATION_SCENARIOS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {view === 'matrix' ? (
          <CapabilityMatrix />
        ) : view === 'object-map' ? (
          <div className="space-y-4">
            <Card className="border-sp-border shadow-page-card">
              <CardHeader className="border-b border-sp-border pb-4">
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                <p className="text-sm text-gray-600">{scenario.tagline}</p>
                <p className="mt-2 text-sm text-gray-700">{scenario.whenToUse}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <DataObjectMap activeObjectIds={scenarioObjectIdSet} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="border-sp-border shadow-page-card lg:col-span-3">
              <CardHeader className="border-b border-sp-border pb-4">
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                <p className="text-sm text-gray-600">{scenario.tagline}</p>
                <p className="mt-2 text-sm text-gray-700">{scenario.whenToUse}</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b border-sp-border px-4 pb-0 pt-4">
                  <ScenarioObjectChips
                    objectIds={scenario.dataObjectsInvolved}
                  />
                </div>
                <ScrollArea className="h-[min(70vh,640px)]">
                  <div className="p-4">
                    {scenario.layout === 'split' && scenario.branches ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {scenario.branches.map((branch) => (
                          <div key={branch.title}>
                            <div className="mb-3 flex items-start gap-2">
                              <SplitSquareVertical className="mt-0.5 h-4 w-4 shrink-0 text-sp-brand" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {branch.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {branch.subtitle}
                                </p>
                              </div>
                            </div>
                            <FlowTimeline
                              steps={branch.steps}
                              activeStepId={activeStepId}
                              onSelect={setActiveStepId}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <FlowTimeline
                        steps={scenario.steps}
                        activeStepId={activeStepId}
                        onSelect={setActiveStepId}
                      />
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-sp-border shadow-page-card lg:col-span-2">
              <CardHeader className="border-b border-sp-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-sp-brand" />
                  Step detail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {selectedStep ? (
                  <StepDetail step={selectedStep} />
                ) : (
                  <p className="text-sm text-gray-500">Select a step.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkToSellsense() {
  return (
    <a
      href="/sellsense-demo"
      className="inline-flex items-center rounded-full border border-sp-border bg-white px-3 py-1 text-xs font-semibold text-sp-brand shadow-sm transition-colors hover:bg-gray-50"
    >
      Open component showcase (SellSense)
    </a>
  );
}

function FlowTimeline({
  steps,
  activeStepId,
  onSelect,
}: {
  steps: FlowStep[];
  activeStepId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const active = activeStepId === step.id;
        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  active
                    ? 'bg-sp-brand text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:border-sp-brand hover:text-sp-brand'
                )}
                aria-current={active ? 'step' : undefined}
              >
                {i + 1}
              </button>
              {i < steps.length - 1 && (
                <ArrowDown className="my-1 h-4 w-4 text-gray-300" aria-hidden />
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              className={cn(
                'mb-4 flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors',
                active
                  ? 'border-sp-brand bg-blue-50/60'
                  : 'border-transparent bg-white hover:border-gray-200'
              )}
            >
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {step.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {step.apiHints.map((h) => (
                  <code
                    key={h}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-800"
                  >
                    {h}
                  </code>
                ))}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepDetail({ step }: { step: FlowStep }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {step.description}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase text-gray-500">API surface</p>
        <ul className="mt-1 space-y-1">
          {step.apiHints.map((h) => (
            <li key={h}>
              <code className="text-xs text-gray-800">{h}</code>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href={step.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-sp-brand hover:underline"
        >
          <BookOpen className="h-4 w-4" />
          Payments Developer Portal
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {step.recipeUrl && (
          <a
            href={step.recipeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-sp-brand hover:underline"
          >
            <Github className="h-4 w-4" />
            Recipe / requirements in repo
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <p className="mt-4 border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-500">
        API bases (production examples): Digital Onboarding{' '}
        <span className="font-mono text-gray-600">
          {API_BASE_URLS.digitalOnboarding}
        </span>
        ; Embedded{' '}
        <span className="font-mono text-gray-600">
          {API_BASE_URLS.embeddedV1}
        </span>
        ,{' '}
        <span className="font-mono text-gray-600">
          {API_BASE_URLS.embeddedV2}
        </span>
        ; webhooks{' '}
        <span className="font-mono text-gray-600">
          {API_BASE_URLS.embeddedBankingEf}
        </span>
        .
      </p>
    </div>
  );
}

function CapabilityMatrix() {
  return (
    <Card className="border-sp-border shadow-page-card">
      <CardHeader className="border-b border-sp-border">
        <CardTitle className="text-lg">Which capabilities per scenario</CardTitle>
        <p className="text-sm text-gray-600">
          Rows are PDP-style capability areas; cells show whether that scenario
          typically includes them.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[min(75vh,720px)] w-full">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sp-border bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 font-semibold text-gray-900">
                  Capability
                </th>
                {INTEGRATION_SCENARIOS.map((s) => (
                  <th
                    key={s.id}
                    className="min-w-[100px] px-2 py-3 text-center text-[11px] font-semibold leading-snug text-gray-800"
                  >
                    {s.matrixLabel.split('\n').map((line, idx) => (
                      <span key={idx} className="block">
                        {line}
                      </span>
                    ))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_COLUMNS.map((col) => (
                <tr key={col.id} className="border-b border-gray-100">
                  <th className="sticky left-0 bg-white px-3 py-2.5 text-left font-medium text-gray-800">
                    <span className="block">{col.label}</span>
                    <span className="text-xs font-normal text-gray-500">
                      {col.short}
                    </span>
                  </th>
                  {INTEGRATION_SCENARIOS.map((s) => (
                    <td key={s.id} className="px-2 py-2 text-center align-middle">
                      <MatrixCell
                        value={s.capabilities[col.id as CapabilityColumnId]}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MatrixCell({ value }: { value: CapabilityPresence }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'justify-center px-2 py-0.5 text-[10px] font-semibold',
        presenceClass(value)
      )}
    >
      {presenceSymbol(value)}
    </Badge>
  );
}
