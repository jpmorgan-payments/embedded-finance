import { getRecipientLabel } from '@/lib/utils';
import { useGetAllRecipients } from '@/api/generated/ef-v1';
import { RecipientStatus } from '@/api/generated/ef-v1.schemas';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@/components/ui';

import { LinkAccountFormDialogTrigger } from './LinkAccountForm/LinkAccountForm';
import { MicrodepositsFormDialogTrigger } from './MicrodepositsForm/MicrodepositsForm';

const StatusBadge = ({ status }: { status: RecipientStatus }) => {
  const propsMap: Record<RecipientStatus, Record<string, string>> = {
    ACTIVE: {
      variant: 'success',
    },
    MICRODEPOSITS_INITIATED: {
      variant: 'secondary',
    },
    REJECTED: {
      variant: 'destructive',
    },
    READY_FOR_VALIDATION: {},
    INACTIVE: {
      variant: 'secondary',
    },
  };

  return (
    <Badge {...propsMap[status]} className="eb-text-xs">
      {status.replace('_', ' ')}
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
};

export const LinkedAccountWidget: React.FC<LinkedAccountWidgetProps> = ({
  variant = 'default',
  showCreateButton = true,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, status, failureReason } = useGetAllRecipients({
    type: 'LINKED_ACCOUNT',
  });

  const modifiedRecipients =
    variant === 'singleAccount'
      ? data?.recipients?.slice(0, 1)
      : data?.recipients;

  return (
    <Card className="eb-w-full">
      <CardHeader>
        <div className="eb-flex eb-items-center eb-justify-between">
          <CardTitle className="eb-text-xl eb-font-semibold">
            Linked Accounts
          </CardTitle>
          {showCreateButton && (
            <LinkAccountFormDialogTrigger>
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
              <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-4">
                {recipient.status === 'READY_FOR_VALIDATION' && (
                  <MicrodepositsFormDialogTrigger recipientId={recipient.id}>
                    <span
                      role="button"
                      tabIndex={0}
                      className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                      title="Verify microdeposits"
                    >
                      Verify microdeposits
                    </span>
                  </MicrodepositsFormDialogTrigger>
                )}
                <span
                  role="button"
                  tabIndex={0}
                  className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                  title="View details"
                >
                  Details
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="eb-cursor-pointer eb-text-blue-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                  title="Edit linked account"
                >
                  Edit
                </span>
                {recipient.status === 'ACTIVE' && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="eb-cursor-pointer eb-text-red-600 eb-outline-none eb-transition-colors hover:eb-underline focus:eb-underline"
                    title="Deactivate linked account"
                  >
                    Deactivate
                  </span>
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
