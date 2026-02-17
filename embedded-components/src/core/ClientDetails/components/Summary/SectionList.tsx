/**
 * SectionList - Navigable list of client detail sections
 */

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  TrendingUp,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type ClientSection =
  | 'identity'
  | 'verification'
  | 'ownership'
  | 'compliance'
  | 'accounts'
  | 'activity';

export interface SectionInfo {
  id: ClientSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  status?: 'complete' | 'pending' | 'warning' | 'error';
  disabled?: boolean;
}

interface SectionListProps {
  sections: SectionInfo[];
  onSectionClick?: (section: ClientSection) => void;
  className?: string;
}

const SECTION_ICONS: Record<
  ClientSection,
  React.ComponentType<{ className?: string }>
> = {
  identity: Building2,
  verification: CheckCircle2,
  ownership: Users,
  compliance: ClipboardList,
  accounts: CreditCard,
  activity: TrendingUp,
};

const STATUS_STYLES: Record<string, string> = {
  complete: 'eb-text-green-600 dark:eb-text-green-400',
  pending: 'eb-text-amber-600 dark:eb-text-amber-400',
  warning: 'eb-text-orange-600 dark:eb-text-orange-400',
  error: 'eb-text-red-600 dark:eb-text-red-400',
};

export function getSectionIcon(section: ClientSection) {
  return SECTION_ICONS[section] ?? Building2;
}

export function SectionList({
  sections,
  onSectionClick,
  className,
}: SectionListProps) {
  if (sections.length === 0) return null;

  return (
    <div
      className={cn(
        'eb-divide-y eb-divide-border eb-overflow-hidden eb-rounded-lg eb-border eb-border-border',
        className
      )}
    >
      {sections.map((section) => {
        const Icon = section.icon;
        const isClickable = !section.disabled && !!onSectionClick;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => isClickable && onSectionClick?.(section.id)}
            disabled={section.disabled || !onSectionClick}
            className={cn(
              'eb-flex eb-w-full eb-items-center eb-gap-3 eb-bg-card eb-px-4 eb-py-3 eb-text-left eb-transition-colors',
              isClickable && 'hover:eb-bg-muted/50',
              section.disabled && 'eb-cursor-not-allowed eb-opacity-50'
            )}
          >
            <div
              className={cn(
                'eb-flex eb-h-9 eb-w-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg eb-bg-muted/50',
                section.status && STATUS_STYLES[section.status]
              )}
            >
              <Icon className="eb-h-4 eb-w-4" aria-hidden="true" />
            </div>

            <div className="eb-min-w-0 eb-flex-1">
              <div className="eb-flex eb-items-center eb-gap-2">
                <span className="eb-text-sm eb-font-medium eb-text-foreground">
                  {section.label}
                </span>
                {section.badge && (
                  <span className="eb-rounded-full eb-bg-muted eb-px-2 eb-py-0.5 eb-text-xs eb-text-muted-foreground">
                    {section.badge}
                  </span>
                )}
              </div>
              {section.description && (
                <p className="eb-mt-0.5 eb-truncate eb-text-xs eb-text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>

            {isClickable && (
              <ChevronRight
                className="eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
