'use client';

import React from 'react'; // Added missing import for React
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ClientScenario, ContentTone } from './dashboard-layout';
import { getScenarioDisplayNames } from './scenarios-config';
import type { ThemeOption } from './use-sellsense-themes';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientScenario: ClientScenario;
  setClientScenario: (scenario: ClientScenario) => void;
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  contentTone: ContentTone;
  setContentTone: (tone: ContentTone) => void;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  clientScenario,
  setClientScenario,
  theme,
  setTheme,
  contentTone,
  setContentTone,
}: SettingsDrawerProps) {
  // Get scenario display names from centralized config
  const scenarioDisplayNames = getScenarioDisplayNames();

  // Handle backdrop click to close drawer
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close drawer
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Restore body scroll when drawer closes
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-96 transform border-l border-gray-200 bg-gray-50 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Demo Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-full space-y-6 overflow-y-auto p-6">
          {/* Client Scenario Section */}
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Client Scenario
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Choose the client onboarding scenario to demonstrate
              </p>
            </div>
            <Select
              value={clientScenario}
              onValueChange={(value) =>
                setClientScenario(value as ClientScenario)
              }
            >
              <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                <SelectValue placeholder="Select client scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarioDisplayNames.map((displayName) => (
                  <SelectItem key={displayName} value={displayName}>
                    {displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Section */}
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">Theme</h3>
              <p className="mb-3 text-xs text-gray-500">
                Choose the visual theme for components
              </p>
            </div>
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as ThemeOption)}
            >
              <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Empty">Empty (Defaults)</SelectItem>
                <SelectItem value="Default Blue">Default Blue</SelectItem>
                <SelectItem value="SellSense">SellSense</SelectItem>
                <SelectItem value="Salt Theme">Salt Theme</SelectItem>
                <SelectItem value="Create Commerce">Create Commerce</SelectItem>
                <SelectItem value="PayFicient">PayFicient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Tone Section */}
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Content Tone
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Adjust the language style of component text
              </p>
            </div>
            <Select
              value={contentTone}
              onValueChange={(value) => setContentTone(value as ContentTone)}
            >
              <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                About This Demo
              </h3>
              <div className="space-y-2 text-xs text-gray-500">
                <p>
                  This showcase demonstrates the SellSense marketplace
                  integration with JP Morgan's embedded finance components.
                </p>
                <p>
                  Changes to these settings will update the demo experience and
                  persist in the URL for easy sharing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
