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
  AlertCircle,
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock,
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
import type { ClientSection } from './SectionList';

interface ClientSummaryCardProps {
  client: ClientResponse;
  onSectionClick?: (section: ClientSection) => void;
  sections?: ClientSection[];
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

/**
 * Extract verification summary
 */
function getVerificationDetails(client: ClientResponse) {
  const kycStatus = client.results?.customerIdentityStatus;
  return {
    kycStatus,
    isVerified: kycStatus === 'APPROVED',
    needsInfo: kycStatus === 'INFORMATION_REQUESTED',
    isPending:
      !kycStatus ||
      (kycStatus !== 'APPROVED' && kycStatus !== 'INFORMATION_REQUESTED'),
  };
}

/**
 * Extract compliance/document summary
 */
function getComplianceDetails(client: ClientResponse) {
  const pendingDocs = client.outstanding?.documentRequestIds?.length ?? 0;
  const pendingQuestions = client.outstanding?.questionIds?.length ?? 0;
  const answeredQuestions = client.questionResponses?.length ?? 0;

  return {
    pendingDocs,
    pendingQuestions,
    answeredQuestions,
    totalPending: pendingDocs + pendingQuestions,
    isComplete: pendingDocs === 0 && pendingQuestions === 0,
  };
}

const DEFAULT_SECTIONS: ClientSection[] = [
  'identity',
  'verification',
  'ownership',
  'compliance',
];

export function ClientSummaryCard({
  client,
  onSectionClick,
  sections = DEFAULT_SECTIONS,
  actions,
  className,
}: ClientSummaryCardProps) {
  const { t } = useTranslation(['onboarding-old', 'onboarding-overview']);

  const org = useMemo(() => getOrganizationDetails(client), [client]);
  const people = useMemo(() => getIndividualParties(client), [client]);
  const verification = useMemo(() => getVerificationDetails(client), [client]);
  const compliance = useMemo(() => getComplianceDetails(client), [client]);

  const statusType = getStatusType(client.status);
  const isApproved = client.status === 'APPROVED';
  const isClickable = !!onSectionClick;

  const translatedOrgType = org.organizationType
    ? t(`onboarding-overview:organizationTypes.${org.organizationType}`, {
        defaultValue: org.organizationType.replace(/_/g, ' '),
      })
    : null;

  const translatedStatus = t(
    `onboarding-old:clientOnboardingStatus.statusLabels.${client.status}`,
    { defaultValue: client.status.replace(/_/g, ' ') }
  );

  const handleSectionClick = (section: ClientSection) => {
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  // Reusable section row component for consistent styling
  const SectionRow = ({
    section,
    icon: Icon,
    iconClassName,
    iconBgClassName,
    title,
    subtitle,
    badge,
    children,
  }: {
    section: ClientSection;
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    iconBgClassName: string;
    title: string;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => handleSectionClick(section)}
      disabled={!isClickable}
      className={cn(
        'eb-group eb-flex eb-w-full eb-items-start eb-gap-2 eb-p-3 eb-text-left eb-transition-colors @sm:eb-gap-3',
        isClickable
          ? 'hover:eb-bg-muted/50 active:eb-bg-muted/70'
          : 'eb-cursor-default'
      )}
    >
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
    </button>
  );

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

        {/* Onboarding sections - only when not approved */}
        {!isApproved && (
          <>
            {/* Verification Section */}
            {sections.includes('verification') && (
              <SectionRow
                section="verification"
                icon={
                  verification.isVerified
                    ? BadgeCheck
                    : verification.needsInfo
                      ? AlertCircle
                      : Clock
                }
                iconClassName={cn(
                  verification.isVerified
                    ? 'eb-text-green-600 dark:eb-text-green-400'
                    : verification.needsInfo
                      ? 'eb-text-amber-600 dark:eb-text-amber-400'
                      : 'eb-text-gray-500'
                )}
                iconBgClassName={cn(
                  verification.isVerified
                    ? 'eb-bg-green-100 dark:eb-bg-green-900/30'
                    : verification.needsInfo
                      ? 'eb-bg-amber-100 dark:eb-bg-amber-900/30'
                      : 'eb-bg-gray-100 dark:eb-bg-gray-900/30'
                )}
                title="Verification"
                subtitle={
                  verification.isVerified
                    ? 'Identity verified'
                    : verification.needsInfo
                      ? 'Additional information requested'
                      : 'Verification in progress'
                }
              />
            )}

            {/* Compliance Section */}
            {sections.includes('compliance') && (
              <SectionRow
                section="compliance"
                icon={FileText}
                iconClassName={cn(
                  compliance.isComplete
                    ? 'eb-text-green-600 dark:eb-text-green-400'
                    : 'eb-text-amber-600 dark:eb-text-amber-400'
                )}
                iconBgClassName={cn(
                  compliance.isComplete
                    ? 'eb-bg-green-100 dark:eb-bg-green-900/30'
                    : 'eb-bg-amber-100 dark:eb-bg-amber-900/30'
                )}
                title="Documents & Questions"
                badge={
                  compliance.totalPending > 0 ? (
                    <span className="eb-rounded eb-bg-amber-200 eb-px-1.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-amber-800 dark:eb-bg-amber-800/50 dark:eb-text-amber-200">
                      {compliance.totalPending} pending
                    </span>
                  ) : null
                }
                subtitle={
                  compliance.isComplete ? (
                    'All requirements complete'
                  ) : (
                    <span>
                      {compliance.pendingDocs > 0 &&
                        `${compliance.pendingDocs} document${compliance.pendingDocs > 1 ? 's' : ''} needed`}
                      {compliance.pendingDocs > 0 &&
                        compliance.pendingQuestions > 0 &&
                        ', '}
                      {compliance.pendingQuestions > 0 &&
                        `${compliance.pendingQuestions} question${compliance.pendingQuestions > 1 ? 's' : ''} to answer`}
                    </span>
                  )
                }
              />
            )}
          </>
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
