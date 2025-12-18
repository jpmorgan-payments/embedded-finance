import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JOURNEY_ID } from './types';
import type { OasOperationInfo } from './types';
import {
  WorkflowSelector,
  StepCard,
  JourneyView,
  StepDetailsView,
} from './components';
import {
  parseArazzoSpec,
  parseOasSpec,
  findOasOperation,
  detectHttpVerb,
  truncateWords,
} from './utils/schema-utils';

// Raw import of YAML specs (Vite supports ?raw)
import arazzoSpecRaw from './specs/arazzo_specification.yaml?raw';
import oasSpecRaw from './specs/embedded-finance-pub-smbdo-1.0.16.yaml?raw';

/**
 * Main component for visualizing Arazzo workflows with OpenAPI details
 */

export function ArazzoFlowDialogContent(): React.ReactElement {
  const arazzoSpec = React.useMemo(() => parseArazzoSpec(arazzoSpecRaw), []);
  const oasSpec = React.useMemo(() => parseOasSpec(oasSpecRaw), []);

  const workflows = arazzoSpec?.workflows ?? [];
  const [workflowId, setWorkflowId] = React.useState<string>(
    workflows[0]?.workflowId ?? '',
  );
  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(
    null,
  );

  const activeWorkflow = React.useMemo(
    () => workflows.find((w) => w.workflowId === workflowId) ?? workflows[0],
    [workflows, workflowId],
  );

  // Default to journey selection when workflow changes
  React.useEffect(() => {
    if (activeWorkflow) {
      setSelectedStepId(JOURNEY_ID);
    }
  }, [activeWorkflow?.workflowId]);

  const selectedStep = React.useMemo(() => {
    if (!activeWorkflow || !selectedStepId || selectedStepId === JOURNEY_ID)
      return null;
    return (
      (activeWorkflow.steps ?? []).find((s) => s.stepId === selectedStepId) ??
      null
    );
  }, [activeWorkflow, selectedStepId]);

  // Get OAS operation info for the selected step
  const selectedOasOperation = React.useMemo(() => {
    if (!selectedStep?.operationId || !oasSpec) return undefined;
    return findOasOperation(selectedStep.operationId, oasSpec);
  }, [selectedStep, oasSpec]);

  // Get OAS operation info for all steps in the workflow
  const stepOasOperations = React.useMemo(() => {
    if (!activeWorkflow?.steps || !oasSpec) return {};

    const operations: Record<string, OasOperationInfo> = {};
    activeWorkflow.steps.forEach((step) => {
      if (step.operationId) {
        operations[step.stepId] = findOasOperation(
          step.operationId,
          oasSpec,
        ) || {
          verb: detectHttpVerb(step.operationId),
          path: '',
        };
      }
    });

    return operations;
  }, [activeWorkflow, oasSpec]);

  if (!arazzoSpec) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Unable to load Arazzo specification.</span>
      </div>
    );
  }

  if (!oasSpec) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Unable to load OpenAPI specification.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 max-h-[85vh] overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Separator className="hidden md:block h-6" orientation="vertical" />
          <div className="text-sm text-muted-foreground">
            Visualizing steps from Arazzo spec
          </div>
        </div>
        <WorkflowSelector
          workflows={workflows}
          activeWorkflow={activeWorkflow}
          onWorkflowChange={setWorkflowId}
        />
      </div>
      <div className="mt-1 grid grid-cols-4 gap-6 flex-1 overflow-hidden h-[calc(85vh-90px)]">
        {/* Left: Steps list */}
        <div className="space-y-3 col-span-1 overflow-y-auto pr-1 max-h-full">
          {/* Journey overview card */}
          <button
            onClick={() => setSelectedStepId(JOURNEY_ID)}
            className={cn(
              'w-full text-left rounded-lg border p-3 bg-white',
              'hover:border-jpm-brown-300 hover:bg-jpm-brown-50 transition-colors',
              selectedStepId === JOURNEY_ID &&
                'border-jpm-brown bg-jpm-brown-50',
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Badge
                className="text-[10px] px-2 py-0.5 border bg-jpm-brown-100 text-jpm-brown-900 border-jpm-brown-300"
                variant="outline"
              >
                WORKFLOW
              </Badge>
              <div className="text-xs text-muted-foreground">
                {(activeWorkflow?.steps ?? []).length} steps
              </div>
            </div>
            <div className="text-sm leading-5 line-clamp-3">
              {truncateWords(activeWorkflow?.summary, 24) || 'Journey overview'}
            </div>
          </button>
          {(activeWorkflow?.steps ?? []).map((step) => (
            <StepCard
              key={step.stepId}
              step={step}
              isSelected={selectedStepId === step.stepId}
              onClick={() => setSelectedStepId(step.stepId)}
              oasOperation={stepOasOperations[step.stepId]}
            />
          ))}
        </div>
        {/* Right: Detail (journey or step) */}
        <div className="bg-jpm-brown-50 rounded-lg border border-jpm-brown-200 overflow-hidden col-span-3 h-full flex flex-col">
          {selectedStepId === JOURNEY_ID ? (
            <JourneyView
              activeWorkflow={activeWorkflow}
              stepOasOperations={stepOasOperations}
              oasSpec={oasSpec}
            />
          ) : (
            <StepDetailsView
              selectedStep={selectedStep}
              selectedOasOperation={selectedOasOperation}
              oasSpec={oasSpec}
            />
          )}
        </div>
      </div>
    </div>
  );
}
