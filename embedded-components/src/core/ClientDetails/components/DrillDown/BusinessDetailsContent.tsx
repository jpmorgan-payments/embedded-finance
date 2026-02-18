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

import {
  formatApplicationStatus,
  formatCustomerIdentityStatus,
  formatDateTime,
  formatProducts,
} from '../../utils/formatClientFacing';
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
  const { t } = useTranslation(['client-details', 'onboarding-overview']);
  const org = getOrganizationParty(client);
  const orgDetails = org?.organizationDetails;
  const address = orgDetails?.addresses?.[0];
  const phone = orgDetails?.phone;
  const { results } = client;

  // Translate business type using i18n tokens
  const translatedOrgType = orgDetails?.organizationType
    ? t(`onboarding-overview:organizationTypes.${orgDetails.organizationType}`, {
        defaultValue: orgDetails.organizationType.replace(/_/g, ' '),
      })
    : null;

  // Format industry to show both category and type if available
  const industryDisplay = [
    orgDetails?.industryCategory,
    orgDetails?.industryType,
  ]
    .filter(Boolean)
    .join(' — ');

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
    <div className="eb-space-y-5">
      {/* Business Information Section (includes formation) */}
      <Section
        title={t('client-details:sections.businessInformation')}
        icon={<Building2Icon className="eb-h-4 eb-w-4" />}
      >
        <div className="eb-space-y-3">
          <DetailRow
            label={t('client-details:labels.businessName')}
            value={orgDetails?.organizationName}
          />
          {orgDetails?.dbaName && (
            <DetailRow
              label={t('client-details:labels.dbaName')}
              value={orgDetails.dbaName}
            />
          )}
          <DetailRow
            label={t('client-details:labels.businessType')}
            value={translatedOrgType}
          />
          <DetailRow
            label={t('client-details:labels.industry')}
            value={industryDisplay || null}
          />
          {ein?.value && (
            <DetailRow
              label={t('client-details:labels.ein')}
              value={
                <MaskedValue
                  value={ein.value}
                  maskedValue={`****${ein.value.slice(-4)}`}
                  showLabel={t('client-details:maskedValue.showValue')}
                  hideLabel={t('client-details:maskedValue.hideValue')}
                />
              }
            />
          )}
          <DetailRow
            label={t('client-details:labels.countryOfFormation')}
            value={orgDetails?.countryOfFormation}
          />
          <DetailRow
            label={t('client-details:labels.yearOfFormation')}
            value={orgDetails?.yearOfFormation}
          />
          {orgDetails?.jurisdiction && (
            <DetailRow
              label={t('client-details:labels.jurisdiction')}
              value={orgDetails.jurisdiction}
            />
          )}
        </div>
      </Section>

      {/* Contact Information */}
      {(org?.email ||
        phone?.phoneNumber ||
        orgDetails?.website ||
        addressLines) && (
        <>
          <Separator />
          <Section title={t('client-details:sections.contactInformation')}>
            <div className="eb-space-y-3">
              {org?.email && (
                <div className="eb-flex eb-items-center eb-gap-2">
                  <MailIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <a
                    href={`mailto:${org.email}`}
                    className="eb-text-sm eb-text-primary hover:eb-underline"
                  >
                    {org.email}
                  </a>
                </div>
              )}
              {phone?.phoneNumber && (
                <div className="eb-flex eb-items-center eb-gap-2">
                  <PhoneIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <span className="eb-text-sm">
                    {phone.countryCode} {phone.phoneNumber}
                  </span>
                </div>
              )}
              {orgDetails?.website && (
                <div className="eb-flex eb-items-center eb-gap-2">
                  <GlobeIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <a
                    href={orgDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eb-text-sm eb-text-primary hover:eb-underline"
                  >
                    {orgDetails.website}
                  </a>
                </div>
              )}
              {addressLines && (
                <div className="eb-flex eb-gap-2">
                  <MapPinIcon className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground" />
                  <div className="eb-text-sm">
                    {addressLines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
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
            title="Question Responses"
          />
        </>
      )}

      {/* Account & Application Status */}
      <Separator />
      <Section
        title="Account Status"
        icon={<ClipboardCheckIcon className="eb-h-4 eb-w-4" />}
      >
        <div className="eb-space-y-3">
          <DetailRow label="Products" value={formatProducts(client.products)} />
          <DetailRow
            label="Application Status"
            value={formatApplicationStatus(client.status)}
          />
          {results && (
            <DetailRow
              label="Identity Verification"
              value={formatCustomerIdentityStatus(
                results.customerIdentityStatus
              )}
            />
          )}
        </div>
      </Section>

      {/* Technical Details - Collapsible */}
      <Separator />
      <CollapsibleSection
        title="Technical Details"
        icon={<CalendarIcon className="eb-h-4 eb-w-4" />}
        defaultOpen={false}
      >
        <div className="eb-space-y-2">
          <DetailRow
            label="Client ID"
            value={<span className="eb-font-mono eb-text-xs">{client.id}</span>}
            small
          />
          <DetailRow
            label="Created"
            value={formatDateTime(client.createdAt)}
            small
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
