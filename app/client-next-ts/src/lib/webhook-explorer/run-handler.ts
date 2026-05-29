/* eslint-disable no-new-func -- local-only sandbox for the showcase Webhook Explorer */

export interface HandlerContext {
  /** Mutable set of event IDs already processed in this session — for idempotency demos */
  seenEventIds: Set<string>;
  log: (message: string) => void;
}

export interface RunHandlerResult {
  ok: boolean;
  result?: unknown;
  error?: string;
  logs: string[];
}

const DEFAULT_HANDLER = `function handleWebhook(payload, context) {
  const id = payload.eventId;
  if (context.seenEventIds.has(id)) {
    return { status: 'duplicate', eventId: id };
  }
  context.seenEventIds.add(id);
  context.log('Processed ' + payload.eventType);
  return { status: 'ok', eventType: payload.eventType };
}`;

export { DEFAULT_HANDLER };

export function runUserHandler(
  code: string,
  payload: unknown,
  context: HandlerContext
): RunHandlerResult {
  const logs: string[] = [];
  const log = (message: string) => {
    logs.push(String(message));
    context.log(message);
  };

  const wrappedContext: HandlerContext = {
    seenEventIds: context.seenEventIds,
    log,
  };

  try {
    const fn = new Function(
      'payload',
      'context',
      `
      ${code}
      if (typeof handleWebhook !== 'function') {
        throw new Error('Define a function handleWebhook(payload, context)');
      }
      return handleWebhook(payload, context);
    `
    );
    const result = fn(payload, wrappedContext);
    return { ok: true, result, logs };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message, logs };
  }
}
