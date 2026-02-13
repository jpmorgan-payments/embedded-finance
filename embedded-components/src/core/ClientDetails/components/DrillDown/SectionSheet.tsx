/**
 * SectionSheet - Information-dense slide-out panel
 * Maximizes content visibility with minimal chrome
 */

import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { Accounts } from '../../../Accounts';
import { TransactionsDisplay } from '../../../TransactionsDisplay';
import { BeneficialOwnersSection } from '../ClientDetailsContent/BeneficialOwnersSection';
import { ClientInfoSection } from '../ClientDetailsContent/ClientInfoSection';
import { ControllerSection } from '../ClientDetailsContent/ControllerSection';
import { OrganizationSection } from '../ClientDetailsContent/OrganizationSection';
import { QuestionResponsesSection } from '../ClientDetailsContent/QuestionResponsesSection';
import { ResultsSection } from '../ClientDetailsContent/ResultsSection';
import type { ClientSection, SectionInfo } from '../Summary/SectionList';
import { SectionNavigation } from './SectionNavigation';

interface SectionSheetProps {
  client: ClientResponse;
  clientId: string;
  section: ClientSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections?: SectionInfo[];
  onNavigate?: (section: ClientSection) => void;
  className?: string;
}

const SECTION_TITLES: Record<ClientSection, string> = {
  identity: 'Organization',
  verification: 'Verification',
  ownership: 'Ownership',
  compliance: 'Compliance',
  accounts: 'Accounts',
  activity: 'Activity',
};

function SectionContent({
  client,
  clientId,
  section,
}: {
  client: ClientResponse;
  clientId: string;
  section: ClientSection;
}) {
  switch (section) {
    case 'identity':
      return (
        <div className="eb-space-y-3">
          <OrganizationSection client={client} title="" />
          <ControllerSection client={client} title="Controller" />
        </div>
      );
    case 'verification':
      return (
        <div className="eb-space-y-3">
          <ClientInfoSection client={client} title="" />
          <ResultsSection client={client} title="" />
        </div>
      );
    case 'ownership':
      return (
        <div className="eb-space-y-3">
          <ControllerSection client={client} title="Controller" />
          <BeneficialOwnersSection client={client} title="Beneficial Owners" />
        </div>
      );
    case 'compliance':
      return (
        <div className="eb-space-y-3">
          <QuestionResponsesSection client={client} title="" />
        </div>
      );
    case 'accounts':
      return (
        <Accounts
          clientId={clientId}
          allowedCategories={['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']}
          headingLevel={3}
        />
      );
    case 'activity':
      return <TransactionsDisplay />;
    default:
      return null;
  }
}

export function SectionSheet({
  client,
  clientId,
  section,
  open,
  onOpenChange,
  sections,
  onNavigate,
  className,
}: SectionSheetProps) {
  if (!section) return null;

  const title = SECTION_TITLES[section];
  const showNavigation = sections && sections.length > 1 && onNavigate;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          'eb-flex eb-w-full eb-flex-col eb-overflow-hidden eb-p-0 sm:eb-max-w-lg',
          className
        )}
      >
        {/* Minimal Header */}
        <SheetHeader className="eb-shrink-0 eb-border-b eb-border-border eb-px-3 eb-py-2">
          <div className="eb-flex eb-items-center eb-justify-between">
            <SheetTitle className="eb-text-sm eb-font-semibold eb-text-foreground">
              {title}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="eb-h-6 eb-w-6"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="eb-h-4 eb-w-4" aria-hidden="true" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content - takes most space */}
        <div className="eb-flex-1 eb-overflow-y-auto eb-p-3">
          <SectionContent
            client={client}
            clientId={clientId}
            section={section}
          />
        </div>

        {/* Compact Navigation */}
        {showNavigation && (
          <div className="eb-shrink-0 eb-border-t eb-border-border eb-px-3 eb-py-2">
            <SectionNavigation
              sections={sections}
              currentSection={section}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
