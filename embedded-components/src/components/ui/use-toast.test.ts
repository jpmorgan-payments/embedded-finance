import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { reducer } from './use-toast';

describe('use-toast reducer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ADD_TOAST prepends toast and respects limit', () => {
    const state = { toasts: [] as { id: string; open: boolean }[] };
    const first = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: 'a', open: true },
    });
    expect(first.toasts).toEqual([{ id: 'a', open: true }]);

    const second = reducer(first, {
      type: 'ADD_TOAST',
      toast: { id: 'b', open: true },
    });
    expect(second.toasts).toEqual([{ id: 'b', open: true }]);
  });

  it('UPDATE_TOAST merges fields for matching id', () => {
    const state = {
      toasts: [{ id: '1', open: true, title: 'Old' }],
    };
    const next = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'New' },
    });
    expect(next.toasts[0]).toMatchObject({ id: '1', title: 'New', open: true });
  });

  it('DISMISS_TOAST marks toast closed and schedules removal', () => {
    const state = {
      toasts: [{ id: 'x', open: true }],
    };
    const next = reducer(state, {
      type: 'DISMISS_TOAST',
      toastId: 'x',
    });
    expect(next.toasts[0]).toMatchObject({ id: 'x', open: false });

    vi.runAllTimers();
  });

  it('REMOVE_TOAST removes by id', () => {
    const state = {
      toasts: [
        { id: 'a', open: true },
        { id: 'b', open: true },
      ],
    };
    const next = reducer(state, {
      type: 'REMOVE_TOAST',
      toastId: 'a',
    });
    expect(next.toasts).toEqual([{ id: 'b', open: true }]);
  });

  it('REMOVE_TOAST without id clears all', () => {
    const state = {
      toasts: [{ id: 'a', open: true }],
    };
    const next = reducer(state, { type: 'REMOVE_TOAST' });
    expect(next.toasts).toEqual([]);
  });
});
