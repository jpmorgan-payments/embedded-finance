/**
 * SectionNavigation - Clean prev/next navigation for section sheet
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const currentIndex = sections.findIndex((s) => s.id === currentSection);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection =
    currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  if (sections.length <= 1) return null;

  return (
    <nav
      className={cn('eb-flex eb-items-center eb-justify-between', className)}
      aria-label="Section navigation"
    >
      {prevSection ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(prevSection.id)}
          className="eb-gap-1 eb-text-muted-foreground hover:eb-text-foreground"
          aria-label={`Go to ${prevSection.label}`}
        >
          <ChevronLeft className="eb-h-4 eb-w-4" aria-hidden="true" />
          <span className="eb-hidden sm:eb-inline">{prevSection.label}</span>
          <span className="sm:eb-hidden">Previous</span>
        </Button>
      ) : (
        <div aria-hidden="true" />
      )}

      {/* Page indicator */}
      <span className="eb-text-xs eb-text-muted-foreground" aria-current="step">
        {currentIndex + 1} of {sections.length}
      </span>

      {nextSection ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(nextSection.id)}
          className="eb-gap-1 eb-text-muted-foreground hover:eb-text-foreground"
          aria-label={`Go to ${nextSection.label}`}
        >
          <span className="eb-hidden sm:eb-inline">{nextSection.label}</span>
          <span className="sm:eb-hidden">Next</span>
          <ChevronRight className="eb-h-4 eb-w-4" aria-hidden="true" />
        </Button>
      ) : (
        <div aria-hidden="true" />
      )}
    </nav>
  );
}
