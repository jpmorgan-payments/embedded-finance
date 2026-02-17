/**
 * SectionNavigation - Toggle-style navigation for section sheet
 * Optimized for 2 sections with pill-style tabs
 */

import { cn } from '@/lib/utils';

import type { ClientSection, SectionInfo } from '../Summary/SectionList';

interface SectionNavigationProps {
  sections: SectionInfo[];
  currentSection: ClientSection;
  onNavigate: (section: ClientSection) => void;
  className?: string;
}

export function SectionNavigation({
  sections,
  currentSection,
  onNavigate,
  className,
}: SectionNavigationProps) {
  if (sections.length <= 1) return null;

  return (
    <nav
      className={cn(
        'eb-flex eb-items-center eb-justify-center eb-gap-1 eb-rounded-lg eb-bg-muted eb-p-1',
        className
      )}
      aria-label="Section navigation"
    >
      {sections.map((section) => {
        const isActive = section.id === currentSection;
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            className={cn(
              'eb-flex eb-flex-1 eb-items-center eb-justify-center eb-gap-2 eb-rounded-md eb-px-3 eb-py-2 eb-text-sm eb-font-medium eb-transition-colors',
              isActive
                ? 'eb-bg-background eb-text-foreground eb-shadow-sm'
                : 'eb-text-muted-foreground hover:eb-text-foreground'
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            <Icon className="eb-h-4 eb-w-4" aria-hidden="true" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
