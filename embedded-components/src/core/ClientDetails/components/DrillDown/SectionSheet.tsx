/**
 * SectionSheet - Information-dense slide-out panel
 * Maximizes content visibility with minimal chrome
 */

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  identity: 'Organization Details',
  verification: 'Organization Details',
  ownership: 'People',
  compliance: 'Organization Details',
  accounts: 'Accounts',
  activity: 'Activity',
};

const SECTION_DESCRIPTIONS: Record<ClientSection, string> = {
  identity: 'Business info, verification status, and compliance',
  verification: 'Business info, verification status, and compliance',
  ownership: 'Controllers and beneficial owners',
  compliance: 'Business info, verification status, and compliance',
  accounts: 'Linked accounts and payment instruments',
  activity: 'Recent transactions and payment activity',
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
    case 'verification':
    case 'compliance':
      return (
        <div className="eb-space-y-6">
          <OrganizationSection client={client} title="Business Information" />
          <ClientInfoSection client={client} title="Application Status" />
          <ResultsSection client={client} title="Verification" />
          <QuestionResponsesSection client={client} title="Compliance" />
        </div>
      );
    case 'ownership':
      return (
        <div className="eb-space-y-6">
          <ControllerSection client={client} title="Controllers" />
          <BeneficialOwnersSection client={client} title="Beneficial Owners" />
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
  const description = SECTION_DESCRIPTIONS[section];
  const showNavigation = sections && sections.length > 1 && onNavigate;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          'eb-flex eb-h-full eb-max-h-screen eb-w-full eb-flex-col eb-gap-0 eb-p-0 sm:eb-max-w-lg',
          className
        )}
      >
        {/* Header with its own padding */}
        <SheetHeader className="eb-shrink-0 eb-border-b eb-border-border eb-px-6 eb-py-4 eb-pr-14">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Content - scrollable with its own padding */}
        <div className="eb-min-h-0 eb-flex-1 eb-overflow-y-auto eb-px-6 eb-py-4">
          <SectionContent
            client={client}
            clientId={clientId}
            section={section}
          />
        </div>

        {/* Navigation footer with its own padding */}
        {showNavigation && (
          <div className="eb-shrink-0 eb-border-t eb-border-border eb-bg-muted/30 eb-px-6 eb-py-3">
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
