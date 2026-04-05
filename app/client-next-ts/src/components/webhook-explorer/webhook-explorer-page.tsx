import { useCallback, useMemo, useState } from 'react';
import {
  BookOpen,
  Braces,
  ExternalLink,
  FlaskConical,
  History,
  ListTree,
  Play,
  Repeat,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  buildCanonicalPayload,
  buildOAuthWrappedDisplay,
  getEventDefinition,
  LIFECYCLE_PRESETS,
  WEBHOOK_EVENT_DEFINITIONS,
  type CanonicalNotificationPayload,
  type EventCategory,
} from '@/lib/webhook-explorer/mock-payloads';
import {
  DEFAULT_HANDLER,
  runUserHandler,
  type HandlerContext,
} from '@/lib/webhook-explorer/run-handler';

const DOCS_MANAGE_NOTIFICATIONS =
  'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/notification-subscriptions/how-to/notifications';
const DOCS_PAYLOADS =
  'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/notification-subscriptions/how-to/notification-payloads';

const CATEGORY_LABEL: Record<EventCategory, string> = {
  transaction: 'Transaction',
  client: 'Client',
  account: 'Account',
  recipient: 'Recipient',
  program: 'Program',
};

const PRIORITY_CLASS: Record<string, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-900',
  high: 'border-amber-200 bg-amber-50 text-amber-900',
  medium: 'border-slate-200 bg-slate-50 text-slate-800',
};

interface TimelineEntry {
  key: string;
  at: string;
  eventType: string;
  eventId: string;
  duplicate: boolean;
  ok: boolean;
  handlerError?: string;
  resultPreview?: string;
  logs: string[];
}

export function WebhookExplorerPage() {
  const [selectedEventType, setSelectedEventType] = useState(
    WEBHOOK_EVENT_DEFINITIONS[0].eventType
  );
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>(
    'all'
  );
  const [oauthView, setOauthView] = useState(false);
  const [handlerCode, setHandlerCode] = useState(DEFAULT_HANDLER);
  const [seenEventIds, setSeenEventIds] = useState(() => new Set<string>());
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [lastPayload, setLastPayload] =
    useState<CanonicalNotificationPayload | null>(null);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return WEBHOOK_EVENT_DEFINITIONS;
    return WEBHOOK_EVENT_DEFINITIONS.filter(
      (e) => e.category === categoryFilter
    );
  }, [categoryFilter]);

  const selectedDef = getEventDefinition(selectedEventType);

  const previewFreshId = useMemo(
    () => crypto.randomUUID(),
    [selectedEventType]
  );

  const previewObject = useMemo(() => {
    const canonical =
      lastPayload ?? buildCanonicalPayload(selectedEventType, previewFreshId);
    if (oauthView) {
      return buildOAuthWrappedDisplay(canonical);
    }
    return canonical;
  }, [lastPayload, oauthView, selectedEventType, previewFreshId]);

  const previewJson = useMemo(
    () => JSON.stringify(previewObject, null, 2),
    [previewObject]
  );

  const runFire = useCallback(
    (opts: { duplicateOf?: CanonicalNotificationPayload } | undefined) => {
      const eventId = opts?.duplicateOf?.eventId ?? crypto.randomUUID();
      const canonical = opts?.duplicateOf
        ? opts.duplicateOf
        : buildCanonicalPayload(selectedEventType, eventId);

      setLastPayload(canonical);

      const ctx: HandlerContext = {
        seenEventIds,
        log: () => {},
      };

      const { ok, result, error, logs } = runUserHandler(
        handlerCode,
        canonical,
        ctx
      );

      setSeenEventIds(new Set(ctx.seenEventIds));

      const entry: TimelineEntry = {
        key: `${canonical.eventId}-${Date.now()}`,
        at: new Date().toISOString(),
        eventType: canonical.eventType,
        eventId: canonical.eventId,
        duplicate: Boolean(opts?.duplicateOf),
        ok,
        handlerError: error,
        resultPreview:
          result !== undefined ? JSON.stringify(result, null, 2) : undefined,
        logs,
      };
      setTimeline((t) => [entry, ...t].slice(0, 50));
    },
    [handlerCode, seenEventIds, selectedEventType]
  );

  const handleFire = () => {
    runFire(undefined);
  };

  const handleFireDuplicate = () => {
    if (!lastPayload) {
      runFire(undefined);
      return;
    }
    runFire({ duplicateOf: lastPayload });
  };

  const handleRunLifecycle = (eventTypes: string[]) => {
    const acc = new Set(seenEventIds);
    const newEntries: TimelineEntry[] = [];
    let lastCanonical: CanonicalNotificationPayload | null = null;
    for (const et of eventTypes) {
      const id = crypto.randomUUID();
      const canonical = buildCanonicalPayload(et, id);
      lastCanonical = canonical;
      const ctx: HandlerContext = {
        seenEventIds: acc,
        log: () => {},
      };
      const { ok, result, error, logs } = runUserHandler(
        handlerCode,
        canonical,
        ctx
      );
      const entry: TimelineEntry = {
        key: `${canonical.eventId}-${Date.now()}-${et}`,
        at: new Date().toISOString(),
        eventType: canonical.eventType,
        eventId: canonical.eventId,
        duplicate: false,
        ok,
        handlerError: error,
        resultPreview:
          result !== undefined ? JSON.stringify(result, null, 2) : undefined,
        logs,
      };
      newEntries.push(entry);
    }
    setSeenEventIds(new Set(acc));
    if (lastCanonical) {
      setLastPayload(lastCanonical);
      setSelectedEventType(lastCanonical.eventType);
    }
    setTimeline((t) => [...newEntries.reverse(), ...t].slice(0, 50));
  };

  const resetSession = () => {
    setSeenEventIds(new Set());
    setTimeline([]);
    setLastPayload(null);
  };

  return (
    <div className="min-h-screen bg-sp-bg">
      <div className="border-b border-sp-border bg-jpm-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-sp-brand/40 bg-sp-accent text-sp-brand"
                >
                  Beta
                </Badge>
                <span className="text-xs font-medium uppercase tracking-wide text-jpm-gray">
                  Webhook explorer
                </span>
              </div>
              <h1 className="text-page-h2 font-bold text-jpm-gray-900">
                Embedded Payments notifications
              </h1>
              <p className="mt-3 max-w-3xl text-page-body text-jpm-gray">
                Explore supported notification event types, inspect mock
                payloads, and run a local handler the same way you would after
                your server returns{' '}
                <code className="rounded bg-sp-accent px-1 py-0.5 text-page-small">
                  200 OK
                </code>{' '}
                within three seconds. Aligns with the{' '}
                <a
                  href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md"
                  className="font-medium text-sp-brand underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Webhook Integration Recipe
                </a>{' '}
                (UX patterns and priorities) and J.P. Morgan{' '}
                <a
                  href={DOCS_MANAGE_NOTIFICATIONS}
                  className="font-medium text-sp-brand underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Manage notifications
                </a>
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={DOCS_MANAGE_NOTIFICATIONS}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' })
                  )}
                >
                  <BookOpen className="size-4 shrink-0" aria-hidden />
                  Manage notifications
                  <ExternalLink
                    className="size-4 shrink-0 opacity-70"
                    aria-hidden
                  />
                </a>
                <a
                  href={DOCS_PAYLOADS}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' })
                  )}
                >
                  Notification payloads
                  <ExternalLink
                    className="size-4 shrink-0 opacity-70"
                    aria-hidden
                  />
                </a>
              </div>
            </div>
            <Card className="w-full max-w-md border-sp-border shadow-page-card md:mt-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-page-h3 text-jpm-gray-900">
                  <Sparkles
                    className="size-5 shrink-0 text-sp-brand"
                    aria-hidden
                  />
                  Practices (from recipe)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-page-small text-jpm-gray">
                <p>
                  Respond with success within{' '}
                  <strong className="text-jpm-gray-900">3 seconds</strong>;
                  process asynchronously after ack.
                </p>
                <p>
                  Deduplicate using{' '}
                  <code className="rounded bg-sp-accent px-1">eventId</code>;
                  events may be{' '}
                  <strong className="text-jpm-gray-900">out of order</strong>.
                </p>
                <p>
                  Optional OAuth pattern: verify signed payloads and rotate keys
                  using registration metadata.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Catalog */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex items-center gap-2 text-jpm-gray-900">
              <ListTree className="size-5 shrink-0 text-sp-brand" aria-hidden />
              <h2 className="text-lg font-semibold leading-none">
                Event catalog
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className={
                  categoryFilter === 'all'
                    ? 'bg-sp-brand hover:bg-sp-brand-700'
                    : ''
                }
                onClick={() => setCategoryFilter('all')}
              >
                All
              </Button>
              {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={categoryFilter === c ? 'default' : 'outline'}
                  size="sm"
                  className={
                    categoryFilter === c
                      ? 'bg-sp-brand hover:bg-sp-brand-700'
                      : ''
                  }
                  onClick={() => setCategoryFilter(c)}
                >
                  {CATEGORY_LABEL[c]}
                </Button>
              ))}
            </div>
            <ScrollArea className="h-[min(520px,55vh)] rounded-page-md border border-sp-border bg-jpm-white shadow-sm">
              <ul className="divide-y divide-sp-border p-2">
                {filteredEvents.map((ev) => (
                  <li key={ev.eventType}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventType(ev.eventType);
                        setLastPayload(null);
                      }}
                      className={cn(
                        'w-full rounded-page-sm px-3 py-3 text-left transition-colors',
                        selectedEventType === ev.eventType
                          ? 'bg-sp-accent'
                          : 'hover:bg-sp-bg'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-jpm-gray-900">
                          {ev.eventType}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'shrink-0 border text-[10px]',
                            PRIORITY_CLASS[ev.priority]
                          )}
                        >
                          {ev.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-page-small text-jpm-gray">
                        {ev.summary}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <Card className="border-sp-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-jpm-gray-900">
                  <FlaskConical
                    className="size-5 shrink-0 text-sp-brand"
                    aria-hidden
                  />
                  Lifecycle presets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-page-small text-jpm-gray">
                  Fire a short sequence to mimic ordering across event types
                  (still subject to out-of-order delivery in production).
                </p>
                <div className="flex flex-col gap-2">
                  {LIFECYCLE_PRESETS.map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto justify-start whitespace-normal py-2 text-left"
                      onClick={() => handleRunLifecycle(p.eventTypes)}
                    >
                      <span className="block font-medium">{p.label}</span>
                      <span className="block text-[11px] font-normal text-jpm-gray">
                        {p.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detail + payload */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {selectedDef ? (
              <Card className="border-sp-border shadow-page-card">
                <CardHeader>
                  <CardTitle className="font-mono text-sm text-jpm-gray-900">
                    {selectedDef.eventType}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-page-small">
                  <div>
                    <h3 className="font-semibold text-jpm-gray-900">Summary</h3>
                    <p className="mt-1 text-jpm-gray">{selectedDef.summary}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-jpm-gray-900">
                      When it fires
                    </h3>
                    <p className="mt-1 text-jpm-gray">
                      {selectedDef.whenItFires}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-jpm-gray-900">
                      UX guidance
                    </h3>
                    <p className="mt-1 text-jpm-gray">{selectedDef.uxNote}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="flex min-h-0 flex-1 flex-col border-sp-border">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-base leading-none text-jpm-gray-900">
                  Payload preview
                </CardTitle>
                <div className="flex items-center gap-2.5">
                  <Label
                    htmlFor="oauth-toggle"
                    className="cursor-pointer text-page-small leading-none text-jpm-gray"
                  >
                    OAuth envelope (simulated)
                  </Label>
                  <Switch
                    id="oauth-toggle"
                    className="shrink-0"
                    checked={oauthView}
                    onCheckedChange={setOauthView}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col">
                <p className="mb-2 text-page-small text-jpm-gray">
                  {oauthView
                    ? 'Shows a signed envelope plus decoded payload for illustration. Your handler still receives the canonical object below when you fire.'
                    : 'Canonical JSON body after verification — same shape the template handler receives.'}
                </p>
                <pre className="max-h-[min(340px,40vh)] min-h-[120px] overflow-auto rounded-page-sm border border-sp-border bg-sp-accent p-3 font-mono text-[11px] leading-relaxed text-jpm-gray-900">
                  {previewJson}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="bg-sp-brand hover:bg-sp-brand-700"
                    onClick={handleFire}
                  >
                    <Play className="size-4 shrink-0" aria-hidden />
                    Fire event
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFireDuplicate}
                    title="Re-send the last payload with the same eventId to test idempotency"
                  >
                    <Repeat className="size-4 shrink-0" aria-hidden />
                    Fire duplicate
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetSession}>
                    Reset session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Handler + timeline */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Tabs
              defaultValue="handler"
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="grid h-10 w-full grid-cols-2 p-1">
                <TabsTrigger
                  value="handler"
                  className="gap-2 data-[state=active]:shadow-sm"
                >
                  <Braces className="size-4 shrink-0" aria-hidden />
                  Handler
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="gap-2 data-[state=active]:shadow-sm"
                >
                  <History className="size-4 shrink-0" aria-hidden />
                  Timeline
                </TabsTrigger>
              </TabsList>
              <TabsContent value="handler" className="mt-4 flex flex-col gap-3">
                <p className="text-page-small text-jpm-gray">
                  Local-only execution for learning. Define{' '}
                  <code className="rounded bg-sp-accent px-1">
                    handleWebhook(payload, context)
                  </code>
                  . Use{' '}
                  <code className="rounded bg-sp-accent px-1">
                    context.seenEventIds
                  </code>{' '}
                  for idempotency and{' '}
                  <code className="rounded bg-sp-accent px-1">context.log</code>{' '}
                  for output.
                </p>
                <textarea
                  value={handlerCode}
                  onChange={(e) => setHandlerCode(e.target.value)}
                  spellCheck={false}
                  className="min-h-[min(280px,35vh)] w-full resize-y rounded-page-sm border border-sp-border bg-jpm-white p-3 font-mono text-xs leading-relaxed text-jpm-gray-900"
                  aria-label="Webhook handler code"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setHandlerCode(DEFAULT_HANDLER)}
                >
                  Reset to template
                </Button>
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                {timeline.length === 0 ? (
                  <p className="rounded-page-md border border-dashed border-sp-border bg-jpm-white p-6 text-center text-page-small text-jpm-gray">
                    No events yet. Fire an event or run a lifecycle preset.
                  </p>
                ) : (
                  <ScrollArea className="h-[min(400px,50vh)] rounded-page-md border border-sp-border bg-jpm-white">
                    <ul className="divide-y divide-sp-border">
                      {timeline.map((t) => (
                        <li key={t.key} className="p-3 text-page-small">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-medium text-jpm-gray-900">
                              {t.eventType}
                            </span>
                            {t.duplicate ? (
                              <Badge variant="outline" className="text-[10px]">
                                duplicate
                              </Badge>
                            ) : null}
                            {t.ok ? (
                              <Badge className="border-0 bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">
                                ok
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                error
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-jpm-gray">
                            {t.at} ·{' '}
                            <code className="rounded bg-sp-accent px-1">
                              {t.eventId}
                            </code>
                          </p>
                          {t.handlerError ? (
                            <pre className="mt-2 max-h-24 overflow-auto rounded bg-rose-50 p-2 font-mono text-[11px] text-rose-900">
                              {t.handlerError}
                            </pre>
                          ) : null}
                          {t.resultPreview ? (
                            <pre className="mt-2 max-h-32 overflow-auto rounded border border-sp-border bg-sp-bg p-2 font-mono text-[11px] text-jpm-gray-900">
                              {t.resultPreview}
                            </pre>
                          ) : null}
                          {t.logs.length > 0 ? (
                            <pre className="mt-2 max-h-24 overflow-auto rounded border border-sp-border p-2 font-mono text-[11px] text-jpm-gray">
                              {t.logs.join('\n')}
                            </pre>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
