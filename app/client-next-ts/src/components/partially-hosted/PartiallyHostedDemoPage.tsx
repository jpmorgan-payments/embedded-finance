import { useEffect, useState } from 'react';
import { ExternalLink, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CodeBlock } from '@/components/partially-hosted/code-block';
import type { IntegrationStep } from '@/components/partially-hosted/integration-steps';
import { integrationSteps } from '@/components/partially-hosted/integration-steps';
import { StepContent } from '@/components/partially-hosted/step-content';
import { Mermaid } from '@/components/mermaid';

export function PartiallyHostedDemoPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeStep: IntegrationStep = integrationSteps[activeIndex];

  // Map the current integration step to sequence step(s) in the diagram
  // Can be a single number or array of numbers to highlight multiple steps
  const activeSequenceStepByIndex: (number | number[])[] = [
    1, // Overview → (1) User opens embedded experience
    2, // Backend API → (2) Frontend → Backend POST /sessions
    [3, 4, 5], // Get token → (3–5) Backend ↔ Hosted Service ↔ Frontend session exchange
    6, // Embed iframe → (6) Frontend loads iframe with URL
    7, // Utility library → (7) Utility manages iframe + theme/content tokens
    7, // Theme tokens → (7) Utility manages iframe + theme/content tokens
    7, // Content tokens → (7) Utility manages iframe + theme/content tokens
    [8, 9], // Events & security → (8–9) Events and status updates
  ];
  const activeSequenceStep =
    activeSequenceStepByIndex[activeIndex] ??
    activeSequenceStepByIndex[activeSequenceStepByIndex.length - 1];

  const mermaidDiagram = `
sequenceDiagram
    %% Participants
    participant User
    participant PlatformFrontend as Platform Frontend
    participant PlatformBackend as Platform Backend
    participant HostedService as Hosted UI / Service

    %% Message definitions with step IDs
    User->>PlatformFrontend: (1) Open embedded experience
    PlatformFrontend->>PlatformBackend: (2) POST /sessions { clientId, experienceType }
    PlatformBackend->>HostedService: (3) Create embedded session
    HostedService-->>PlatformBackend: (4) Return { url, token }
    PlatformBackend-->>PlatformFrontend: (5) Session response
    PlatformFrontend->>HostedService: (6) Load iframe with url
    PlatformFrontend->>HostedService: (7) Utility manages iframe + theme/content tokens
    HostedService-->>PlatformFrontend: (8) Optional postMessage events
    PlatformFrontend->>PlatformBackend: (9) Optional status updates
`;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) =>
        prev + 1 < integrationSteps.length ? prev + 1 : 0,
      );
    }, 3200);

    return () => clearTimeout(timer);
  }, [activeIndex, isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveIndex(0);
  };

  return (
    <div className="min-h-screen bg-sp-bg py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <header className="mb-10 text-left lg:mb-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 lg:basis-1/3 lg:flex-none">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sp-brand">
                Interactive Integration Guide
              </p>
              <h1 className="mt-3 text-page-h2 font-bold text-jpm-gray-900">
                Partially Hosted Embedded Components
              </h1>
              <div className="mt-6 flex flex-wrap items-center justify-start gap-3">
                <Button
                  type="button"
                  size="sm"
                  className="bg-sp-brand px-5 py-2 text-xs font-semibold text-white hover:bg-sp-brand-700"
                  onClick={isPlaying ? handleReset : handlePlay}
                >
                  {isPlaying ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Auto Play
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Auto Play
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-sp-brand text-sp-brand hover:bg-sp-accent"
                  asChild
                >
                  <a
                    href="/sellsense-demo?fullscreen=true&component=onboarding&theme=Empty&view=onboarding"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    Open live onboarding demo
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-sp-border text-jpm-gray hover:bg-sp-accent"
                  asChild
                >
                  <a
                    href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UTILITY_GUIDE.md"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    Open integration guide
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="mt-2 w-full px-3 py-3 text-xs lg:mt-0 lg:basis-2/3 lg:flex-none">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sp-brand">
                Sequence overview
              </p>
              <div className="min-h-[200px] w-full">
                <Mermaid
                  className="mermaid w-full overflow-hidden [&_svg]:w-full [&_svg]:h-auto"
                  highlightStep={activeSequenceStep}
                >
                  {mermaidDiagram}
                </Mermaid>
              </div>
            </div>
          </div>
        </header>

        <Card className="border-0 bg-jpm-white shadow-page-card rounded-page-md">
          {/* Top step rail */}
          <CardHeader className="border-b border-sp-border/70 pb-3">
            <div className="flex flex-col gap-3 text-[15px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 font-medium text-muted-foreground">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sp-brand text-[13px] font-semibold text-white">
                    {activeIndex + 1}
                  </span>
                  <span className="text-[15px] text-jpm-gray-900">
                    {activeStep.title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[13px] text-jpm-gray">
                  <span className="font-medium">
                    Step {activeIndex + 1} of {integrationSteps.length}
                  </span>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs border-sp-border text-jpm-gray hover:bg-sp-accent"
                      disabled={activeIndex === 0}
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 px-4 text-xs bg-sp-brand text-white hover:bg-sp-brand-700"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveIndex((prev) =>
                          prev + 1 < integrationSteps.length ? prev + 1 : prev,
                        );
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              <div className="hidden w-full items-center justify-between gap-1 lg:flex">
                {integrationSteps.map((step, index) => {
                  const isActive = index === activeIndex;
                  const isComplete = index < activeIndex;
                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveIndex(index);
                      }}
                      className="flex flex-1 flex-col items-center gap-1 text-xs"
                    >
                      <span className="truncate text-[12px] text-jpm-gray">
                        {step.label}
                      </span>
                      <span
                        className={[
                          'h-1 w-full rounded-full',
                          isActive
                            ? 'bg-sp-brand'
                            : isComplete
                              ? 'bg-sp-brand/50'
                              : 'bg-sp-border/40',
                        ].join(' ')}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          {/* Main content: key points + code */}
          <CardContent className="bg-jpm-white">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-page-h3 font-bold text-jpm-gray-900">
                    {activeStep.title}
                  </CardTitle>
                  <CardDescription className="text-page-body text-jpm-gray">
                    {activeStep.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <StepContent step={activeStep} />
                </CardContent>
              </Card>

              <CodeBlock
                code={activeStep.code}
                language={activeStep.language}
                highlight={activeStep.highlight}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
