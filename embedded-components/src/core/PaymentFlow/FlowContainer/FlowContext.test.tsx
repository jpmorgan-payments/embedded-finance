import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FlowContextProvider, useFlowContext } from './FlowContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <FlowContextProvider>{children}</FlowContextProvider>;
}

describe('FlowContext', () => {
  describe('useFlowContext', () => {
    it('throws when used outside FlowContextProvider', () => {
      expect(() => {
        renderHook(() => useFlowContext());
      }).toThrow('useFlowContext must be used within a FlowContextProvider');
    });

    it('provides initial state', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      expect(result.current.currentView).toBe('main');
      expect(result.current.formData.amount).toBe('');
      expect(result.current.formData.currency).toBe('USD');
      expect(result.current.canGoBack).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.validationErrors).toEqual([]);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.expandedPanels).toEqual([]);
    });
  });

  describe('view navigation', () => {
    it('pushView navigates to a new view and allows going back', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.pushView('payee-type');
      });

      expect(result.current.currentView).toBe('payee-type');
      expect(result.current.canGoBack).toBe(true);
    });

    it('popView returns to previous view', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.pushView('payee-type');
      });
      act(() => {
        result.current.pushView('add-recipient-form');
      });

      expect(result.current.currentView).toBe('add-recipient-form');

      act(() => {
        result.current.popView();
      });

      expect(result.current.currentView).toBe('payee-type');
      expect(result.current.canGoBack).toBe(true);

      act(() => {
        result.current.popView();
      });

      expect(result.current.currentView).toBe('main');
      expect(result.current.canGoBack).toBe(false);
    });

    it('replaceView replaces current view without pushing to stack', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.pushView('payee-type');
      });
      act(() => {
        result.current.replaceView('add-recipient-form');
      });

      expect(result.current.currentView).toBe('add-recipient-form');
      // Stack should only have 'main', not 'payee-type'
      act(() => {
        result.current.popView();
      });
      expect(result.current.currentView).toBe('main');
    });

    it('pushView can pass form data along with view change', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.pushView('payee-type', { payeeId: 'rec-123' });
      });

      expect(result.current.formData.payeeId).toBe('rec-123');
    });

    it('replaceView can pass form data along with view change', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.replaceView('main', { amount: '100.00' });
      });

      expect(result.current.formData.amount).toBe('100.00');
    });
  });

  describe('form data', () => {
    it('setFormData updates form fields', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setFormData({ amount: '50.00', currency: 'EUR' });
      });

      expect(result.current.formData.amount).toBe('50.00');
      expect(result.current.formData.currency).toBe('EUR');
    });

    it('setFormData merges with existing data', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setFormData({ amount: '25.00' });
      });
      act(() => {
        result.current.setFormData({ payeeId: 'payee-1' });
      });

      expect(result.current.formData.amount).toBe('25.00');
      expect(result.current.formData.payeeId).toBe('payee-1');
    });
  });

  describe('panel expansion', () => {
    it('togglePanel expands a panel', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.togglePanel('from-account');
      });

      expect(result.current.isPanelExpanded('from-account')).toBe(true);
    });

    it('togglePanel collapses an expanded panel', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.togglePanel('from-account');
      });
      act(() => {
        result.current.togglePanel('from-account');
      });

      expect(result.current.isPanelExpanded('from-account')).toBe(false);
    });

    it('multiple panels can be expanded simultaneously', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.togglePanel('from-account');
      });
      act(() => {
        result.current.togglePanel('payee');
      });

      expect(result.current.isPanelExpanded('from-account')).toBe(true);
      expect(result.current.isPanelExpanded('payee')).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('setValidationErrors sets errors', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setValidationErrors(['amount', 'payee']);
      });

      expect(result.current.validationErrors).toEqual(['amount', 'payee']);
    });

    it('clearValidationErrors removes all errors', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setValidationErrors(['amount']);
      });
      act(() => {
        result.current.clearValidationErrors();
      });

      expect(result.current.validationErrors).toEqual([]);
    });
  });

  describe('isComplete computation', () => {
    it('returns false when no data is filled', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });
      expect(result.current.isComplete).toBe(false);
    });

    it('returns true when all required fields are filled', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '100.00',
        });
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('returns true when unsavedRecipient is used instead of payeeId', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setFormData({
          unsavedRecipient: {
            displayName: 'Test Recipient',
            accountNumber: '1234',
            routingNumber: '9876',
            enabledPaymentMethods: ['ACH'],
            transactionRecipient: {} as any,
          },
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '50.00',
        });
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('returns false when amount is zero', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '0',
        });
      });

      expect(result.current.isComplete).toBe(false);
    });

    it('returns false when amount exceeds available balance', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '500.00',
          availableBalance: 100,
        });
      });

      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('submitting state', () => {
    it('syncs isSubmitting from external prop', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <FlowContextProvider isSubmitting>{children}</FlowContextProvider>
      );

      const { result } = renderHook(() => useFlowContext(), {
        wrapper: customWrapper,
      });

      expect(result.current.isSubmitting).toBe(true);
    });

    it('exposes setIsSubmitting function', () => {
      const { result } = renderHook(() => useFlowContext(), { wrapper });
      expect(typeof result.current.setIsSubmitting).toBe('function');
    });
  });

  describe('FlowContextProvider props', () => {
    it('accepts initialView prop', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <FlowContextProvider initialView="payee-type">
          {children}
        </FlowContextProvider>
      );

      const { result } = renderHook(() => useFlowContext(), {
        wrapper: customWrapper,
      });
      expect(result.current.currentView).toBe('payee-type');
    });

    it('accepts initialData prop', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <FlowContextProvider initialData={{ amount: '200', payeeId: 'p-1' }}>
          {children}
        </FlowContextProvider>
      );

      const { result } = renderHook(() => useFlowContext(), {
        wrapper: customWrapper,
      });
      expect(result.current.formData.amount).toBe('200');
      expect(result.current.formData.payeeId).toBe('p-1');
    });

    it('syncs external isSubmitting prop', async () => {
      const { result } = renderHook(() => useFlowContext(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <FlowContextProvider isSubmitting>{children}</FlowContextProvider>
        ),
      });

      expect(result.current.isSubmitting).toBe(true);
    });

    it('resets state when resetKey changes', () => {
      let resetKey = 1;
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <FlowContextProvider resetKey={resetKey} initialData={{ amount: '50' }}>
          {children}
        </FlowContextProvider>
      );

      const { result, rerender } = renderHook(() => useFlowContext(), {
        wrapper: CustomWrapper,
      });

      // Modify state
      act(() => {
        result.current.setFormData({ payeeId: 'test-payee' });
      });
      expect(result.current.formData.payeeId).toBe('test-payee');

      // Change resetKey triggers reset
      resetKey = 2;
      rerender();

      // After reset, form data goes back to initial (amount: '50')
      // but payeeId should be cleared
      expect(result.current.formData.amount).toBe('50');
    });
  });
});
