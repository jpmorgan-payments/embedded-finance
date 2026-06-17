import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createUserEventContext,
  getUserEventName,
  trackUserEvent,
  useUserEventTracking,
} from './userTracking';

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
    expect(() =>
      trackUserEvent({
        actionName: 'no_handler',
        userEventsHandler: undefined,
      })
    ).not.toThrow();
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

  it('handles errors in userEventsHandler gracefully', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const handler = vi.fn(() => {
      throw new Error('handler boom');
    });

    // Should not throw
    trackUserEvent({
      actionName: 'error_action',
      userEventsHandler: handler,
    });

    expect(consoleError).toHaveBeenCalledWith(
      'Error tracking user event:',
      expect.any(Error)
    );
    consoleError.mockRestore();
  });

  it('passes metadata to the context', () => {
    const handler = vi.fn();

    trackUserEvent({
      actionName: 'meta_action',
      eventType: 'click',
      metadata: { screen: 'home' },
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        actionName: 'meta_action',
        eventType: 'click',
        metadata: { screen: 'home' },
      })
    );
  });
});

describe('getUserEventName', () => {
  it('returns the data-user-event attribute value', () => {
    const el = document.createElement('div');
    el.setAttribute('data-user-event', 'onboarding_start');
    expect(getUserEventName(el)).toBe('onboarding_start');
  });

  it('returns null when attribute is missing', () => {
    const el = document.createElement('div');
    expect(getUserEventName(el)).toBeNull();
  });
});

describe('createUserEventContext', () => {
  it('creates a context object with correct fields', () => {
    const el = document.createElement('button');
    const ctx = createUserEventContext('click_cta', 'click', el, {
      page: 'home',
    });

    expect(ctx.actionName).toBe('click_cta');
    expect(ctx.eventType).toBe('click');
    expect(ctx.element).toBe(el);
    expect(ctx.metadata).toEqual({ page: 'home' });
    expect(ctx.timestamp).toBeGreaterThan(0);
  });

  it('works without optional params', () => {
    const ctx = createUserEventContext('simple', 'programmatic');
    expect(ctx.actionName).toBe('simple');
    expect(ctx.element).toBeUndefined();
    expect(ctx.metadata).toBeUndefined();
  });
});

describe('useUserEventTracking', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches event listeners to the container', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const handler = vi.fn();

    renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container',
        userEventsHandler: handler,
      })
    );

    // Create a child element with data-user-event attribute
    const button = document.createElement('button');
    button.setAttribute('data-user-event', 'btn_click');
    container.appendChild(button);

    button.click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        actionName: 'btn_click',
        eventType: 'click',
      })
    );
  });

  it('does not track elements without data-user-event', () => {
    const container = document.createElement('div');
    container.id = 'test-container-2';
    document.body.appendChild(container);

    const handler = vi.fn();

    renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container-2',
        userEventsHandler: handler,
      })
    );

    const button = document.createElement('button');
    container.appendChild(button);

    button.click();

    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing when no handler is provided', () => {
    const container = document.createElement('div');
    container.id = 'test-container-3';
    document.body.appendChild(container);

    expect(() =>
      renderHook(() =>
        useUserEventTracking({
          containerId: 'test-container-3',
          userEventsHandler: undefined,
        })
      )
    ).not.toThrow();
  });

  it('does nothing when container does not exist', () => {
    const handler = vi.fn();

    expect(() =>
      renderHook(() =>
        useUserEventTracking({
          containerId: 'non-existent',
          userEventsHandler: handler,
        })
      )
    ).not.toThrow();
  });

  it('walks up parent tree to find data-user-event', () => {
    const container = document.createElement('div');
    container.id = 'test-container-4';
    document.body.appendChild(container);

    const handler = vi.fn();

    renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container-4',
        userEventsHandler: handler,
      })
    );

    // Parent has the attribute, child does not
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-user-event', 'parent_event');
    const inner = document.createElement('span');
    wrapper.appendChild(inner);
    container.appendChild(wrapper);

    inner.click();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ actionName: 'parent_event' })
    );
  });

  it('removes event listeners on unmount', () => {
    const container = document.createElement('div');
    container.id = 'test-container-5';
    document.body.appendChild(container);

    const handler = vi.fn();

    const { unmount } = renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container-5',
        userEventsHandler: handler,
      })
    );

    unmount();

    const button = document.createElement('button');
    button.setAttribute('data-user-event', 'after_unmount');
    container.appendChild(button);
    button.click();

    expect(handler).not.toHaveBeenCalled();
  });
});
