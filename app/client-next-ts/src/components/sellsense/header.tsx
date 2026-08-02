'use client';

import { useState } from 'react';
import {
  Brush,
  Database,
  Info,
  Languages,
  Layers,
  Menu,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { ClientScenario } from './dashboard-layout';
import { HeaderDemoSwitcher } from './header-demo-switcher';
import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

// Company data - always the same
const getCompanyInfo = () => {
  return {
    name: 'Neverland Books',
    description: 'Step into a world of stories and imagination',
  };
};

/** Side drawers that share accordion open behavior (one at a time). */
export type DemoCustomizationDrawer =
  'master' | 'theme' | 'contentTokens' | 'componentProps' | null;

interface HeaderProps {
  clientScenario: ClientScenario;
  setClientScenario: (scenario: ClientScenario) => void;
  /** When theme is Custom, use this for logo/portal styling (e.g. Empty stays Empty) */
  themeForDisplay: ThemeOption;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  activeCustomizationDrawer: DemoCustomizationDrawer;
  onToggleCustomizationDrawer: (
    drawer: Exclude<DemoCustomizationDrawer, null>
  ) => void;
  contentTokenOverrideCount: number;
  componentPropsOverrideCount: number;
  themeOverrideCount: number;
  isMockApiEditorOpen: boolean;
  setIsMockApiEditorOpen: (open: boolean) => void;
  mockOverrideCount: number;
  onResetAllCustomizations: () => void;
}

function OverrideBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-medium leading-none text-white tabular-nums"
      aria-label={`${count} ${label}`}
    >
      {count}
    </span>
  );
}

export function Header({
  clientScenario,
  setClientScenario,
  themeForDisplay,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isInfoModalOpen,
  setIsInfoModalOpen,
  activeCustomizationDrawer,
  onToggleCustomizationDrawer,
  contentTokenOverrideCount,
  componentPropsOverrideCount,
  themeOverrideCount,
  isMockApiEditorOpen,
  setIsMockApiEditorOpen,
  mockOverrideCount,
  onResetAllCustomizations,
}: HeaderProps) {
  const themeStyles = useThemeStyles(themeForDisplay);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const totalCustomizationOverrides =
    themeOverrideCount +
    contentTokenOverrideCount +
    componentPropsOverrideCount;

  return (
    <>
      <header
        className={`sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 shadow-sm lg:px-6 ${themeStyles.getHeaderStyles()}`}
      >
        {/* Left side - Logo and Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          {themeStyles.getLogoPath() && (
            <img
              src={themeStyles.getLogoPath()}
              alt={themeStyles.getLogoAlt()}
              className={`${themeStyles.getLogoStyles()} hidden sm:block`}
            />
          )}
        </div>

        <HeaderDemoSwitcher
          clientScenario={clientScenario}
          setClientScenario={setClientScenario}
          themeForDisplay={themeForDisplay}
        />

        {/* Right side - User section and Settings */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Info button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => setIsInfoModalOpen(!isInfoModalOpen)}
            title="Show demo information"
          >
            <Info className="h-4 w-4 lg:h-5 lg:w-5" />
          </Button>

          {/* Master Mode — combined theme / content / config overview */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'master'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('master')}
            title="Master customization — theme, copy, and config"
          >
            <Layers className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={totalCustomizationOverrides}
              label="total overrides"
            />
          </Button>

          {/* Theme Customization button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'theme'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('theme')}
            title="Customize theme"
          >
            <Brush className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge count={themeOverrideCount} label="theme overrides" />
          </Button>

          {/* Content Token Editor button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'contentTokens'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('contentTokens')}
            title="Edit content tokens"
          >
            <Languages className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={contentTokenOverrideCount}
              label="token overrides"
            />
          </Button>

          {/* Component Props Editor button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              activeCustomizationDrawer === 'componentProps'
                ? 'bg-gray-100 bg-opacity-20'
                : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => onToggleCustomizationDrawer('componentProps')}
            title="Edit component props"
          >
            <SlidersHorizontal className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={componentPropsOverrideCount}
              label="prop overrides"
            />
          </Button>

          {/* Mock API Editor button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${
              isMockApiEditorOpen ? 'bg-gray-100 bg-opacity-20' : ''
            } ${themeStyles.getHeaderButtonStyles()}`}
            onClick={() => setIsMockApiEditorOpen(!isMockApiEditorOpen)}
            title="Edit mock API responses"
          >
            <Database className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge count={mockOverrideCount} label="overrides" />
          </Button>

          {/* Reset all customizations */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative h-8 w-8 rounded-full p-1 ${themeStyles.getHeaderButtonStyles()}`}
            disabled={totalCustomizationOverrides === 0}
            onClick={() => setIsResetConfirmOpen(true)}
            title="Reset all theme, content token, and component prop overrides"
          >
            <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
            <OverrideBadge
              count={totalCustomizationOverrides}
              label="total overrides"
            />
          </Button>

          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 bg-sellsense-primary">
              <AvatarFallback className="text-sm font-medium text-white">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col sm:flex">
              <span
                className={`text-sm font-medium ${themeStyles.getHeaderTextStyles()}`}
              >
                John Doe
              </span>
              <span
                className={`text-xs ${themeStyles.getHeaderCompanyTextStyles()}`}
                title={getCompanyInfo().description}
              >
                {getCompanyInfo().name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset all overrides?</DialogTitle>
            <DialogDescription>
              This clears saved theme, content token, and component prop
              overrides from this browser and restores SellSense defaults. Mock
              API overrides are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onResetAllCustomizations();
                setIsResetConfirmOpen(false);
              }}
            >
              Reset all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
