'use client';

import React from 'react';

import type { FlowViewProps, PaymentFlowView } from '../PaymentFlow.types';
import { useFlowContext } from './FlowContext';

/**
 * FlowView component
 * Renders children only when the current view matches the viewId
 */
export function FlowView({ viewId, children }: FlowViewProps) {
  const { currentView } = useFlowContext();

  if (currentView !== viewId) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if a specific view is active
 */
export function useIsViewActive(viewId: PaymentFlowView): boolean {
  const { currentView } = useFlowContext();
  return currentView === viewId;
}
