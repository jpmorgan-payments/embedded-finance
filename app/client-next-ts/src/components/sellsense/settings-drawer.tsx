'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Settings } from 'lucide-react';
import type { ClientScenario, ContentTone } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';

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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${themeStyles.getSidebarStyles()}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Demo Settings</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 hover:bg-opacity-10 ${themeStyles.getHeaderButtonStyles()}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
          {/* Client Scenario Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Client Scenario
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Select the client onboarding state to demonstrate
              </p>
            </div>
            <Select
              value={clientScenario}
              onValueChange={(value) =>
                setClientScenario(value as ClientScenario)
              }
            >
              <SelectTrigger
                className={`w-full ${themeStyles.getHeaderSelectStyles()}`}
              >
                <SelectValue placeholder="Select client scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New Seller - Onboarding">
                  New Seller - Onboarding
                </SelectItem>
                <SelectItem value="Onboarding - Docs Needed">
                  Onboarding - Docs Needed
                </SelectItem>
                <SelectItem value="Onboarding - In Review">
                  Onboarding - In Review
                </SelectItem>
                <SelectItem value="Active Seller - Fresh Start">
                  Active Seller - Fresh Start
                </SelectItem>
                <SelectItem value="Active Seller - Established">
                  Active Seller - Established
                </SelectItem>
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
    </>
  );
}
