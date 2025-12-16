import React, { useState } from 'react';
import {
  BuildingIcon,
  CalendarIcon,
  ChevronDownIcon,
  CreditCardIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  HashIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getMaskedAccountNumber,
  getSupportedPaymentMethods,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { StatusBadge } from '@/core/LinkedAccountWidget/components/StatusBadge/StatusBadge';

export interface RecipientDetailsDialogProps {
  /** The recipient/account data to display */
  recipient: Recipient;
  /** The trigger element to open the dialog */
  children: React.ReactNode;
}

/**
 * RecipientDetailsDialog - Displays detailed information about a recipient/linked account
 * Account number is obfuscated for security, with option to reveal
 */
export const RecipientDetailsDialog: React.FC<RecipientDetailsDialogProps> = ({
  recipient,
  children,
}) => {
  const { t } = useTranslation('linked-accounts');
  const [showFullAccount, setShowFullAccount] = useState(false);

  const maskedAccount = getMaskedAccountNumber(recipient);
  const paymentMethods = getSupportedPaymentMethods(recipient);
  const fullAccountNumber = recipient.account?.number || maskedAccount;
  const isIndividual = recipient.partyDetails?.type === 'INDIVIDUAL';

  // Get the actual account holder name (not the transformed display name)
  const accountHolderName = isIndividual
    ? [recipient.partyDetails?.firstName, recipient.partyDetails?.lastName]
        .filter(Boolean)
        .join(' ')
    : recipient.partyDetails?.businessName || '';

  // Helper to get routing number for a payment method
  const getRoutingForMethod = (method: string) => {
    const routingInfo = recipient.account?.routingInformation?.find(
      (info) => info.transactionType === method
    );
    return routingInfo?.routingNumber || null;
  };

  // Format address for display
  const formatAddress = () => {
    const address = recipient.partyDetails?.address;
    if (!address) return null;

    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.addressLine3,
      [address.city, address.state, address.postalCode]
        .filter(Boolean)
        .join(', '),
      address.countryCode,
    ].filter(Boolean);

    return parts;
  };

  // Get contacts by type
  const getContactsByType = (type: 'EMAIL' | 'PHONE' | 'WEBSITE') => {
    return (
      recipient.partyDetails?.contacts?.filter((c) => c.contactType === type) ||
      []
    );
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const address = formatAddress();
  const emails = getContactsByType('EMAIL');
  const phones = getContactsByType('PHONE');
  const websites = getContactsByType('WEBSITE');

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-full eb-max-w-lg eb-overflow-hidden eb-p-0 sm:eb-max-h-[90vh]">
        <DialogHeader className="eb-shrink-0 eb-border-b eb-p-6 eb-pb-4">
          <div className="eb-flex eb-items-start eb-gap-3">
            <div
              className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10"
              role="img"
              aria-label={
                isIndividual
                  ? t('accountDetails.individual', {
                      defaultValue: 'Individual',
                    })
                  : t('accountDetails.business', {
                      defaultValue: 'Business',
                    })
              }
            >
              {isIndividual ? (
                <UserIcon className="eb-h-5 eb-w-5 eb-text-primary" aria-hidden="true" />
              ) : (
                <BuildingIcon className="eb-h-5 eb-w-5 eb-text-primary" aria-hidden="true" />
              )}
            </div>
            <div className="eb-min-w-0 eb-flex-1 eb-text-left">
              <DialogTitle className="eb-break-words eb-text-left eb-font-header eb-text-xl eb-leading-tight">
                {accountHolderName}
              </DialogTitle>
              <div className="eb-mt-2 eb-flex eb-flex-wrap eb-items-center eb-gap-2">
                {recipient.status && <StatusBadge status={recipient.status} />}
                {recipient.type && (
                  <span className="eb-rounded-md eb-bg-muted eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-muted-foreground">
                    {recipient.type === 'LINKED_ACCOUNT'
                      ? t('accountDetails.linkedAccount', {
                          defaultValue: 'Linked Account',
                        })
                      : t('accountDetails.recipient', {
                          defaultValue: 'Recipient',
                        })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="eb-flex-1 eb-overflow-y-auto eb-p-6 eb-pt-5">
          <div className="eb-space-y-5">
          {/* Account Information Section */}
          <Section
            title={t('accountDetails.accountInfo', {
              defaultValue: 'Account Information',
            })}
            icon={<HashIcon className="eb-h-4 eb-w-4" />}
          >
            <div className="eb-space-y-3">
              {/* Account Number */}
              <div className="eb-flex eb-items-center eb-justify-between">
                <span className="eb-text-sm eb-text-muted-foreground">
                  {t('accountDetails.accountNumber')}
                </span>
                <div className="eb-flex eb-items-center eb-gap-2">
                  <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide">
                    {showFullAccount ? fullAccountNumber : maskedAccount}
                  </span>
                  {fullAccountNumber !== maskedAccount && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="eb-h-6 eb-w-6"
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      aria-label={
                        showFullAccount
                          ? t('accountDetails.hideAccountNumber')
                          : t('accountDetails.showAccountNumber')
                      }
                    >
                      {showFullAccount ? (
                        <EyeOffIcon className="eb-h-3.5 eb-w-3.5" />
                      ) : (
                        <EyeIcon className="eb-h-3.5 eb-w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Account Type */}
              {recipient.account?.type && (
                <DetailRow
                  label={t('accountDetails.accountType')}
                  value={recipient.account.type}
                />
              )}

              {/* Account Country */}
              {recipient.account?.countryCode && (
                <DetailRow
                  label={t('accountDetails.accountCountry', {
                    defaultValue: 'Account Country',
                  })}
                  value={recipient.account.countryCode}
                />
              )}
            </div>
          </Section>

          {/* Payment Methods Section */}
          {paymentMethods.length > 0 && (
            <>
              <Separator />
              <Section
                title={t('accountDetails.paymentMethods')}
                icon={<CreditCardIcon className="eb-h-4 eb-w-4" />}
              >
                <div className="eb-rounded-lg eb-border eb-bg-muted/30">
                  {paymentMethods.map((method, index) => {
                    const routing = getRoutingForMethod(method);
                    const isLast = index === paymentMethods.length - 1;
                    return (
                      <div
                        key={method}
                        className={cn(
                          'eb-flex eb-items-center eb-justify-between eb-px-4 eb-py-2',
                          { 'eb-border-b': !isLast }
                        )}
                      >
                        <span className="eb-text-sm eb-font-medium eb-text-foreground">
                          {t(
                            `bank-account-form:paymentMethods.${method}.label` as any
                          )}
                        </span>
                        {routing ? (
                          <div className="eb-text-right">
                            <span className="eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                              {t('recipients:columns.routingNumber' as any)}
                            </span>
                            <p className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide">
                              {routing}
                            </p>
                          </div>
                        ) : (
                          <span className="eb-text-xs eb-italic eb-text-muted-foreground">
                            {t('accountDetails.noRoutingNumber' as any)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
          )}

          {/* Contact Information Section */}
          {(emails.length > 0 ||
            phones.length > 0 ||
            websites.length > 0 ||
            address) && (
            <>
              <Separator />
              <Section
                title={t('accountDetails.contactInfo', {
                  defaultValue: 'Contact Information',
                })}
              >
                <div className="eb-space-y-3">
                  {/* Email */}
                  {emails.map((email, idx) => (
                    <div
                      key={`email-${idx}`}
                      className="eb-flex eb-items-center eb-gap-2"
                    >
                      <MailIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                      <a
                        href={`mailto:${email.value}`}
                        className="eb-text-sm eb-text-primary hover:eb-underline"
                      >
                        {email.value}
                      </a>
                    </div>
                  ))}

                  {/* Phone */}
                  {phones.map((phone, idx) => (
                    <div
                      key={`phone-${idx}`}
                      className="eb-flex eb-items-center eb-gap-2"
                    >
                      <PhoneIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                      <span className="eb-text-sm">
                        {phone.countryCode} {phone.value}
                      </span>
                    </div>
                  ))}

                  {/* Website */}
                  {websites.map((website, idx) => (
                    <div
                      key={`website-${idx}`}
                      className="eb-flex eb-items-center eb-gap-2"
                    >
                      <GlobeIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                      <a
                        href={website.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="eb-text-sm eb-text-primary hover:eb-underline"
                      >
                        {website.value}
                      </a>
                    </div>
                  ))}

                  {/* Address */}
                  {address && (
                    <div className="eb-flex eb-gap-2">
                      <MapPinIcon className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-muted-foreground" />
                      <div className="eb-text-sm">
                        {address.map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* IDs & Metadata Section - Collapsible */}
          <Separator />
          <CollapsibleSection
            title={t('accountDetails.technicalDetails', {
              defaultValue: 'Technical Details',
            })}
            icon={<CalendarIcon className="eb-h-4 eb-w-4" />}
            defaultOpen={false}
          >
            <div className="eb-space-y-2 eb-text-xs">
              {/* Recipient ID */}
              <DetailRow
                label={t('accountDetails.recipientId', {
                  defaultValue: 'Recipient ID',
                })}
                value={
                  <span className="eb-font-mono eb-text-xs">
                    {recipient.id}
                  </span>
                }
                small
              />

              {/* Party ID */}
              {recipient.partyId && (
                <DetailRow
                  label={t('accountDetails.partyId', {
                    defaultValue: 'Party ID',
                  })}
                  value={
                    <span className="eb-font-mono eb-text-xs">
                      {recipient.partyId}
                    </span>
                  }
                  small
                />
              )}

              {/* Client ID */}
              {recipient.clientId && (
                <DetailRow
                  label={t('accountDetails.clientId', {
                    defaultValue: 'Client ID',
                  })}
                  value={
                    <span className="eb-font-mono eb-text-xs">
                      {recipient.clientId}
                    </span>
                  }
                  small
                />
              )}

              {/* Created At */}
              {recipient.createdAt && (
                <DetailRow
                  label={t('accountDetails.createdAt', {
                    defaultValue: 'Created',
                  })}
                  value={formatDate(recipient.createdAt)}
                  small
                />
              )}

              {/* Updated At */}
              {recipient.updatedAt && (
                <DetailRow
                  label={t('accountDetails.updatedAt', {
                    defaultValue: 'Last Updated',
                  })}
                  value={formatDate(recipient.updatedAt)}
                  small
                />
              )}
            </div>
          </CollapsibleSection>

          {/* Account Validation Response (if present) */}
          {recipient.accountValidationResponse &&
            recipient.accountValidationResponse.length > 0 && (
              <>
                <Separator />
                <Section
                  title={t('accountDetails.validationResults', {
                    defaultValue: 'Validation Results',
                  })}
                >
                  <div className="eb-space-y-2">
                    {recipient.accountValidationResponse.map(
                      (validation, idx) => (
                        <div
                          key={idx}
                          className="eb-rounded-md eb-border eb-bg-muted/30 eb-p-3 eb-text-xs"
                        >
                          {validation.profileName && (
                            <div className="eb-mb-2 eb-font-medium">
                              {validation.profileName}
                            </div>
                          )}
                          {validation.responses?.map((response, rIdx) => (
                            <div key={rIdx} className="eb-space-y-1">
                              {response.provider && (
                                <div className="eb-text-muted-foreground">
                                  Provider: {response.provider}
                                </div>
                              )}
                              {response.codes?.verification && (
                                <div className="eb-flex eb-justify-between">
                                  <span className="eb-text-muted-foreground">
                                    Verification
                                  </span>
                                  <span className="eb-font-medium">
                                    {response.codes.verification.message ||
                                      response.codes.verification.code}
                                  </span>
                                </div>
                              )}
                              {response.codes?.authentication && (
                                <div className="eb-flex eb-justify-between">
                                  <span className="eb-text-muted-foreground">
                                    Authentication
                                  </span>
                                  <span className="eb-font-medium">
                                    {response.codes.authentication.message ||
                                      response.codes.authentication.code}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </Section>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper Components
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

const DetailRow: React.FC<DetailRowProps> = ({ label, value, small }) => (
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
      className={cn('eb-font-medium', {
        'eb-text-xs': small,
        'eb-text-sm': !small,
      })}
    >
      {value}
    </span>
  </div>
);
