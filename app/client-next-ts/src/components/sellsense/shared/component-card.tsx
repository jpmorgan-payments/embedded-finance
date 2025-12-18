'use client';

import { useState } from 'react';
import { Info, Maximize2 } from 'lucide-react';

import packageJson from '../../../../package.json';

interface ComponentTooltipProps {
  componentName: string;
  componentDescription: string;
  componentFeatures: string[];
  onClose: () => void;
  onFullScreen: () => void;
}

export function ComponentTooltip({
  componentName,
  componentDescription,
  componentFeatures,
  onClose,
  onFullScreen,
}: ComponentTooltipProps) {
  return (
    <div className="absolute right-0 top-6 z-50 w-96 rounded-lg bg-gray-900 p-4 text-xs text-white shadow-lg">
      <div className="space-y-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {componentName} Component Details
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Component Information */}
        <div>
          <h4 className="mb-2 font-medium text-gray-200">
            Component Information
          </h4>
          <div className="space-y-1 text-gray-300">
            <p>
              <strong>Package:</strong>{' '}
              @jpmorgan-payments/embedded-finance-components
            </p>
            <p>
              <strong>Version:</strong>{' '}
              {
                packageJson.dependencies[
                  '@jpmorgan-payments/embedded-finance-components'
                ]
              }
            </p>
            <p>
              <strong>Component:</strong> {componentName}
            </p>
            <p>
              <strong>Type:</strong> React Component
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="mb-2 font-medium text-gray-200">Description</h4>
          <p className="text-gray-300">{componentDescription}</p>
        </div>

        {/* Key Features */}
        <div>
          <h4 className="mb-2 font-medium text-gray-200">Key Features</h4>
          <ul className="space-y-1 text-gray-300">
            {componentFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-gray-400">•</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 border-t border-gray-700 pt-2">
          <button
            onClick={onFullScreen}
            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-blue-700"
          >
            <Maximize2 size={12} />
            Open Full Screen
          </button>
        </div>
      </div>

      {/* Tooltip Arrow */}
      <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 transform bg-gray-900"></div>
    </div>
  );
}

interface InfoIconProps {
  onClick: () => void;
  title: string;
}

export function InfoIcon({ onClick, title }: InfoIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-amber-200/20"
      title={title}
    >
      <Info size={12} className="text-amber-700" />
    </button>
  );
}

interface EmbeddedComponentCardProps {
  component: React.ReactNode;
  componentName: string;
  componentDescription: string;
  componentFeatures: string[];
  isAnyTooltipOpen: boolean;
  onTooltipToggle: (componentName: string, isOpen: boolean) => void;
  onFullScreen: () => void;
}

export function EmbeddedComponentCard({
  component,
  componentName,
  componentDescription,
  componentFeatures,
  isAnyTooltipOpen,
  onTooltipToggle,
  onFullScreen,
}: EmbeddedComponentCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTooltipToggle = () => {
    const newState = !showTooltip;
    setShowTooltip(newState);
    onTooltipToggle(componentName, newState);
  };

  const shouldShowIcon = !isAnyTooltipOpen || showTooltip;

  return (
    <div
      className={`relative rounded-lg border border-white bg-transparent ${
        showTooltip ? 'p-6' : 'p-0'
      }`}
    >
      {/* Info Icon Overlay */}
      {shouldShowIcon && (
        <div className="absolute right-2 top-2 z-10">
          <div className="relative">
            <InfoIcon onClick={handleTooltipToggle} title="Component Details" />

            {showTooltip && (
              <ComponentTooltip
                componentName={componentName}
                componentDescription={componentDescription}
                componentFeatures={componentFeatures}
                onClose={handleTooltipToggle}
                onFullScreen={onFullScreen}
              />
            )}
          </div>
        </div>
      )}

      {/* Component Content */}
      {component}
    </div>
  );
}

// Utility function for creating fullscreen URLs (no hooks)
export function createFullscreenUrl(
  componentName: string,
  currentTheme: string = 'SellSense',
  additionalParams?: Record<string, string>
) {
  const componentMap: Record<string, string> = {
    Accounts: 'accounts',
    LinkedAccountWidget: 'linked-accounts',
    Recipients: 'recipients',
    TransactionsDisplay: 'transactions',
    MakePayment: 'make-payment',
    OnboardingFlow: 'onboarding',
  };

  const params = new URLSearchParams({
    fullscreen: 'true',
    component: componentMap[componentName] || componentName.toLowerCase(),
    theme: currentTheme,
    ...additionalParams,
  });

  return (
    window.location.href.replace(window.location.search, '') +
    '?' +
    params.toString()
  );
}
