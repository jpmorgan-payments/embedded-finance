import React from 'react';
// Icons
import { Globe, Info, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { formatStatusText } from '../../utils/formatStatusText';
import { getStatusVariant } from '../../utils/getStatusVariant';
// Utils
import {
  formatAccountInfo,
  formatRecipientAddress,
  getStatusColor,
  getStatusDescription,
  validateRecipientForPayments,
} from '../../utils/recipientHelpers';

export interface RecipientDetailsProps {
  recipient: Recipient;
  onEdit?: (recipient: Recipient) => void;
  onDeactivate?: (recipient: Recipient) => void;
  showEditButton?: boolean;
  showDeactivateButton?: boolean;
  canDeactivate?: boolean;
  isDeactivating?: boolean;
}

export const RecipientDetails: React.FC<RecipientDetailsProps> = ({
  recipient,
  onEdit,
  onDeactivate,
  showEditButton = false,
  showDeactivateButton = false,
  canDeactivate = false,
  isDeactivating = false,
}) => {
  const { t: tRaw } = useTranslation(['recipients', 'common']);
  // Type assertion to avoid TypeScript overload issues
  const t = tRaw as (key: string, options?: any) => string;
  const { icon: StatusIcon } = getStatusColor(recipient.status!);
  const statusDescription = getStatusDescription(recipient.status!);
  const validation = validateRecipientForPayments(recipient);
  const originalContacts = recipient.partyDetails.contacts || [];
  const naText = t('common:na', { defaultValue: 'N/A' });

  // Extract translations to variables to avoid TypeScript overload issues
  const partyTypeIndividual = t('recipients:details.partyType.individual', {
    defaultValue: 'Individual',
  });
  const partyTypeBusiness = t('recipients:details.partyType.business', {
    defaultValue: 'Business',
  });
  const validationIssuesTitle = t('recipients:details.validationIssues.title', {
    defaultValue: 'This recipient has validation issues:',
  });
  const editRecipientText = t('recipients:actions.editRecipient', {
    defaultValue: 'Edit Recipient',
  });
  const deactivatingText = t('recipients:actions.deactivating', {
    defaultValue: 'Deactivating...',
  });
  const deactivateRecipientText = t('recipients:actions.deactivateRecipient', {
    defaultValue: 'Deactivate Recipient',
  });
  const partyInformationTitle = t(
    'recipients:details.sections.partyInformation',
    {
      defaultValue: 'Party Information',
    }
  );
  const typeLabel = t('recipients:details.fields.type', {
    defaultValue: 'Type',
  });
  const firstNameLabel = t('recipients:details.fields.firstName', {
    defaultValue: 'First Name',
  });
  const lastNameLabel = t('recipients:details.fields.lastName', {
    defaultValue: 'Last Name',
  });
  const businessNameLabel = t('recipients:details.fields.businessName', {
    defaultValue: 'Business Name',
  });
  const addressTitle = t('recipients:details.sections.address', {
    defaultValue: 'Address',
  });
  const contactInformationTitle = t(
    'recipients:details.sections.contactInformation',
    {
      defaultValue: 'Contact Information',
    }
  );
  const accountInformationTitle = t(
    'recipients:details.sections.accountInformation',
    {
      defaultValue: 'Account Information',
    }
  );
  const accountNumberLabel = t('recipients:details.fields.accountNumber', {
    defaultValue: 'Account Number',
  });
  const accountTypeLabel = t('recipients:details.fields.accountType', {
    defaultValue: 'Account Type',
  });
  const countryLabel = t('recipients:details.fields.country', {
    defaultValue: 'Country',
  });
  const routingInformationTitle = t(
    'recipients:details.sections.routingInformation',
    {
      defaultValue: 'Routing Information',
    }
  );
  const routingNumberLabel = t('recipients:details.fields.routingNumber', {
    defaultValue: 'Routing Number',
  });
  const codeTypeLabel = t('recipients:details.fields.codeType', {
    defaultValue: 'Code Type',
  });
  const transactionTypeLabel = t('recipients:details.fields.transactionType', {
    defaultValue: 'Transaction Type',
  });
  const accountSummaryLabel = t('recipients:details.sections.accountSummary', {
    defaultValue: 'Account Summary',
  });

  // Helper function to render a field conditionally
  const renderField = (label: string, value: string | undefined | null) => {
    if (!value) return null;
    return (
      <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
        <Label className="eb-shrink-0 eb-text-sm eb-font-normal eb-text-muted-foreground">
          {label}
        </Label>
        <div className="eb-min-w-0 eb-flex-1 eb-text-right eb-text-sm eb-font-normal">
          {value}
        </div>
      </div>
    );
  };

  return (
    <div className="eb-space-y-2">
      {/* Status Tags */}
      <div className="eb-mt-2 eb-flex eb-items-center eb-gap-2">
        <Badge
          variant={getStatusVariant(recipient.status)}
          className="eb-flex eb-items-center eb-gap-1 eb-text-sm"
        >
          <StatusIcon className="eb-h-3 eb-w-3" />
          {formatStatusText(recipient.status, t)}
        </Badge>
        <Badge variant="outline" className="eb-text-sm">
          {recipient.partyDetails?.type === 'INDIVIDUAL'
            ? partyTypeIndividual
            : partyTypeBusiness}
        </Badge>
      </div>

      {/* Critical Alerts: Validation Errors (shown first - blocking issues) */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="eb-space-y-1">
              <p className="eb-font-medium">{validationIssuesTitle}</p>
              <ul className="eb-list-inside eb-list-disc eb-space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="eb-text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Informational Alerts: Status Description (contextual info) */}
      <Alert>
        <Info className="eb-h-4 eb-w-4" />
        <AlertDescription>{statusDescription}</AlertDescription>
      </Alert>

      {/* Actions: Available after user understands the state */}
      {(showEditButton || showDeactivateButton) && (
        <div className="eb-flex eb-gap-2">
          {showEditButton && onEdit && (
            <Button
              onClick={() => onEdit(recipient)}
              variant="secondary"
              size="sm"
            >
              {editRecipientText}
            </Button>
          )}
          {showDeactivateButton && onDeactivate && canDeactivate && (
            <Button
              onClick={() => onDeactivate(recipient)}
              variant="secondary"
              size="sm"
              disabled={isDeactivating}
              className="eb-text-red-600 hover:eb-bg-red-50 hover:eb-text-red-700"
            >
              {isDeactivating ? deactivatingText : deactivateRecipientText}
            </Button>
          )}
        </div>
      )}

      {/* Party Details */}
      <div className="eb-space-y-1.5">
        <h3 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
          {partyInformationTitle}
        </h3>
        <div className="eb-space-y-1">
          {renderField(
            typeLabel,
            recipient.partyDetails.type === 'INDIVIDUAL'
              ? partyTypeIndividual
              : partyTypeBusiness
          )}
          {recipient.partyDetails.type === 'INDIVIDUAL' && (
            <>
              {renderField(firstNameLabel, recipient.partyDetails.firstName)}
              {renderField(lastNameLabel, recipient.partyDetails.lastName)}
            </>
          )}
          {recipient.partyDetails.type === 'ORGANIZATION' &&
            renderField(businessNameLabel, recipient.partyDetails.businessName)}
        </div>
      </div>

      {/* Address */}
      {recipient.partyDetails.address && (
        <>
          <div className="eb-border-t eb-border-border/40" />
          <div className="eb-space-y-1.5">
            <h3 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
              {addressTitle}
            </h3>
            <div className="eb-text-sm eb-leading-relaxed eb-text-muted-foreground">
              {formatRecipientAddress(recipient)}
            </div>
          </div>
        </>
      )}

      {/* Contacts */}
      {originalContacts.length > 0 && (
        <>
          <div className="eb-border-t eb-border-border/40" />
          <div className="eb-space-y-1.5">
            <h3 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
              {contactInformationTitle}
            </h3>
            <div className="eb-space-y-1">
              {originalContacts.map((contact, index) => (
                <div
                  key={index}
                  className="eb-flex eb-items-start eb-justify-between eb-gap-2"
                >
                  <Label className="eb-flex eb-shrink-0 eb-items-center eb-gap-1.5 eb-text-sm eb-font-normal eb-text-muted-foreground">
                    {contact.contactType === 'EMAIL' && (
                      <Mail className="eb-h-3.5 eb-w-3.5" />
                    )}
                    {contact.contactType === 'PHONE' && (
                      <Phone className="eb-h-3.5 eb-w-3.5" />
                    )}
                    {contact.contactType === 'WEBSITE' && (
                      <Globe className="eb-h-3.5 eb-w-3.5" />
                    )}
                    {contact.contactType}
                    {contact.countryCode && ` (${contact.countryCode})`}
                  </Label>
                  <div className="eb-min-w-0 eb-flex-1 eb-text-right eb-text-sm eb-font-normal">
                    {contact.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Account Information */}
      {recipient.account && (
        <>
          <div className="eb-border-t eb-border-border/40" />
          <div className="eb-space-y-1.5">
            <h3 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
              {accountInformationTitle}
            </h3>
            <div className="eb-space-y-1">
              {renderField(
                accountNumberLabel,
                recipient.account.number
                  ? `****${recipient.account.number.slice(-4)}`
                  : naText
              )}
              {renderField(accountTypeLabel, recipient.account.type)}
              {renderField(countryLabel, recipient.account.countryCode)}
            </div>

            {/* Routing Information */}
            {recipient.account.routingInformation &&
              recipient.account.routingInformation.length > 0 && (
                <div className="eb-mt-2 eb-space-y-1.5">
                  <h4 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                    {routingInformationTitle}
                  </h4>
                  <div className="eb-space-y-1">
                    {recipient.account.routingInformation.map(
                      (routing, index) => (
                        <div
                          key={index}
                          className="eb-space-y-1 eb-rounded-md eb-bg-muted/30 eb-p-2"
                        >
                          {renderField(
                            routingNumberLabel,
                            routing.routingNumber
                          )}
                          {renderField(codeTypeLabel, routing.routingCodeType)}
                          {renderField(
                            transactionTypeLabel,
                            routing.transactionType
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Formatted Account Info */}
            {formatAccountInfo(recipient) && (
              <div className="eb-mt-2 eb-space-y-1">
                <Label className="eb-text-sm eb-font-normal eb-text-muted-foreground">
                  {accountSummaryLabel}
                </Label>
                <div className="eb-rounded-md eb-bg-muted/30 eb-p-2">
                  <p className="eb-font-mono eb-text-sm">
                    {formatAccountInfo(recipient)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
