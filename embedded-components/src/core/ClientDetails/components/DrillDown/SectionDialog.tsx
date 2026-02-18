/**
 * SectionDialog - Information-dense modal dialog for client details
 * Following the RecipientDetailsDialog pattern from RecipientsWidget
 */

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Accounts } from '../../../Accounts';
import { TransactionsDisplay } from '../../../TransactionsDisplay';
import { PeopleSection } from '../ClientDetailsContent/PeopleSection';
import type { ClientSection, SectionInfo } from '../Summary/SectionList';
import { BusinessDetailsContent } from './BusinessDetailsContent';
import { SectionNavigation } from './SectionNavigation';

export interface SectionDialogProps {
  /** The client data to display */
  client: ClientResponse;
  /** The client ID for fetching related data */
  clientId: string;
  /** The section to display */
  section: ClientSection;
  /** Available sections for navigation */
  sections?: SectionInfo[];
  /** Callback when navigating to a different section */
  onNavigate?: (section: ClientSection) => void;
  /** The trigger element to open the dialog */
  children: React.ReactNode;
  /** Additional class name for the dialog content */
  className?: string;
}

const SECTION_TITLES: Record<ClientSection, string> = {
  identity: 'Business Details',
  verification: 'Business Details',
  ownership: 'People',
  compliance: 'Business Details',
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
      return <BusinessDetailsContent client={client} />;
    case 'ownership':
      return <PeopleSection client={client} title="" />;
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

/**
 * SectionDialog - Displays detailed client information in a modal dialog
 * Pattern inspired by RecipientDetailsDialog from RecipientsWidget
 */
export function SectionDialog({
  client,
  clientId,
  section,
  sections,
  onNavigate,
  children,
  className,
}: SectionDialogProps) {
  const title = SECTION_TITLES[section];
  const description = SECTION_DESCRIPTIONS[section];
  const showNavigation = sections && sections.length > 1 && onNavigate;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn('eb-overflow-hidden eb-p-0 sm:eb-max-w-lg', className)}
      >
        {/* Header - matching RecipientDetailsDialog pattern */}
        <DialogHeader className="eb-shrink-0 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-break-words eb-text-left eb-font-header eb-text-xl eb-leading-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="eb-mt-1 eb-text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Content - scrollable, matching RecipientDetailsDialog */}
        <div className="eb-flex-1 eb-overflow-y-auto eb-p-6 eb-pt-5">
          <SectionContent
            client={client}
            clientId={clientId}
            section={section}
          />
        </div>

        {/* Navigation footer */}
        {showNavigation && (
          <div className="eb-shrink-0 eb-border-t eb-bg-muted/30 eb-px-6 eb-py-3">
            <SectionNavigation
              sections={sections}
              currentSection={section}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
