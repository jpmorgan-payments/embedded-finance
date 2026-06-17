import { render as rtlRender } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { useTranslationWithTokens } from './useTranslationWithTokens';

// The hook requires EBComponentsProvider context (provided by @test-utils render)
function TestComponent({ ns }: { ns: string | string[] }) {
  const { t, tString } = useTranslationWithTokens(ns as any);

  return (
    <div>
      <span data-testid="t-result">{t('title', 'Default Title')}</span>
      <span data-testid="tString-result">
        {tString('description', 'Default Description')}
      </span>
    </div>
  );
}

describe('useTranslationWithTokens', () => {
  it('returns t and tString functions', () => {
    render(<TestComponent ns="common" />);

    expect(screen.getByTestId('t-result')).toBeInTheDocument();
    expect(screen.getByTestId('tString-result')).toBeInTheDocument();
  });

  it('t returns translated or default text', () => {
    render(<TestComponent ns="common" />);

    // Should render the default value or the translation
    const result = screen.getByTestId('t-result');
    expect(result.textContent).toBeTruthy();
  });

  it('tString returns a plain string', () => {
    render(<TestComponent ns="common" />);

    const result = screen.getByTestId('tString-result');
    expect(typeof result.textContent).toBe('string');
    expect(result.textContent!.length).toBeGreaterThan(0);
  });

  it('works with single namespace', () => {
    render(<TestComponent ns="recipients" />);
    expect(screen.getByTestId('t-result')).toBeInTheDocument();
  });

  it('works with multiple namespaces', () => {
    render(<TestComponent ns={['common', 'recipients']} />);
    expect(screen.getByTestId('t-result')).toBeInTheDocument();
  });

  it('tString handles null/undefined translations gracefully', () => {
    function NullTestComponent() {
      const { tString } = useTranslationWithTokens('common');
      // Non-existent key with defaultValue
      const result = tString('nonExistentKey12345' as any, 'Fallback Value');
      return <span data-testid="null-test">{result}</span>;
    }

    render(<NullTestComponent />);
    const el = screen.getByTestId('null-test');
    // Should return the key or fallback, not crash
    expect(el.textContent).toBeTruthy();
  });

  it('returns i18n instance and ready state', () => {
    function HookProbe() {
      const { i18n, ready } = useTranslationWithTokens('common');
      return (
        <div>
          <span data-testid="i18n-exists">{String(!!i18n)}</span>
          <span data-testid="ready">{String(ready)}</span>
        </div>
      );
    }

    render(<HookProbe />);
    expect(screen.getByTestId('i18n-exists').textContent).toBe('true');
  });

  it('annotates with data-content-token when showTokenIds is enabled', () => {
    function TokenIdComponent() {
      const { t } = useTranslationWithTokens('common');
      return <span data-testid="annotated">{t('title', 'Title')}</span>;
    }

    rtlRender(
      <EBComponentsProvider
        apiBaseUrl=""
        contentTokens={{ showTokenIds: true }}
      >
        <TokenIdComponent />
      </EBComponentsProvider>
    );

    const el = screen.getByTestId('annotated');
    const span = el.querySelector('[data-content-token]');
    expect(span).toBeTruthy();
    expect(span?.getAttribute('data-content-token')).toContain('common:');
  });

  it('does not annotate when showTokenIds is disabled', () => {
    function NoTokenIdComponent() {
      const { t } = useTranslationWithTokens('common');
      return <span data-testid="plain">{t('title', 'Title')}</span>;
    }

    rtlRender(
      <EBComponentsProvider
        apiBaseUrl=""
        contentTokens={{ showTokenIds: false }}
      >
        <NoTokenIdComponent />
      </EBComponentsProvider>
    );

    const el = screen.getByTestId('plain');
    const span = el.querySelector('[data-content-token]');
    expect(span).toBeNull();
  });

  it('tString returns fallback for number values', () => {
    function NumberTest() {
      const { tString } = useTranslationWithTokens('common');
      const result = tString('title' as any, { defaultValue: 'Fallback' });
      return <span data-testid="num-test">{result}</span>;
    }

    render(<NumberTest />);
    expect(screen.getByTestId('num-test').textContent).toBeTruthy();
  });

  it('t returns empty string for empty translations when showTokenIds on', () => {
    function EmptyTokenTest() {
      const { t } = useTranslationWithTokens('common');
      const result = t('nonexistent_empty' as any, '');
      return <span data-testid="empty-token">{result || 'EMPTY'}</span>;
    }

    rtlRender(
      <EBComponentsProvider
        apiBaseUrl=""
        contentTokens={{ showTokenIds: true }}
      >
        <EmptyTokenTest />
      </EBComponentsProvider>
    );

    const el = screen.getByTestId('empty-token');
    expect(el.textContent).toBeTruthy();
  });

  it('handles array keys (fallback keys)', () => {
    function ArrayKeyTest() {
      const { t } = useTranslationWithTokens('common');
      const result = t(['nonExistentKey999', 'title'] as any, 'Array Fallback');
      return <span data-testid="array-key">{result}</span>;
    }

    render(<ArrayKeyTest />);
    expect(screen.getByTestId('array-key').textContent).toBeTruthy();
  });
});
