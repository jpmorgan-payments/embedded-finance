'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import type {
  FlowAction,
  FlowContextValue,
  FlowState,
  PaymentFlowFormData,
  PaymentFlowView,
} from '../PaymentFlow.types';

/**
 * Initial form data state
 */
const initialFormData: PaymentFlowFormData = {
  amount: '',
  currency: 'USD',
};

/**
 * Initial flow state
 */
const initialState: FlowState = {
  currentView: 'main',
  viewStack: [],
  formData: initialFormData,
  expandedPanels: [],
  validationErrors: [],
  isSubmitting: false,
};

/**
 * Flow state reducer
 */
function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'PUSH_VIEW':
      return {
        ...state,
        currentView: action.view,
        viewStack: [...state.viewStack, state.currentView],
        formData: action.data
          ? { ...state.formData, ...action.data }
          : state.formData,
      };

    case 'POP_VIEW': {
      const newStack = [...state.viewStack];
      const previousView = newStack.pop() ?? 'main';
      return {
        ...state,
        currentView: previousView,
        viewStack: newStack,
      };
    }

    case 'REPLACE_VIEW':
      return {
        ...state,
        currentView: action.view,
        formData: action.data
          ? { ...state.formData, ...action.data }
          : state.formData,
      };

    case 'TOGGLE_PANEL': {
      const isExpanded = state.expandedPanels.includes(action.panelId);
      return {
        ...state,
        expandedPanels: isExpanded
          ? state.expandedPanels.filter((id) => id !== action.panelId)
          : [...state.expandedPanels, action.panelId],
      };
    }

    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.data },
        // Clear validation errors for the field being updated
        validationErrors: state.validationErrors,
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.errors,
      };

    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: [],
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * Flow context
 */
const FlowContext = createContext<FlowContextValue | null>(null);

/**
 * Hook to access flow context
 */
export function useFlowContext(): FlowContextValue {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlowContext must be used within a FlowContextProvider');
  }
  return context;
}

/**
 * Props for the FlowContextProvider
 */
interface FlowContextProviderProps {
  children: React.ReactNode;
  initialView?: PaymentFlowView;
  initialData?: Partial<PaymentFlowFormData>;
  /** External isSubmitting state to sync to context (from parent component) */
  isSubmitting?: boolean;
  /** Key to trigger state reset without remounting. Change this to reset all flow state. */
  resetKey?: string | number;
}

/**
 * FlowContextProvider component
 * Provides flow navigation and state management to child components
 */
export function FlowContextProvider({
  children,
  initialView = 'main',
  initialData,
  isSubmitting: externalIsSubmitting = false,
  resetKey,
}: FlowContextProviderProps) {
  const [state, dispatch] = useReducer(flowReducer, {
    ...initialState,
    currentView: initialView,
    formData: initialData
      ? { ...initialFormData, ...initialData }
      : initialFormData,
  });

  // Track the last resetKey to detect changes
  const lastResetKeyRef = React.useRef(resetKey);

  // Reset state when resetKey changes (without remounting)
  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      dispatch({ type: 'RESET' });
      if (initialData) {
        dispatch({ type: 'SET_FORM_DATA', data: initialData });
      }
      if (initialView !== 'main') {
        dispatch({ type: 'REPLACE_VIEW', view: initialView });
      }
    }
  }, [resetKey, initialData, initialView]);

  // Sync external isSubmitting prop to context state
  useEffect(() => {
    if (externalIsSubmitting !== state.isSubmitting) {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: externalIsSubmitting });
    }
  }, [externalIsSubmitting, state.isSubmitting]);

  const pushView = useCallback(
    (view: PaymentFlowView, data?: Partial<PaymentFlowFormData>) => {
      dispatch({ type: 'PUSH_VIEW', view, data });
    },
    []
  );

  const popView = useCallback(() => {
    dispatch({ type: 'POP_VIEW' });
  }, []);

  const replaceView = useCallback(
    (view: PaymentFlowView, data?: Partial<PaymentFlowFormData>) => {
      dispatch({ type: 'REPLACE_VIEW', view, data });
    },
    []
  );

  const setFormData = useCallback((data: Partial<PaymentFlowFormData>) => {
    dispatch({ type: 'SET_FORM_DATA', data });
  }, []);

  const togglePanel = useCallback((panelId: string) => {
    dispatch({ type: 'TOGGLE_PANEL', panelId });
  }, []);

  const isPanelExpanded = useCallback(
    (panelId: string) => state.expandedPanels.includes(panelId),
    [state.expandedPanels]
  );

  // Determine if the flow is complete (all required fields filled)
  const isComplete = useMemo(() => {
    const { formData } = state;
    const amount = parseFloat(formData.amount) || 0;
    // A recipient is valid if either a saved payeeId OR an unsavedRecipient is present
    const hasRecipient = !!(formData.payeeId || formData.unsavedRecipient);
    const hasRequiredFields = !!(
      hasRecipient &&
      formData.paymentMethod &&
      formData.fromAccountId &&
      formData.amount &&
      amount > 0
    );

    // Check if amount exceeds available balance
    const exceedsBalance =
      formData.availableBalance !== undefined &&
      amount > formData.availableBalance;

    return hasRequiredFields && !exceedsBalance;
  }, [state]);

  const setValidationErrors = useCallback((errors: string[]) => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', errors });
  }, []);

  const clearValidationErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
  }, []);

  const contextValue: FlowContextValue = useMemo(
    () => ({
      currentView: state.currentView,
      pushView,
      popView,
      replaceView,
      canGoBack: state.viewStack.length > 0,
      formData: state.formData,
      setFormData,
      expandedPanels: state.expandedPanels,
      togglePanel,
      isPanelExpanded,
      isComplete,
      validationErrors: state.validationErrors,
      setValidationErrors,
      clearValidationErrors,
      isSubmitting: state.isSubmitting,
      setIsSubmitting: (isSubmitting: boolean) =>
        dispatch({ type: 'SET_SUBMITTING', isSubmitting }),
    }),
    [
      state.currentView,
      state.formData,
      state.viewStack.length,
      state.expandedPanels,
      state.validationErrors,
      state.isSubmitting,
      pushView,
      popView,
      replaceView,
      setFormData,
      togglePanel,
      isPanelExpanded,
      isComplete,
      setValidationErrors,
      clearValidationErrors,
    ]
  );

  return (
    <FlowContext.Provider value={contextValue}>{children}</FlowContext.Provider>
  );
}

export { FlowContext };
