import React from 'react';

import { getRecipientLabel } from '@/lib/utils';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import {
  ApiError,
  Recipient,
  RecipientStatus,
} from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { LinkAccountFormDialogTrigger } from './LinkAccountForm/LinkAccountForm';
import { MicrodepositsFormDialogTrigger } from './MicrodepositsForm/MicrodepositsForm';

const StatusBadge = ({ status }: { status: RecipientStatus }) => {
  const propsMap: Record<RecipientStatus, Record<string, string>> = {
    ACTIVE: {
      variant: 'success',
    },
    INACTIVE: {
      variant: 'secondary',
    },
    MICRODEPOSITS_INITIATED: {
      variant: 'secondary',
    },
    PENDING: {
      variant: 'secondary',
    },
    READY_FOR_VALIDATION: {},
    REJECTED: {
      variant: 'destructive',
    },
  };

  return (
    <Badge {...propsMap[status]} className="eb-text-xs">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};

// Helper to get supported payment methods as a string array
function getSupportedPaymentMethods(recipient: any): string[] {
  if (!recipient.account?.routingInformation) return [];
  return recipient.account.routingInformation
    .map((ri: any) => ri.transactionType)
    .filter(Boolean);
}

type LinkedAccountWidgetProps = {
  variant?: 'default' | 'singleAccount';
  showCreateButton?: boolean;
  makePaymentComponent?: React.ReactNode; // Optional MakePayment component to render in each card
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

export const LinkedAccountWidget: React.FC<LinkedAccountWidgetProps> = ({
  variant = 'default',
  showCreateButton = true,
  makePaymentComponent,
  onLinkedAccountSettled,
}) => {
  const { interceptorReady } = useInterceptorStatus();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, status, failureReason } = useGetAllRecipients(
    {
      type: 'LINKED_ACCOUNT',
    },
    {
      query: {
        enabled: interceptorReady,
      },
    }
  );

  const modifiedRecipients =
    variant === 'singleAccount'
      ? data?.recipients?.slice(0, 1)
      : data?.recipients;

  return (
    <Card className="eb-component eb-w-full">
      <CardHeader>
        <div className="eb-flex eb-items-center eb-justify-between">
          <CardTitle className="eb-text-xl eb-font-semibold">
            Linked Accounts
          </CardTitle>
          {showCreateButton &&
            !(
              variant === 'singleAccount' &&
              status === 'success' &&
              modifiedRecipients &&
              modifiedRecipients.some(
                (recipient) => recipient.status === 'ACTIVE'
              )
            ) && (
              <LinkAccountFormDialogTrigger
                onLinkedAccountSettled={onLinkedAccountSettled}
              >
                <Button>Link A New Account</Button>
              </LinkAccountFormDialogTrigger>
            )}
        </div>
      </CardHeader>
      <CardContent className="eb-space-y-4">
        {status === 'pending' && (
          <div className="eb-py-8 eb-text-center eb-text-gray-500">
            Loading linked accounts...
          </div>
        )}
        {status === 'error' && (
          <div className="eb-py-8 eb-text-center eb-text-red-500">
            Error: {failureReason?.message ?? 'Unknown error'}
          </div>
        )}

        {status === 'success' &&
          modifiedRecipients &&
          modifiedRecipients.length > 0 &&
          modifiedRecipients.map((recipient) => (
            <div
              key={recipient.id}
              className="eb-space-y-2 eb-rounded-lg eb-border eb-p-4"
            >
              <div className="eb-flex eb-items-center eb-justify-between">
                <div className="eb-truncate eb-text-base eb-font-semibold">
                  {getRecipientLabel(recipient)}
                </div>
                <Badge variant="outline" className="eb-text-sm">
                  {recipient.partyDetails?.type === 'INDIVIDUAL'
                    ? 'Individual'
                    : 'Business'}
                </Badge>
              </div>
              <div className="eb-flex eb-items-center eb-gap-2">
                {recipient.status && <StatusBadge status={recipient.status} />}
                <span className="eb-text-xs eb-text-gray-500">
                  {recipient.createdAt
                    ? new Date(recipient.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )
                    : 'N/A'}
                </span>
              </div>
              <div className="eb-text-xs eb-text-gray-600">
                <span className="eb-font-medium">Account:</span>{' '}
                {recipient.account?.number
                  ? `****${recipient.account.number.slice(-4)}`
                  : 'N/A'}
              </div>
              {/* Supported Payment Methods */}
              <div className="eb-mt-1 eb-flex eb-flex-wrap eb-gap-1">
                {getSupportedPaymentMethods(recipient).length > 0 ? (
                  getSupportedPaymentMethods(recipient).map(
                    (method: string) => (
                      <Badge
                        key={method}
                        variant="secondary"
                        className="eb-text-xs"
                      >
                        {method}
                      </Badge>
                    )
                  )
                ) : (
                  <span className="eb-text-xs eb-text-gray-400">
                    No payment methods
                  </span>
                )}
              </div>
              <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-2">
                {recipient.status === 'READY_FOR_VALIDATION' && (
                  <MicrodepositsFormDialogTrigger
                    recipientId={recipient.id}
                    onLinkedAccountSettled={onLinkedAccountSettled}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="eb-text-xs"
                      title="Verify microdeposits"
                    >
                      Verify microdeposits
                    </Button>
                  </MicrodepositsFormDialogTrigger>
                )}
                {makePaymentComponent && recipient.status === 'ACTIVE' && (
                  <div className="eb-ml-auto">
                    {React.cloneElement(
                      makePaymentComponent as React.ReactElement,
                      {
                        recipientId: recipient.id,
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        {status === 'success' &&
          modifiedRecipients &&
          modifiedRecipients.length === 0 && (
            <div className="eb-py-8 eb-text-center eb-text-gray-500">
              No linked accounts found
            </div>
          )}
      </CardContent>
    </Card>
  );
};
