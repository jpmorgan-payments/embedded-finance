import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackUserEvent } from './userTracking';

describe('trackUserEvent deduplication', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls userEventsHandler on first invocation', () => {
    const handler = vi.fn();

    trackUserEvent({
      actionName: 'test_action',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('suppresses duplicate calls within the dedup window', () => {
    const handler = vi.fn();

    trackUserEvent({
      actionName: 'duplicate_action',
      userEventsHandler: handler,
    });
    trackUserEvent({
      actionName: 'duplicate_action',
      userEventsHandler: handler,
    });
    trackUserEvent({
      actionName: 'duplicate_action',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('allows the same action after the dedup window has elapsed', () => {
    const handler = vi.fn();

    trackUserEvent({
      actionName: 'timed_action',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);

    // Advance past the 100ms dedup window
    vi.advanceTimersByTime(101);

    trackUserEvent({
      actionName: 'timed_action',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not suppress different action names', () => {
    const handler = vi.fn();

    trackUserEvent({
      actionName: 'action_a',
      userEventsHandler: handler,
    });
    trackUserEvent({
      actionName: 'action_b',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does nothing when userEventsHandler is undefined', () => {
    // Should not throw
    trackUserEvent({
      actionName: 'no_handler',
      userEventsHandler: undefined,
    });
  });

  it('calls lifecycle onEnter when provided', () => {
    const handler = vi.fn();
    const onEnter = vi.fn();

    trackUserEvent({
      actionName: 'lifecycle_action',
      userEventsHandler: handler,
      userEventsLifecycle: { onEnter },
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('suppresses lifecycle onEnter on duplicate calls', () => {
    const handler = vi.fn();
    const onEnter = vi.fn();

    trackUserEvent({
      actionName: 'lifecycle_dedup',
      userEventsHandler: handler,
      userEventsLifecycle: { onEnter },
    });
    trackUserEvent({
      actionName: 'lifecycle_dedup',
      userEventsHandler: handler,
      userEventsLifecycle: { onEnter },
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
