/**
 * BusinessDetailsContent - Displays business details following RecipientDetailsDialog pattern
 * Uses Section/DetailRow pattern with Separator dividers
 */

import { useState } from 'react';
import {
  Building2Icon,
  CalendarIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

import { formatDateTime, formatEIN } from '../../utils/formatClientFacing';
import { getOrganizationParty } from '../../utils/partyGrouping';
import { QuestionResponsesSection } from '../ClientDetailsContent/QuestionResponsesSection';

interface BusinessDetailsContentProps {
  client: ClientResponse;
}

// Helper Components (matching RecipientDetailsDialog pattern)
interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="eb-space-y-3">
    <h3 className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-semibold eb-text-foreground">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="eb-flex eb-w-full eb-items-center eb-justify-between eb-text-left"
        >
          <h3 className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-semibold eb-text-foreground">
            {icon}
            {title}
          </h3>
          <ChevronDownIcon
            className={cn(
              'eb-h-4 eb-w-4 eb-text-muted-foreground eb-transition-transform eb-duration-200',
              { 'eb-rotate-180': isOpen }
            )}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="eb-mt-3 eb-animate-fade-in">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, small }) => {
  if (!value) return null;
  return (
    <div className="eb-flex eb-items-center eb-justify-between">
      <span
        className={cn('eb-text-muted-foreground', {
          'eb-text-xs': small,
          'eb-text-sm': !small,
        })}
      >
        {label}
      </span>
      <span
        className={cn('eb-text-right eb-font-medium', {
          'eb-text-xs': small,
          'eb-text-sm': !small,
        })}
      >
        {value}
      </span>
    </div>
  );
};

interface MaskedValueProps {
  value: string;
  maskedValue: string;
  showLabel: string;
  hideLabel: string;
}

const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  maskedValue,
  showLabel,
  hideLabel,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="eb-inline-flex eb-items-center eb-gap-1">
      <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide">
        {isVisible ? value : maskedValue}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="eb-h-6 eb-w-6"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={isVisible ? hideLabel : showLabel}
      >
        {isVisible ? (
          <EyeOffIcon className="eb-h-3.5 eb-w-3.5" />
        ) : (
          <EyeIcon className="eb-h-3.5 eb-w-3.5" />
        )}
      </Button>
    </span>
  );
};

export function BusinessDetailsContent({
  client,
}: BusinessDetailsContentProps) {
  const { t, i18n } = useTranslation(['client-details', 'onboarding-overview']);
  const locale =
    i18n.resolvedLanguage
      ?.replace('_', '-')
      .replace('US', '-US')
      .replace('CA', '-CA') || 'en-US';
  const org = getOrganizationParty(client);
  const orgDetails = org?.organizationDetails;
  const address = orgDetails?.addresses?.[0];
  const phone = orgDetails?.phone;
  const { results } = client;

  // Translate business type using i18n tokens
  const translatedOrgType = orgDetails?.organizationType
    ? t(
        `onboarding-overview:organizationTypes.${orgDetails.organizationType}`,
        {
          defaultValue: orgDetails.organizationType.replace(/_/g, ' '),
        }
      )
    : null;

  // Format industry description and code
  const industryDescription = [
    orgDetails?.industryCategory,
    orgDetails?.industryType,
  ]
    .filter(Boolean)
    .join(' — ');

  // Get industry code from the industry object
  const industryCode = orgDetails?.industry?.code;

  // Format address lines
  const addressLines = address
    ? [
        address.addressLines?.join(' '),
        [address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(', '),
        address.country,
      ].filter(Boolean)
    : null;

  // Get EIN if available
  const ein = orgDetails?.organizationIds?.find((id) => id.idType === 'EIN');

  // Check if there are question responses
  const hasQuestionResponses =
    client.questionResponses && client.questionResponses.length > 0;

  return (
    <div className="eb-space-y-6">
      {/* Business Identity */}
      <div className="eb-space-y-4">
        <div className="eb-flex eb-items-center eb-gap-3">
          <div className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-lg eb-bg-slate-100 dark:eb-bg-slate-800">
            <Building2Icon className="eb-h-5 eb-w-5 eb-text-slate-600 dark:eb-text-slate-400" />
          </div>
          <div className="eb-min-w-0">
            <h3 className="eb-text-base eb-font-semibold eb-text-foreground">
              {orgDetails?.organizationName || t('client-details:emptyValue')}
            </h3>
            {orgDetails?.dbaName && (
              <p className="eb-text-sm eb-text-muted-foreground">
                {t('client-details:labels.doingBusinessAs')} &ldquo;
                {orgDetails.dbaName}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Business Details Grid */}
        <div className="eb-grid eb-gap-x-8 eb-gap-y-3 @sm:eb-grid-cols-2">
          {translatedOrgType && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.businessType')}
              </dt>
              <dd className="eb-mt-0.5 eb-text-sm eb-text-foreground">
                {translatedOrgType}
              </dd>
            </div>
          )}
          {industryDescription && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.industry')}
              </dt>
              <dd className="eb-mt-0.5 eb-text-sm eb-capitalize eb-text-foreground">
                {industryDescription.toLowerCase().replace(/_/g, ' ')}
              </dd>
            </div>
          )}
          {industryCode && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.industryCode')}
              </dt>
              <dd className="eb-font-mono eb-mt-0.5 eb-text-sm eb-text-foreground">
                {industryCode}
              </dd>
            </div>
          )}
          {ein?.value && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.ein')}
              </dt>
              <dd className="eb-mt-0.5">
                <MaskedValue
                  value={formatEIN(ein.value) || ein.value}
                  maskedValue={`**-***${ein.value.slice(-4)}`}
                  showLabel={t('client-details:maskedValue.showValue')}
                  hideLabel={t('client-details:maskedValue.hideValue')}
                />
              </dd>
            </div>
          )}
          {orgDetails?.yearOfFormation && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.yearOfFormation')}
              </dt>
              <dd className="eb-mt-0.5 eb-text-sm eb-text-foreground">
                {orgDetails.yearOfFormation}
              </dd>
            </div>
          )}
          {orgDetails?.countryOfFormation && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.countryOfFormation')}
              </dt>
              <dd className="eb-mt-0.5 eb-text-sm eb-text-foreground">
                {orgDetails.countryOfFormation}
              </dd>
            </div>
          )}
          {orgDetails?.jurisdiction && (
            <div>
              <dt className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                {t('client-details:labels.jurisdiction')}
              </dt>
              <dd className="eb-mt-0.5 eb-text-sm eb-text-foreground">
                {orgDetails.jurisdiction}
              </dd>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      {(org?.email ||
        phone?.phoneNumber ||
        orgDetails?.website ||
        addressLines) && (
        <>
          <Separator />
          <Section title={t('client-details:sections.contactInformation')}>
            <div className="eb-grid eb-gap-x-8 eb-gap-y-3 @sm:eb-grid-cols-2">
              {org?.email && (
                <div className="eb-flex eb-items-center eb-gap-2">
                  <MailIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <div>
                    <dt className="eb-sr-only">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${org.email}`}
                        className="eb-text-sm eb-text-primary hover:eb-underline"
                      >
                        {org.email}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
              {phone?.phoneNumber && (
                <div className="eb-flex eb-items-center eb-gap-2">
                  <PhoneIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <div>
                    <dt className="eb-sr-only">Phone</dt>
                    <dd className="eb-text-sm">
                      {phone.countryCode} {phone.phoneNumber}
                    </dd>
                  </div>
                </div>
              )}
              {orgDetails?.website && (
                <div className="eb-flex eb-items-center eb-gap-2">
                  <GlobeIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <div>
                    <dt className="eb-sr-only">Website</dt>
                    <dd>
                      <a
                        href={orgDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="eb-text-sm eb-text-primary hover:eb-underline"
                      >
                        {orgDetails.website.replace(/^https?:\/\//, '')}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
              {addressLines && (
                <div className="eb-flex eb-gap-2 @sm:eb-col-span-2">
                  <MapPinIcon className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground" />
                  <div>
                    <dt className="eb-sr-only">Address</dt>
                    <dd className="eb-text-sm">
                      {addressLines.map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </dd>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      {/* Question Responses - using the existing component that fetches question text */}
      {hasQuestionResponses && (
        <>
          <Separator />
          <QuestionResponsesSection
            client={client}
            title={t('client-details:sections.questionResponses')}
          />
        </>
      )}

      {/* Account & Application Status */}
      <Separator />
      <Section
        title={t('client-details:sections.accountStatus')}
        icon={<ClipboardCheckIcon className="eb-h-4 eb-w-4" />}
      >
        <div className="eb-space-y-3">
          <DetailRow
            label={t('client-details:labels.products')}
            value={
              client.products?.length
                ? client.products
                    .map((p) =>
                      t(`client-details:products.${p}`, { defaultValue: p })
                    )
                    .join(', ')
                : t('client-details:emptyValue')
            }
          />
          <DetailRow
            label={t('client-details:labels.applicationStatus')}
            value={
              client.status
                ? t(`client-details:applicationStatuses.${client.status}`, {
                    defaultValue: client.status,
                  })
                : t('client-details:emptyValue')
            }
          />
          {results && (
            <DetailRow
              label={t('client-details:labels.identityVerification')}
              value={
                results.customerIdentityStatus
                  ? t(
                      `client-details:identityStatuses.${results.customerIdentityStatus}`,
                      { defaultValue: results.customerIdentityStatus }
                    )
                  : t('client-details:emptyValue')
              }
            />
          )}
        </div>
      </Section>

      {/* Technical Details - Collapsible */}
      <Separator />
      <CollapsibleSection
        title={t('client-details:sections.technicalDetails')}
        icon={<CalendarIcon className="eb-h-4 eb-w-4" />}
        defaultOpen={false}
      >
        <div className="eb-space-y-2">
          <DetailRow
            label={t('client-details:labels.clientId')}
            value={<span className="eb-font-mono eb-text-xs">{client.id}</span>}
            small
          />
          <DetailRow
            label={t('client-details:labels.created')}
            value={formatDateTime(client.createdAt, locale)}
            small
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
