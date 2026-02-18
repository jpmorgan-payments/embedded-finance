/**
 * ClientSummaryCard - Business-focused client overview
 *
 * Design philosophy: Context-aware display
 * 1. APPROVED clients see: Business identity + People listing + Business details
 * 2. ONBOARDING clients see: Same + grouped Onboarding Progress section
 *
 * Real-world inspiration:
 * - LinkedIn company pages: Clean header, prominent team/people section
 * - Stripe dashboard: Business card with team members
 * - Business registries: Clear listing of directors/owners
 */

import { useMemo } from 'react';
import {
  Building2,
  ChevronRight,
  FileText,
  MapPin,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Card } from '@/components/ui/card';

import {
  getBeneficialOwnerParties,
  getControllerParty,
  getOrganizationParty,
} from '../../utils/partyGrouping';
import { SectionDialog } from '../DrillDown/SectionDialog';
import type { ClientSection, SectionInfo } from './SectionList';

interface ClientSummaryCardProps {
  client: ClientResponse;
  /** Client ID for fetching related data (required for drill-down) */
  clientId: string;
  /** External navigation handler - disables built-in dialog drill-down */
  onSectionClick?: (section: ClientSection) => void;
  /** Which sections to display */
  sections?: ClientSection[];
  /** Section info for navigation (used by SectionDialog) */
  sectionInfos?: SectionInfo[];
  /** Custom actions to render in the footer */
  actions?: React.ReactNode;
  className?: string;
}

// Status type for styling
type StatusType = 'success' | 'warning' | 'error' | 'pending';

function getStatusType(clientStatus: string): StatusType {
  if (clientStatus === 'APPROVED') return 'success';
  if (
    clientStatus === 'DECLINED' ||
    clientStatus === 'SUSPENDED' ||
    clientStatus === 'TERMINATED'
  )
    return 'error';
  if (
    clientStatus === 'INFORMATION_REQUESTED' ||
    clientStatus === 'REVIEW_IN_PROGRESS'
  )
    return 'warning';
  return 'pending';
}

/**
 * Extract organization details
 */
function getOrganizationDetails(client: ClientResponse) {
  const org = getOrganizationParty(client);
  const orgDetails = org?.organizationDetails;
  const address = orgDetails?.addresses?.[0];

  const addressParts = [
    address?.addressLines?.[0],
    address?.city,
    address?.state,
    address?.postalCode,
  ].filter(Boolean);

  return {
    name: orgDetails?.organizationName ?? 'Unknown Organization',
    dbaName: orgDetails?.dbaName,
    organizationType: orgDetails?.organizationType,
    location: [address?.city, address?.state].filter(Boolean).join(', '),
    fullAddress: addressParts.join(', '),
    country: address?.country ?? 'US',
    ein: orgDetails?.organizationIds?.find((id) => id.idType === 'EIN')?.value,
    phone: orgDetails?.phone?.phoneNumber,
    email: org?.email,
    yearOfFormation: orgDetails?.yearOfFormation,
    industry: orgDetails?.industryCategory ?? orgDetails?.industryType,
    website: orgDetails?.website,
    countryOfFormation: orgDetails?.countryOfFormation,
  };
}

/**
 * Get all individual parties (controller + beneficial owners)
 */
function getIndividualParties(client: ClientResponse) {
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);

  const people: Array<{
    id: string;
    name: string;
    title?: string;
    titleDescription?: string;
    email?: string;
    roles: string[];
    isController: boolean;
  }> = [];

  if (controller) {
    const details = controller.individualDetails;
    people.push({
      id: controller.id ?? 'controller',
      name: details
        ? `${details.firstName ?? ''} ${details.lastName ?? ''}`.trim()
        : 'Unknown',
      title: details?.jobTitle,
      titleDescription: details?.jobTitleDescription,
      email: controller.email,
      roles: ['Controller'],
      isController: true,
    });
  }

  beneficialOwners.forEach((owner, idx) => {
    const details = owner.individualDetails;
    const isAlsoController =
      controller && owner.id && owner.id === controller.id;

    // If this person is also the controller, add the role to existing entry
    if (isAlsoController && people.length > 0) {
      people[0].roles.push('Beneficial Owner');
    } else {
      people.push({
        id: owner.id ?? `owner-${idx}`,
        name: details
          ? `${details.firstName ?? ''} ${details.lastName ?? ''}`.trim()
          : 'Unknown',
        title: details?.jobTitle,
        titleDescription: details?.jobTitleDescription,
        email: owner.email,
        roles: ['Beneficial Owner'],
        isController: false,
      });
    }
  });

  return people;
}

const DEFAULT_SECTIONS: ClientSection[] = ['identity', 'ownership'];

export function ClientSummaryCard({
  client,
  clientId,
  onSectionClick,
  sections = DEFAULT_SECTIONS,
  sectionInfos,
  actions,
  className,
}: ClientSummaryCardProps) {
  const { t } = useTranslation(['onboarding-old', 'onboarding-overview']);

  const org = useMemo(() => getOrganizationDetails(client), [client]);
  const people = useMemo(() => getIndividualParties(client), [client]);

  const statusType = getStatusType(client.status);
  const isApproved = client.status === 'APPROVED';

  // Determine click behavior:
  // - External handler: use onSectionClick callback
  // - Built-in dialog: use SectionDialog (requires sectionInfos)
  // - Neither: not clickable
  const useExternalHandler = !!onSectionClick;
  const useBuiltInDialog = !onSectionClick && !!sectionInfos;
  const isClickable = useExternalHandler || useBuiltInDialog;

  const translatedOrgType = org.organizationType
    ? t(`onboarding-overview:organizationTypes.${org.organizationType}`, {
        defaultValue: org.organizationType.replace(/_/g, ' '),
      })
    : null;

  const translatedStatus = t(
    `onboarding-old:clientOnboardingStatus.statusLabels.${client.status}`,
    { defaultValue: client.status.replace(/_/g, ' ') }
  );

  // Reusable row content component for consistent styling
  const SectionRowContent = ({
    icon: Icon,
    iconClassName,
    iconBgClassName,
    title,
    subtitle,
    badge,
    children,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    iconBgClassName: string;
    title: string;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <>
      {/* Large container: Icon in colored box */}
      <div
        className={cn(
          'eb-hidden eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg @sm:eb-flex',
          iconBgClassName
        )}
      >
        <Icon
          className={cn('eb-h-5 eb-w-5', iconClassName)}
          aria-hidden="true"
        />
      </div>
      <div className="eb-min-w-0 eb-flex-1">
        <div className="eb-flex eb-items-center eb-gap-1.5 @sm:eb-gap-2">
          {/* Small container: Inline icon with title */}
          <Icon
            className={cn('eb-h-4 eb-w-4 @sm:eb-hidden', iconClassName)}
            aria-hidden="true"
          />
          <span
            className={cn(
              'eb-text-sm eb-font-medium eb-text-foreground',
              isClickable && 'group-hover:eb-underline'
            )}
          >
            {title}
          </span>
          {badge}
        </div>
        {subtitle && (
          <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
            {subtitle}
          </div>
        )}
        {children}
      </div>
      {isClickable && (
        <ChevronRight
          className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground @sm:eb-mt-2.5"
          aria-hidden="true"
        />
      )}
    </>
  );

  // Reusable section row - wraps with Dialog when using built-in, otherwise uses button
  const SectionRow = ({
    section,
    ...contentProps
  }: {
    section: ClientSection;
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    iconBgClassName: string;
    title: string;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    children?: React.ReactNode;
  }) => {
    const rowClassName = cn(
      'eb-group eb-flex eb-w-full eb-items-start eb-gap-2 eb-p-3 eb-text-left eb-transition-colors @sm:eb-gap-3',
      isClickable
        ? 'hover:eb-bg-muted/50 active:eb-bg-muted/70 eb-cursor-pointer'
        : 'eb-cursor-default'
    );

    // Use built-in Dialog when no external handler
    if (useBuiltInDialog) {
      return (
        <SectionDialog
          client={client}
          clientId={clientId}
          section={section}
          sections={sectionInfos}
        >
          <button type="button" className={rowClassName}>
            <SectionRowContent {...contentProps} />
          </button>
        </SectionDialog>
      );
    }

    // External handler - use simple button
    return (
      <button
        type="button"
        onClick={() => onSectionClick?.(section)}
        disabled={!isClickable}
        className={rowClassName}
      >
        <SectionRowContent {...contentProps} />
      </button>
    );
  };

  return (
    <Card
      className={cn('eb-w-full eb-overflow-hidden eb-@container', className)}
    >
      {/* ═══════════════════════════════════════════════════════════════
          HEADER - Business Identity (static, not clickable)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="eb-p-4 eb-pb-3">
        <div className="eb-flex eb-items-start eb-gap-2 @sm:eb-gap-3">
          {/* Business Icon - responsive to container */}
          <div className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg eb-bg-primary/10 @sm:eb-h-14 @sm:eb-w-14 @sm:eb-rounded-xl">
            <Building2
              className="eb-h-5 eb-w-5 eb-text-primary @sm:eb-h-7 @sm:eb-w-7"
              aria-hidden="true"
            />
          </div>

          {/* Business Info */}
          <div className="eb-min-w-0 eb-flex-1">
            <h2 className="eb-text-lg eb-font-semibold eb-leading-tight eb-text-foreground">
              {org.name}
            </h2>
            {org.dbaName && (
              <p className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                doing business as{' '}
                <span className="eb-font-medium eb-text-foreground">
                  &ldquo;{org.dbaName}&rdquo;
                </span>
              </p>
            )}

            {/* Status - only show if not approved */}
            {!isApproved && (
              <div className="eb-mt-2 eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                <span
                  className={cn(
                    'eb-h-2 eb-w-2 eb-rounded-full',
                    statusType === 'success' && 'eb-bg-green-500',
                    statusType === 'warning' && 'eb-bg-amber-500',
                    statusType === 'error' && 'eb-bg-red-500',
                    statusType === 'pending' && 'eb-bg-blue-500'
                  )}
                />
                <span>{translatedStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTIONS - Clickable rows for drill-down navigation
          ═══════════════════════════════════════════════════════════════ */}
      <div className="eb-divide-y eb-divide-border eb-border-t eb-border-border">
        {/* Business Details Section */}
        {sections.includes('identity') && (
          <SectionRow
            section="identity"
            icon={FileText}
            iconClassName="eb-text-blue-600 dark:eb-text-blue-400"
            iconBgClassName="eb-bg-blue-100 dark:eb-bg-blue-900/30"
            title="Business Details"
            subtitle={
              <div className="eb-space-y-0.5">
                {translatedOrgType && (
                  <div className="eb-flex eb-items-center eb-gap-1">
                    <Building2 className="eb-h-3 eb-w-3" aria-hidden="true" />
                    <span>{translatedOrgType}</span>
                  </div>
                )}
                {org.fullAddress && (
                  <div className="eb-flex eb-min-w-0 eb-items-center eb-gap-1">
                    <MapPin
                      className="eb-h-3 eb-w-3 eb-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="eb-truncate">{org.fullAddress}</span>
                  </div>
                )}
                {!translatedOrgType && !org.fullAddress && (
                  <span>Address, contact info, and more</span>
                )}
              </div>
            }
          />
        )}

        {/* People Section */}
        {sections.includes('ownership') && (
          <SectionRow
            section="ownership"
            icon={people.length > 1 ? Users : User}
            iconClassName="eb-text-purple-600 dark:eb-text-purple-400"
            iconBgClassName="eb-bg-purple-100 dark:eb-bg-purple-900/30"
            title="People"
            badge={
              people.length > 0 ? (
                <span className="eb-rounded eb-bg-purple-100 eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-purple-700 dark:eb-bg-purple-900/30 dark:eb-text-purple-300">
                  {people.length}
                </span>
              ) : null
            }
            subtitle={
              people.length > 0 ? (
                <div className="eb-mt-1 eb-space-y-0.5">
                  {people.map((person) => (
                    <div
                      key={person.id}
                      className="eb-flex eb-items-center eb-gap-1.5"
                    >
                      {person.isController ? (
                        <UserCog className="eb-h-3 eb-w-3" aria-hidden="true" />
                      ) : (
                        <User className="eb-h-3 eb-w-3" aria-hidden="true" />
                      )}
                      <span>{person.name}</span>
                      <span className="eb-text-muted-foreground/60">
                        {person.isController &&
                        person.roles.includes('Beneficial Owner')
                          ? '(Controller & Owner)'
                          : person.isController
                            ? '(Controller)'
                            : '(Owner)'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="eb-italic">No ownership info on file</span>
              )
            }
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER - Custom actions if provided
          ═══════════════════════════════════════════════════════════════ */}
      {actions && (
        <div className="eb-border-t eb-border-border eb-bg-muted/20 eb-px-4 eb-py-3">
          <div className="eb-flex eb-gap-2">{actions}</div>
        </div>
      )}
    </Card>
  );
}
