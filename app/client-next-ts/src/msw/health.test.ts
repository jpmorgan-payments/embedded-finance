import { describe, expect, it, vi } from 'vitest';

import {
  checkMswHealth,
  mswHealthHandler,
  probeMsw,
  reactivateMsw,
} from './health';

describe('probeMsw', () => {
  it('is healthy only when the mock answers', async () => {
    const mocked = vi
      .fn()
      .mockResolvedValue(
        new Response('{}', { headers: { 'x-showcase-msw-health': 'alive' } })
      );
    const network = vi
      .fn()
      .mockResolvedValue(new Response('', { status: 404 }));

    await expect(probeMsw(mocked)).resolves.toBe(true);
    await expect(probeMsw(network)).resolves.toBe(false);
  });

  it('treats a failed request as unhealthy', async () => {
    const failing = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(probeMsw(failing)).resolves.toBe(false);
  });

  it('is answered by the health handler', async () => {
    const result = await mswHealthHandler.run({
      request: new Request(
        new URL('/__showcase_msw_health__?t=1', window.location.href)
      ),
      requestId: 'probe',
    });

    expect(result?.response?.headers.get('x-showcase-msw-health')).toBe(
      'alive'
    );
  });
});

describe('reactivateMsw', () => {
  const createContainer = (reply?: unknown) => {
    const target = new EventTarget();
    const worker = {
      postMessage: vi.fn((message: string) => {
        if (message === 'MOCK_ACTIVATE' && reply) {
          target.dispatchEvent(
            Object.assign(new Event('message'), {
              source: worker,
              data: reply,
            })
          );
        }
      }),
    };
    const container = Object.assign(target, {
      controller: worker,
    }) as unknown as ServiceWorkerContainer;
    return { container, worker };
  };

  it('re-announces the page and resolves once mocking is enabled', async () => {
    const { container, worker } = createContainer({ type: 'MOCKING_ENABLED' });

    await expect(reactivateMsw(container)).resolves.toBe(true);
    expect(worker.postMessage).toHaveBeenCalledWith('MOCK_ACTIVATE');
  });

  it('gives up when the worker does not reply', async () => {
    const { container } = createContainer();

    await expect(reactivateMsw(container, 10)).resolves.toBe(false);
  });

  it('cannot recover a page the worker does not control', async () => {
    const container = Object.assign(new EventTarget(), {
      controller: null,
    }) as unknown as ServiceWorkerContainer;

    await expect(reactivateMsw(container)).resolves.toBe(false);
  });
});

describe('checkMswHealth', () => {
  it('reports active without reactivating', async () => {
    const reactivate = vi.fn();

    await expect(
      checkMswHealth({ probe: async () => true, reactivate })
    ).resolves.toBe('active');
    expect(reactivate).not.toHaveBeenCalled();
  });

  it('reports recovered when reactivation restores mocking', async () => {
    const probe = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(
      checkMswHealth({ probe, reactivate: async () => true })
    ).resolves.toBe('recovered');
  });

  it('reports stale when mocking stays off', async () => {
    await expect(
      checkMswHealth({ probe: async () => false, reactivate: async () => true })
    ).resolves.toBe('stale');
    await expect(
      checkMswHealth({
        probe: async () => false,
        reactivate: async () => false,
      })
    ).resolves.toBe('stale');
  });
});
