import React from 'react';
// Icons
import {
  Building,
  Calendar,
  CreditCard,
  Globe,
  Info,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Utils
import {
  formatAccountInfo,
  formatRecipientAddress,
  formatRecipientName,
  getStatusColor,
  getStatusDescription,
  validateRecipientForPayments,
} from '../../utils/recipientHelpers';

export interface RecipientDetailsProps {
  recipient: Recipient;
  onClose: () => void;
  onEdit?: (recipient: Recipient) => void;
  onDeactivate?: (recipient: Recipient) => void;
  showEditButton?: boolean;
  showDeactivateButton?: boolean;
  canDeactivate?: boolean;
  isDeactivating?: boolean;
}

export const RecipientDetails: React.FC<RecipientDetailsProps> = ({
  recipient,
  onClose,
  onEdit,
  onDeactivate,
  showEditButton = false,
  showDeactivateButton = false,
  canDeactivate = false,
  isDeactivating = false,
}) => {
  const { color, icon: StatusIcon } = getStatusColor(recipient.status!);
  const statusDescription = getStatusDescription(recipient.status!);
  const validation = validateRecipientForPayments(recipient);
  const originalContacts = recipient.partyDetails.contacts || [];

  return (
    <div className="eb-space-y-4 eb-pb-4">
      {/* Header */}
      <div className="eb-flex eb-items-start eb-justify-between">
        <div className="eb-space-y-1">
          <h2 className="eb-text-base eb-font-semibold">
            {formatRecipientName(recipient)}
          </h2>
          <div className="eb-flex eb-items-center eb-gap-2">
            <Badge
              variant="secondary"
              className={`eb-text-sm ${color} eb-flex eb-items-center eb-gap-1`}
            >
              <StatusIcon className="eb-h-3 eb-w-3" />
              {recipient.status}
            </Badge>
            <Badge variant="outline" className="eb-text-sm">
              {recipient.partyDetails?.type === 'INDIVIDUAL'
                ? 'Individual'
                : 'Business'}
            </Badge>
          </div>
        </div>
        {showEditButton && onEdit && (
          <Button onClick={() => onEdit(recipient)} variant="outline">
            Edit
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      {(showEditButton || showDeactivateButton) && (
        <>
          <Separator />
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
          <Separator />
        </>
      )}

      {/* Status Alert */}
      <Alert>
        <Info className="eb-h-4 eb-w-4" />
        <AlertDescription>{statusDescription}</AlertDescription>
      </Alert>

      {/* Validation Errors */}
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

      {/* Party Details */}
      <Card>
        <CardHeader>
          <CardTitle className="eb-flex eb-items-center eb-gap-2 eb-text-base eb-font-semibold">
            {recipient.partyDetails.type === 'INDIVIDUAL' ? (
              <User className="eb-h-5 eb-w-5" />
            ) : (
              <Building className="eb-h-5 eb-w-5" />
            )}
            Party Information
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-4">
          <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
            <div className="eb-space-y-2">
              <p className="eb-text-sm eb-font-medium eb-text-gray-600">Type</p>
              <p className="eb-text-sm eb-font-semibold">
                {recipient.partyDetails.type === 'INDIVIDUAL'
                  ? 'Individual'
                  : 'Business'}
              </p>
            </div>

            {recipient.partyDetails.type === 'INDIVIDUAL' && (
              <>
                <div className="eb-space-y-2">
                  <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                    First Name
                  </p>
                  <p className="eb-text-sm eb-font-semibold">
                    {recipient.partyDetails.firstName || 'N/A'}
                  </p>
                </div>
                <div className="eb-space-y-2">
                  <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                    Last Name
                  </p>
                  <p className="eb-text-sm eb-font-semibold">
                    {recipient.partyDetails.lastName || 'N/A'}
                  </p>
                </div>
              </>
            )}

            {recipient.partyDetails.type === 'ORGANIZATION' && (
              <div className="eb-space-y-2">
                <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                  Business Name
                </p>
                <p className="eb-text-sm eb-font-semibold">
                  {recipient.partyDetails.businessName || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Address */}
          {recipient.partyDetails.address && (
            <>
              <Separator />
              <div className="eb-space-y-3">
                <div className="eb-flex eb-items-center eb-gap-2">
                  <MapPin className="eb-h-4 eb-w-4" />
                  <h4 className="eb-text-base eb-font-semibold">Address</h4>
                </div>
                <div className="eb-text-sm eb-leading-relaxed eb-text-gray-600">
                  {formatRecipientAddress(recipient)}
                </div>
              </div>
            </>
          )}

          {/* Contacts */}
          {originalContacts.length > 0 && (
            <>
              <Separator />
              <div className="eb-space-y-3">
                <h4 className="eb-flex eb-items-center eb-gap-2 eb-text-base eb-font-semibold">
                  <Phone className="eb-h-4 eb-w-4" />
                  Contact Information
                </h4>
                <div className="eb-space-y-2">
                  {originalContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="eb-flex eb-items-center eb-justify-between eb-rounded-md eb-bg-gray-50 eb-px-3 eb-py-2"
                    >
                      <div className="eb-flex eb-items-center eb-gap-2">
                        {contact.contactType === 'EMAIL' && (
                          <Mail className="eb-h-4 eb-w-4 eb-text-gray-500" />
                        )}
                        {contact.contactType === 'PHONE' && (
                          <Phone className="eb-h-4 eb-w-4 eb-text-gray-500" />
                        )}
                        {contact.contactType === 'WEBSITE' && (
                          <Globe className="eb-h-4 eb-w-4 eb-text-gray-500" />
                        )}
                        <div>
                          <p className="eb-text-sm eb-font-semibold">
                            {contact.value}
                          </p>
                          <p className="eb-text-xs eb-text-gray-500">
                            {contact.contactType}
                            {contact.countryCode && ` (${contact.countryCode})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      {recipient.account && (
        <Card>
          <CardHeader>
            <CardTitle className="eb-flex eb-items-center eb-gap-2 eb-text-base eb-font-semibold">
              <CreditCard className="eb-h-5 eb-w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4">
            <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
              <div className="eb-space-y-2">
                <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                  Account Number
                </p>
                <p className="eb-font-mono eb-text-xs">
                  ****{recipient.account.number?.slice(-4) || 'N/A'}
                </p>
              </div>

              {recipient.account.type && (
                <div className="eb-space-y-2">
                  <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                    Account Type
                  </p>
                  <p className="eb-text-sm eb-font-semibold">
                    {recipient.account.type}
                  </p>
                </div>
              )}

              <div className="eb-space-y-2">
                <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                  Country
                </p>
                <p className="eb-text-sm eb-font-semibold">
                  {recipient.account.countryCode || 'N/A'}
                </p>
              </div>
            </div>

            {/* Routing Information */}
            {recipient.account.routingInformation &&
              recipient.account.routingInformation.length > 0 && (
                <>
                  <Separator />
                  <div className="eb-space-y-3">
                    <h4 className="eb-text-base eb-font-semibold">
                      Routing Information
                    </h4>
                    {recipient.account.routingInformation.map(
                      (routing, index) => (
                        <div
                          key={index}
                          className="eb-grid eb-grid-cols-1 eb-gap-4 eb-rounded-md eb-bg-gray-50 eb-p-3 md:eb-grid-cols-3"
                        >
                          <div className="eb-space-y-1">
                            <p className="eb-text-xs eb-font-medium eb-text-gray-600">
                              Routing Number
                            </p>
                            <p className="eb-font-mono eb-text-xs">
                              {routing.routingNumber}
                            </p>
                          </div>
                          <div className="eb-space-y-1">
                            <p className="eb-text-xs eb-font-medium eb-text-gray-600">
                              Code Type
                            </p>
                            <p className="eb-text-xs eb-font-semibold">
                              {routing.routingCodeType}
                            </p>
                          </div>
                          <div className="eb-space-y-1">
                            <p className="eb-text-xs eb-font-medium eb-text-gray-600">
                              Transaction Type
                            </p>
                            <p className="eb-text-xs eb-font-semibold">
                              {routing.transactionType}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}

            {/* Formatted Account Info */}
            <Separator />
            <div className="eb-space-y-2">
              <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                Account Summary
              </p>
              <div className="eb-rounded-md eb-bg-gray-50 eb-p-3">
                <p className="eb-font-mono eb-text-xs">
                  {formatAccountInfo(recipient)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {recipient.createdAt && (
        <Card>
          <CardHeader>
            <CardTitle className="eb-flex eb-items-center eb-gap-2 eb-text-base eb-font-semibold">
              <Calendar className="eb-h-5 eb-w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4">
            <div className="eb-space-y-2">
              <p className="eb-text-sm eb-font-medium eb-text-gray-600">
                Created
              </p>
              <p className="eb-text-xs">
                {new Date(recipient.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="eb-flex eb-justify-end eb-border-t eb-pt-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};
