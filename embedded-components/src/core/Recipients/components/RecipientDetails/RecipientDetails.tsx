import React from 'react';
// Icons
import { Globe, Info, Mail, Phone } from 'lucide-react';

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
  const { icon: StatusIcon } = getStatusColor(recipient.status!);
  const statusDescription = getStatusDescription(recipient.status!);
  const validation = validateRecipientForPayments(recipient);
  const originalContacts = recipient.partyDetails.contacts || [];

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
          {formatStatusText(recipient.status)}
        </Badge>
        <Badge variant="outline" className="eb-text-sm">
          {recipient.partyDetails?.type === 'INDIVIDUAL'
            ? 'Individual'
            : 'Business'}
        </Badge>
      </div>

      {/* Critical Alerts: Validation Errors (shown first - blocking issues) */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="eb-space-y-1">
              <p className="eb-font-medium">
                This recipient has validation issues:
              </p>
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
              Edit Recipient
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
              {isDeactivating ? 'Deactivating...' : 'Deactivate Recipient'}
            </Button>
          )}
        </div>
      )}

      {/* Party Details */}
      <div className="eb-space-y-1.5">
        <h3 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
          Party Information
        </h3>
        <div className="eb-space-y-1">
          {renderField(
            'Type',
            recipient.partyDetails.type === 'INDIVIDUAL'
              ? 'Individual'
              : 'Business'
          )}
          {recipient.partyDetails.type === 'INDIVIDUAL' && (
            <>
              {renderField('First Name', recipient.partyDetails.firstName)}
              {renderField('Last Name', recipient.partyDetails.lastName)}
            </>
          )}
          {recipient.partyDetails.type === 'ORGANIZATION' &&
            renderField('Business Name', recipient.partyDetails.businessName)}
        </div>
      </div>

      {/* Address */}
      {recipient.partyDetails.address && (
        <>
          <div className="eb-border-t eb-border-border/40" />
          <div className="eb-space-y-1.5">
            <h3 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
              Address
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
              Contact Information
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
              Account Information
            </h3>
            <div className="eb-space-y-1">
              {renderField(
                'Account Number',
                recipient.account.number
                  ? `****${recipient.account.number.slice(-4)}`
                  : 'N/A'
              )}
              {renderField('Account Type', recipient.account.type)}
              {renderField('Country', recipient.account.countryCode)}
            </div>

            {/* Routing Information */}
            {recipient.account.routingInformation &&
              recipient.account.routingInformation.length > 0 && (
                <div className="eb-mt-2 eb-space-y-1.5">
                  <h4 className="eb-text-sm eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                    Routing Information
                  </h4>
                  <div className="eb-space-y-1">
                    {recipient.account.routingInformation.map(
                      (routing, index) => (
                        <div
                          key={index}
                          className="eb-space-y-1 eb-rounded-md eb-bg-muted/30 eb-p-2"
                        >
                          {renderField('Routing Number', routing.routingNumber)}
                          {renderField('Code Type', routing.routingCodeType)}
                          {renderField(
                            'Transaction Type',
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
                  Account Summary
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
