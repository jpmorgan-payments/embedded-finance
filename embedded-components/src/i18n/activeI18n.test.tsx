import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import {
  activateI18nInstance,
  deactivateI18nInstance,
  getActiveI18n,
  setPendingI18nInstance,
  tActive,
} from './activeI18n';
import { createI18nInstance, i18n } from './config';

describe('activeI18n', () => {
  const instances: ReturnType<typeof createI18nInstance>[] = [];
  const create = (...args: Parameters<typeof createI18nInstance>) => {
    const instance = createI18nInstance(...args);
    instances.push(instance);
    return instance;
  };

  afterEach(() => {
    instances.splice(0).forEach(deactivateI18nInstance);
  });

  it('falls back to the global instance outside a provider', () => {
    expect(getActiveI18n()).toBe(i18n);
    expect(tActive('common:yes')).toBe('Yes');
  });

  it('translates with the most recently activated instance', () => {
    const french = create({ name: 'frCA' });
    const spanish = create({ name: 'esUS' });

    activateI18nInstance(french);
    activateI18nInstance(spanish);
    expect(tActive('common:yes')).toBe(spanish.t('common:yes'));

    // Re-activating moves an instance back to the top.
    activateI18nInstance(french);
    expect(tActive('common:yes')).toBe(french.t('common:yes'));

    deactivateI18nInstance(french);
    expect(getActiveI18n()).toBe(spanish);
  });

  it('honors content-token overrides of the active instance', () => {
    const instance = create({ tokens: { common: { yes: 'Yep' } } });
    activateI18nInstance(instance);
    expect(tActive('common:yes')).toBe('Yep');
  });

  it('uses a pending (uncommitted) instance until a provider commits', () => {
    const french = create({ name: 'frCA' });
    const spanish = create({ name: 'esUS' });

    setPendingI18nInstance(french);
    expect(getActiveI18n()).toBe(french);

    activateI18nInstance(spanish);
    expect(getActiveI18n()).toBe(spanish);
  });

  it('drops a pending instance whose provider never commits', () => {
    vi.useFakeTimers();
    try {
      const spanish = create({ name: 'esUS' });
      activateI18nInstance(spanish);

      setPendingI18nInstance(create({ name: 'frCA' }));
      expect(getActiveI18n().language).toBe('frCA');

      vi.runAllTimers();
      expect(getActiveI18n()).toBe(spanish);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores pending instances during server rendering', () => {
    vi.stubGlobal('window', undefined);
    try {
      setPendingI18nInstance(create({ name: 'frCA' }));
    } finally {
      vi.unstubAllGlobals();
    }
    expect(getActiveI18n()).toBe(i18n);
  });

  it('leaves nothing registered after providers unmount (incl. StrictMode)', () => {
    const { unmount } = render(
      <StrictMode>
        <EBComponentsProvider apiBaseUrl="" contentTokens={{ name: 'frCA' }}>
          <span>child</span>
        </EBComponentsProvider>
        <EBComponentsProvider apiBaseUrl="" contentTokens={{ name: 'esUS' }}>
          <span>child</span>
        </EBComponentsProvider>
      </StrictMode>
    );
    expect(getActiveI18n().language).toBe('esUS');

    unmount();
    expect(getActiveI18n()).toBe(i18n);
  });
});
