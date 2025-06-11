'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Globe, Settings } from 'lucide-react';
import type { ClientScenario, ContentTone } from './dashboard-layout';
import type { ThemeOption } from './use-sellsense-themes';
import { useThemeStyles } from './theme-utils';

interface HeaderProps {
  clientScenario: ClientScenario;
  setClientScenario: (scenario: ClientScenario) => void;
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  contentTone: ContentTone;
  setContentTone: (tone: ContentTone) => void;
}

export function Header({
  clientScenario,
  setClientScenario,
  theme,
  setTheme,
  contentTone,
  setContentTone,
}: HeaderProps) {
  const themeStyles = useThemeStyles(theme);

  return (
    <header
      className={`border-b px-6 py-3 shadow-sm h-16 flex items-center justify-between sticky top-0 z-10 ${themeStyles.getHeaderStyles()}`}
    >
      {/* Logo */}
      <div className="flex items-center">
        <img
          src="/sellSense.svg"
          alt="SellSense Logo"
          className="h-7"
          style={{ width: '184px' }}
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-6">
        {/* Demo Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <label
              className={`text-xs mb-1 ${themeStyles.getHeaderLabelStyles()}`}
            >
              Client View:
            </label>
            <Select
              value={clientScenario}
              onValueChange={(value) =>
                setClientScenario(value as ClientScenario)
              }
            >
              <SelectTrigger
                className={`w-[220px] h-8 text-sm ${themeStyles.getHeaderSelectStyles()}`}
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

          <div className="flex flex-col">
            <label
              className={`text-xs mb-1 ${themeStyles.getHeaderLabelStyles()}`}
            >
              Theme:
            </label>
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as ThemeOption)}
            >
              <SelectTrigger
                className={`w-[190px] h-8 text-sm ${themeStyles.getHeaderSelectStyles()}`}
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

          <div className="flex flex-col">
            <label
              className={`text-xs mb-1 ${themeStyles.getHeaderLabelStyles()}`}
            >
              Tone:
            </label>
            <Select
              value={contentTone}
              onValueChange={(value) => setContentTone(value as ContentTone)}
            >
              <SelectTrigger
                className={`w-[120px] h-8 text-sm ${themeStyles.getHeaderSelectStyles()}`}
              >
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User section */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
          >
            <Globe className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 bg-sellsense-primary">
              <AvatarFallback className="text-white text-sm font-medium">
                JD
              </AvatarFallback>
            </Avatar>
            <span
              className={`text-sm font-medium ${themeStyles.getHeaderTextStyles()}`}
            >
              John Doe
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
