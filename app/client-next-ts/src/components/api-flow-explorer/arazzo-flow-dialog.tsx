import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import YAML from 'yaml';

// Raw import of YAML spec (Vite supports ?raw)
import arazzoSpecRaw from './specs/arazzo_specification.yaml?raw';

interface ArazzoWorkflowStep {
  stepId: string;
  description?: string;
  operationId?: string;
  onSuccess?: Array<{ reference?: string; stepId?: string } | string>;
  requestBody?: {
    contentType?: string;
    payload?: unknown;
  };
}

interface ArazzoWorkflow {
  workflowId: string;
  summary?: string;
  steps?: ArazzoWorkflowStep[];
}

interface ArazzoSpec {
  workflows?: ArazzoWorkflow[];
}

const JOURNEY_ID = '__journey__';

function truncateWords(input?: string, maxWords: number = 12): string {
  if (!input) return '';
  const words = input.trim().split(/\s+/);
  if (words.length <= maxWords) return input;
  return words.slice(0, maxWords).join(' ') + '…';
}

function parseArazzoSpec(rawText: string): ArazzoSpec | null {
  try {
    const parsed = YAML.parse(rawText) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as ArazzoSpec;
    return null;
  } catch {
    return null;
  }
}

function detectHttpVerb(
  operationId?: string,
): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CALL' {
  const id = (operationId || '').toLowerCase();
  if (id.includes('post')) return 'POST';
  if (id.includes('get')) return 'GET';
  if (id.includes('put')) return 'PUT';
  if (id.includes('patch')) return 'PATCH';
  if (id.includes('delete')) return 'DELETE';
  return 'CALL';
}

function getStepPayload(step?: ArazzoWorkflowStep): unknown | undefined {
  return step?.requestBody?.payload;
}

function flattenJsonPaths(
  value: unknown,
  basePath = '$',
): { path: string; value: unknown }[] {
  const rows: { path: string; value: unknown }[] = [];
  function walk(v: unknown, p: string) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        walk(child, `${p}.${k}`);
      }
    } else if (Array.isArray(v)) {
      v.forEach((child, idx) => walk(child, `${p}[${idx}]`));
    } else {
      rows.push({ path: p, value: v });
    }
  }
  if (value !== undefined) walk(value, basePath);
  return rows;
}

export function ArazzoFlowDialogContent(): JSX.Element {
  const spec = React.useMemo(() => parseArazzoSpec(arazzoSpecRaw), []);
  const workflows = spec?.workflows ?? [];
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
    if (!activeWorkflow || !selectedStepId) return null;
    return (
      (activeWorkflow.steps ?? []).find((s) => s.stepId === selectedStepId) ??
      null
    );
  }, [activeWorkflow, selectedStepId]);

  if (!spec) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Unable to load Arazzo specification.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: 700 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Separator className="hidden md:block h-6" orientation="vertical" />
          <div className="text-sm text-muted-foreground">
            Visualizing steps from Arazzo spec
          </div>
        </div>
        {workflows.length > 0 && (
          <div className="w-64">
            <Select
              value={activeWorkflow?.workflowId}
              onValueChange={setWorkflowId}
            >
              <SelectTrigger aria-label="Workflow selector">
                <SelectValue placeholder="Select workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((w) => (
                  <SelectItem key={w.workflowId} value={w.workflowId}>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">
                        {w.workflowId}
                      </span>
                      {w.summary && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {truncateWords(w.summary, 14)}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="mt-1 grid grid-cols-4 gap-6 h-[70vh]">
        {/* Left: Steps list */}
        <div className="space-y-3 col-span-1 overflow-auto pr-1">
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

          {(activeWorkflow?.steps ?? []).map((s) => {
            const verb = detectHttpVerb(s.operationId);
            const isSelected = selectedStepId === s.stepId;
            return (
              <button
                key={s.stepId}
                onClick={() => setSelectedStepId(s.stepId)}
                className={cn(
                  'w-full text-left rounded-lg border p-3 bg-white',
                  'hover:border-jpm-brown-300 hover:bg-jpm-brown-50 transition-colors',
                  isSelected && 'border-jpm-brown bg-jpm-brown-50',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={cn(
                      'text-[10px] px-2 py-0.5 border',
                      verb === 'GET' &&
                        'bg-blue-50 text-blue-700 border-blue-200',
                      verb === 'POST' &&
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                      verb === 'PUT' &&
                        'bg-amber-50 text-amber-700 border-amber-200',
                      verb === 'PATCH' &&
                        'bg-purple-50 text-purple-700 border-purple-200',
                      verb === 'DELETE' &&
                        'bg-rose-50 text-rose-700 border-rose-200',
                      verb === 'CALL' &&
                        'bg-jpm-brown-100 text-jpm-brown-900 border-jpm-brown-300',
                    )}
                    variant="outline"
                  >
                    {verb}
                  </Badge>
                  {s.operationId && (
                    <span className="text-[10px] text-muted-foreground">
                      {(() => {
                        const id = s.operationId.toLowerCase();
                        if (id.includes('clients')) return '/clients';
                        if (id.includes('questions')) return '/questions';
                        if (id.includes('parties')) return '/parties/{id}';
                        if (id.includes('document-requests'))
                          return '/document-requests/{id}';
                        if (id.includes('documents') && id.includes('file'))
                          return '/documents/{id}/file';
                        if (id.includes('documents')) return '/documents';
                        if (id.includes('verifications'))
                          return '/clients/{id}/verifications';
                        return '';
                      })()}
                    </span>
                  )}
                </div>
                <div className="text-sm leading-5 line-clamp-3">
                  {s.description || s.stepId}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Detail (journey or step) */}
        <div className="bg-jpm-brown-50 rounded-lg border border-jpm-brown-200 overflow-hidden col-span-3 h-full flex flex-col">
          {selectedStepId === JOURNEY_ID ? (
            <div className="w-full h-full flex flex-col">
              <div className="shrink-0 bg-jpm-brown-100 border-b border-jpm-brown-300 px-2 sm:px-4 py-2 text-sm font-medium text-jpm-brown-900">
                Journey Inputs (aggregated across POST payloads)
              </div>
              <div className="flex-1 overflow-auto p-3 sm:p-4">
                {(() => {
                  const postSteps = (activeWorkflow?.steps ?? []).filter(
                    (s) => detectHttpVerb(s.operationId) === 'POST',
                  );
                  const rows = postSteps.flatMap((s) => {
                    const payload = getStepPayload(s);
                    return flattenJsonPaths(payload, '$').map((r) => ({
                      operation: s.operationId ?? 'POST',
                      path: r.path,
                    }));
                  });
                  if (rows.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground">
                        No POST payloads detected in this workflow.
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-2 pr-4">API Operation</th>
                            <th className="py-2 pr-4">JSON Path</th>
                            <th className="py-2">Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, idx) => (
                            <tr
                              key={`${r.operation}-${r.path}-${idx}`}
                              className="border-b last:border-0"
                            >
                              <td className="py-2 pr-4 text-xs text-muted-foreground">
                                {r.operation}
                              </td>
                              <td className="py-2 pr-4 font-mono text-xs">
                                {r.path}
                              </td>
                              <td className="py-2 text-xs text-muted-foreground"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="step" className="w-full h-full flex flex-col">
              <div className="shrink-0 bg-jpm-brown-100 border-b border-jpm-brown-300 px-2 sm:px-4">
                <TabsList className="bg-transparent h-10 p-0 gap-1">
                  <TabsTrigger
                    value="step"
                    className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
                  >
                    Step JSON
                  </TabsTrigger>
                  {detectHttpVerb(selectedStep?.operationId) === 'POST' &&
                    !!getStepPayload(selectedStep ?? undefined) && (
                      <>
                        <TabsTrigger
                          value="payload-json"
                          className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
                        >
                          Payload JSON
                        </TabsTrigger>
                        <TabsTrigger
                          value="payload-table"
                          className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
                        >
                          Payload Table
                        </TabsTrigger>
                      </>
                    )}
                  <TabsTrigger
                    value="meta"
                    className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
                  >
                    Meta
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-auto p-3 sm:p-4">
                <TabsContent value="step" className="m-0">
                  <Highlight
                    theme={themes.vsLight}
                    code={
                      selectedStep
                        ? JSON.stringify(selectedStep, null, 2)
                        : '// Select a step on the left'
                    }
                    language="json"
                  >
                    {({
                      className,
                      style,
                      tokens,
                      getLineProps,
                      getTokenProps,
                    }) => (
                      <pre className={`${className} text-xs`} style={style}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </TabsContent>
                <TabsContent value="payload-json" className="m-0">
                  <Highlight
                    theme={themes.vsLight}
                    code={
                      getStepPayload(selectedStep ?? undefined)
                        ? JSON.stringify(
                            getStepPayload(selectedStep ?? undefined),
                            null,
                            2,
                          )
                        : '// No payload for this step'
                    }
                    language="json"
                  >
                    {({
                      className,
                      style,
                      tokens,
                      getLineProps,
                      getTokenProps,
                    }) => (
                      <pre className={`${className} text-xs`} style={style}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </TabsContent>
                <TabsContent value="payload-table" className="m-0">
                  {(() => {
                    const payload = getStepPayload(selectedStep ?? undefined);
                    if (!payload)
                      return (
                        <div className="text-sm text-muted-foreground">
                          No payload for this step.
                        </div>
                      );
                    const rows = flattenJsonPaths(payload);
                    return (
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="py-2 pr-4">JSON Path</th>
                              <th className="py-2">Comment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr
                                key={r.path}
                                className="border-b last:border-0"
                              >
                                <td className="py-2 pr-4 font-mono text-xs">
                                  {r.path}
                                </td>
                                <td className="py-2 text-xs text-muted-foreground"></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </TabsContent>
                <TabsContent value="meta" className="m-0">
                  {(() => {
                    const s = selectedStep as any;
                    if (!s)
                      return (
                        <div className="text-sm text-muted-foreground">
                          Select a step to view metadata.
                        </div>
                      );
                    const success = Array.isArray(s.successCriteria)
                      ? s.successCriteria.map((c: any) => c.condition)
                      : [];
                    const onSuccess = Array.isArray(s.onSuccess)
                      ? s.onSuccess.map((c: any) => c.reference)
                      : [];
                    const onFailure = Array.isArray(s.onFailure)
                      ? s.onFailure.map((c: any) => c.reference)
                      : [];
                    const outputs = s.outputs || {};
                    return (
                      <div className="space-y-6">
                        <div>
                          <div className="text-sm font-medium mb-2">
                            Success Criteria
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left border-b">
                                <th className="py-2">Condition</th>
                              </tr>
                            </thead>
                            <tbody>
                              {success.length === 0 ? (
                                <tr>
                                  <td className="py-2 text-xs text-muted-foreground">
                                    None
                                  </td>
                                </tr>
                              ) : (
                                success.map((cond: string, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="border-b last:border-0"
                                  >
                                    <td className="py-2 font-mono text-xs">
                                      {cond}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm font-medium mb-2">
                              On Success
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="py-2">Reference</th>
                                </tr>
                              </thead>
                              <tbody>
                                {onSuccess.length === 0 ? (
                                  <tr>
                                    <td className="py-2 text-xs text-muted-foreground">
                                      None
                                    </td>
                                  </tr>
                                ) : (
                                  onSuccess.map((ref: string, idx: number) => (
                                    <tr
                                      key={idx}
                                      className="border-b last:border-0"
                                    >
                                      <td className="py-2 font-mono text-xs">
                                        {ref}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">
                              On Failure
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="py-2">Reference</th>
                                </tr>
                              </thead>
                              <tbody>
                                {onFailure.length === 0 ? (
                                  <tr>
                                    <td className="py-2 text-xs text-muted-foreground">
                                      None
                                    </td>
                                  </tr>
                                ) : (
                                  onFailure.map((ref: string, idx: number) => (
                                    <tr
                                      key={idx}
                                      className="border-b last:border-0"
                                    >
                                      <td className="py-2 font-mono text-xs">
                                        {ref}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">
                            Outputs
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left border-b">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(outputs).length === 0 ? (
                                <tr>
                                  <td
                                    className="py-2 text-xs text-muted-foreground"
                                    colSpan={2}
                                  >
                                    None
                                  </td>
                                </tr>
                              ) : (
                                Object.entries(outputs).map(
                                  ([k, v]: [string, any]) => (
                                    <tr
                                      key={k}
                                      className="border-b last:border-0"
                                    >
                                      <td className="py-2 pr-4 text-xs">{k}</td>
                                      <td className="py-2 font-mono text-[11px] text-muted-foreground">
                                        {String(v)}
                                      </td>
                                    </tr>
                                  ),
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
