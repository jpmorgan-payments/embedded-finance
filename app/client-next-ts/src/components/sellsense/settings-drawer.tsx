'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClientScenario, ContentTone } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';
import { getScenarioDisplayNames } from './scenarios-config';

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
  const themeStyles = useThemeStyles(theme);

  // Get scenario display names from centralized config
  const scenarioDisplayNames = getScenarioDisplayNames();

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* Client Scenario Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Client Scenario
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Choose the client onboarding scenario to demonstrate
            </p>
          </div>
          <Select
            value={clientScenario}
            onValueChange={(value) => setClientScenario(value as ClientScenario)}
          >
            <SelectTrigger
              className={`w-full ${themeStyles.getHeaderSelectStyles()}`}
            >
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
            <h3 className="text-sm font-medium text-gray-700 mb-1">Theme</h3>
            <p className="text-xs text-gray-500 mb-3">
              Choose the visual theme for components
            </p>
          </div>
          <Select
            value={theme}
            onValueChange={(value) => setTheme(value as ThemeOption)}
          >
            <SelectTrigger
              className={`w-full ${themeStyles.getHeaderSelectStyles()}`}
            >
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Empty">Empty (Defaults)</SelectItem>
              <SelectItem value="Default Blue">Default Blue</SelectItem>
              <SelectItem value="SellSense">SellSense</SelectItem>
              <SelectItem value="S&P Theme">S&P Theme</SelectItem>
              <SelectItem value="Create Commerce">Create Commerce</SelectItem>
              <SelectItem value="PayFicient">PayFicient</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Tone Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Content Tone
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Adjust the language style of component text
            </p>
          </div>
          <Select
            value={contentTone}
            onValueChange={(value) => setContentTone(value as ContentTone)}
          >
            <SelectTrigger
              className={`w-full ${themeStyles.getHeaderSelectStyles()}`}
            >
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Friendly">Friendly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info Section */}
        <div className="pt-6 border-t border-gray-200">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              About This Demo
            </h3>
            <div className="text-xs text-gray-500 space-y-2">
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
  );
}
