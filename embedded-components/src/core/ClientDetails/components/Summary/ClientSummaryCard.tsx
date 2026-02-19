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
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  Hash,
  MapPin,
  User,
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
    industry: orgDetails?.industryType,
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
  const { t } = useTranslation([
    'client-details',
    'onboarding-old',
    'onboarding-overview',
  ]);

  const org = useMemo(() => getOrganizationDetails(client), [client]);
  const people = useMemo(() => getIndividualParties(client), [client]);

  const statusType = getStatusType(client.status);

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
    <div className="eb-flex eb-w-full eb-items-start eb-gap-2 @sm:eb-gap-3">
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
          <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground eb-duration-300 eb-animate-in eb-fade-in">
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
    </div>
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
      'eb-group eb-w-full eb-p-3 eb-text-left eb-transition-colors @sm:eb-gap-3',
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
          HERO HEADER - Business identity with subtle background
          ═══════════════════════════════════════════════════════════════ */}
      <div className="eb-bg-primary/5 eb-p-4 eb-pb-5 @sm:eb-p-6">
        <div className="eb-flex eb-items-start eb-gap-3 @sm:eb-gap-4">
          {/* Business Icon */}
          <div className="eb-flex eb-h-12 eb-w-12 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-xl eb-bg-primary eb-ring-2 eb-ring-primary/20 eb-ring-offset-2 eb-ring-offset-background @sm:eb-h-16 @sm:eb-w-16 @sm:eb-rounded-2xl">
            <Building2
              className="eb-h-6 eb-w-6 eb-text-primary-foreground @sm:eb-h-8 @sm:eb-w-8"
              aria-hidden="true"
            />
          </div>

          {/* Business Identity */}
          <div className="eb-min-w-0 eb-flex-1 eb-duration-300 eb-animate-in eb-fade-in">
            <div className="eb-flex eb-flex-wrap eb-items-start eb-gap-2">
              <h2 className="eb-text-xl eb-font-bold eb-leading-tight eb-tracking-tight eb-text-foreground @sm:eb-text-2xl">
                {org.name}
              </h2>
              {/* Status Badge - Premium pill style */}
              <span
                className={cn(
                  'eb-inline-flex eb-items-center eb-gap-1.5 eb-rounded-full eb-px-2.5 eb-py-1 eb-text-xs eb-font-semibold eb-shadow-sm',
                  statusType === 'success' &&
                    'eb-bg-green-100 eb-text-green-700 dark:eb-bg-green-900/40 dark:eb-text-green-300',
                  statusType === 'warning' &&
                    'eb-bg-amber-100 eb-text-amber-700 dark:eb-bg-amber-900/40 dark:eb-text-amber-300',
                  statusType === 'error' &&
                    'eb-bg-red-100 eb-text-red-700 dark:eb-bg-red-900/40 dark:eb-text-red-300',
                  statusType === 'pending' &&
                    'eb-bg-blue-100 eb-text-blue-700 dark:eb-bg-blue-900/40 dark:eb-text-blue-300'
                )}
              >
                <span
                  className={cn(
                    'eb-h-1.5 eb-w-1.5 eb-rounded-full',
                    statusType === 'success' && 'eb-bg-green-500',
                    statusType === 'warning' && 'eb-bg-amber-500',
                    statusType === 'error' && 'eb-bg-red-500',
                    statusType === 'pending' && 'eb-bg-blue-500'
                  )}
                />
                {translatedStatus}
              </span>
            </div>

            {org.dbaName && (
              <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                {t('client-details:labels.doingBusinessAs')}{' '}
                <span className="eb-font-medium eb-text-foreground">
                  &ldquo;{org.dbaName}&rdquo;
                </span>
              </p>
            )}

            {/* Quick Info Pills */}
            <div className="eb-mt-3 eb-flex eb-flex-wrap eb-gap-2">
              {translatedOrgType && (
                <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded-md eb-bg-background/80 eb-px-2 eb-py-1 eb-text-xs eb-text-muted-foreground eb-shadow-sm eb-ring-1 eb-ring-border/50">
                  <Building2 className="eb-h-3 eb-w-3" aria-hidden="true" />
                  {translatedOrgType}
                </span>
              )}
              {org.location && (
                <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded-md eb-bg-background/80 eb-px-2 eb-py-1 eb-text-xs eb-text-muted-foreground eb-shadow-sm eb-ring-1 eb-ring-border/50">
                  <MapPin className="eb-h-3 eb-w-3" aria-hidden="true" />
                  {org.location}
                </span>
              )}
              {org.yearOfFormation && (
                <span className="eb-inline-flex eb-items-center eb-gap-1 eb-rounded-md eb-bg-background/80 eb-px-2 eb-py-1 eb-text-xs eb-text-muted-foreground eb-shadow-sm eb-ring-1 eb-ring-border/50">
                  <Calendar className="eb-h-3 eb-w-3" aria-hidden="true" />
                  Est. {org.yearOfFormation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTIONS - Modern card-style clickable sections
          ═══════════════════════════════════════════════════════════════ */}
      <div className="eb-divide-y eb-divide-border eb-border-t eb-border-border">
        {/* Business Details Section */}
        {sections.includes('identity') && (
          <SectionRow
            section="identity"
            icon={FileText}
            iconClassName="eb-text-slate-600 dark:eb-text-slate-400"
            iconBgClassName="eb-bg-slate-100 dark:eb-bg-slate-800"
            title={t('client-details:sections.businessDetails')}
            subtitle={
              <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-x-3 eb-gap-y-1">
                {org.industry && (
                  <span className="eb-inline-flex eb-items-center eb-gap-1">
                    <Briefcase
                      className="eb-h-3 eb-w-3 eb-text-muted-foreground/70"
                      aria-hidden="true"
                    />
                    <span className="eb-capitalize">
                      {org.industry.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </span>
                )}
                {org.ein && (
                  <span className="eb-inline-flex eb-items-center eb-gap-1">
                    <Hash
                      className="eb-h-3 eb-w-3 eb-text-muted-foreground/70"
                      aria-hidden="true"
                    />
                    <span>EIN **-***{org.ein.slice(-4)}</span>
                  </span>
                )}
                {!org.industry && !org.ein && (
                  <span>{t('client-details:labels.addressContactInfo')}</span>
                )}
              </div>
            }
          />
        )}

        {/* People Section - Enhanced with avatars */}
        {sections.includes('ownership') && (
          <SectionRow
            section="ownership"
            icon={people.length > 1 ? Users : User}
            iconClassName="eb-text-slate-600 dark:eb-text-slate-400"
            iconBgClassName="eb-bg-slate-100 dark:eb-bg-slate-800"
            title={t('client-details:sections.people')}
            badge={
              people.length > 0 ? (
                <span className="eb-rounded-full eb-bg-slate-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-semibold eb-text-slate-700 dark:eb-bg-slate-800 dark:eb-text-slate-300">
                  {people.length}
                </span>
              ) : null
            }
            subtitle={
              people.length > 0 ? (
                <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-2">
                  {people.map((person) => (
                    <div
                      key={person.id}
                      className="eb-flex eb-items-center eb-gap-2 eb-rounded-lg eb-bg-muted/50 eb-px-2.5 eb-py-1.5 eb-ring-1 eb-ring-border/30"
                    >
                      {/* Mini avatar */}
                      <div
                        className={cn(
                          'eb-flex eb-h-6 eb-w-6 eb-items-center eb-justify-center eb-rounded-full eb-text-xs eb-font-semibold',
                          person.isController
                            ? 'eb-bg-slate-200 eb-text-slate-700 dark:eb-bg-slate-700 dark:eb-text-slate-200'
                            : 'eb-bg-slate-100 eb-text-slate-600 dark:eb-bg-slate-800 dark:eb-text-slate-400'
                        )}
                      >
                        {person.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="eb-flex eb-flex-col eb-leading-none">
                        <span className="eb-text-xs eb-font-medium eb-text-foreground">
                          {person.name}
                        </span>
                        <span className="eb-text-[10px] eb-text-muted-foreground">
                          {person.isController &&
                          person.roles.includes('Beneficial Owner')
                            ? t('client-details:labels.controllerAndOwner')
                            : person.isController
                              ? t('client-details:labels.controller')
                              : t('client-details:labels.owner')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="eb-italic">
                  {t('client-details:labels.noOwnershipInfo')}
                </span>
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
