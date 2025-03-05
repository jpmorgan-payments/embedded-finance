import { LinkIcon, PencilLineIcon } from 'lucide-react';

import { getRecipientLabel } from '@/lib/utils';
import { useGetAllRecipients } from '@/api/generated/ef-v1';
import { RecipientStatus } from '@/api/generated/ef-v1.schemas';
import { Button } from '@/components/ui/button';
import { Badge, Separator } from '@/components/ui';

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

  return <Badge {...propsMap[status]}>{status.replace('_', ' ')}</Badge>;
};

type LinkedAccountWidgetProps = {
  variant?: 'default' | 'singleAccount';
};

export const LinkedAccountWidget: React.FC<LinkedAccountWidgetProps> = ({
  variant = 'default',
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
    <div className="eb-component eb-space-y-4">
      {status === 'pending' && <p>Loading...</p>}
      {status === 'error' && (
        <p>Error: {failureReason?.message ?? 'Unknown error'}</p>
      )}

      {status === 'success' &&
        modifiedRecipients &&
        modifiedRecipients.length > 0 &&
        modifiedRecipients.map((recipient) => (
          <div key={recipient.id} className="eb-space-y-1">
            <div className="eb-flex eb-items-center eb-justify-between">
              <h4
                key={recipient.id}
                className="eb-text-sm eb-font-medium eb-leading-none"
              >
                {getRecipientLabel(recipient)}
              </h4>
              {recipient.status && <StatusBadge status={recipient.status} />}
            </div>
            <p className="eb-text-sm eb-text-muted-foreground">
              {recipient.partyDetails.type.toLocaleUpperCase()}
            </p>
            {recipient.status === 'READY_FOR_VALIDATION' && (
              <MicrodepositsFormDialogTrigger recipientId={recipient.id}>
                <Button size="sm" variant="secondary" className="eb-mt-2">
                  <PencilLineIcon className="eb-mr-2 eb-h-4 eb-w-4" /> Verify
                  microdeposits
                </Button>
              </MicrodepositsFormDialogTrigger>
            )}
          </div>
        ))}
      {status === 'success' &&
        modifiedRecipients &&
        ((variant === 'singleAccount' && modifiedRecipients.length === 0) ||
          variant === 'default') && (
          <>
            {(data?.recipients ?? []).length > 0 && (
              <Separator className="eb-my-4" />
            )}
            <LinkAccountFormDialogTrigger>
              <Button>
                <LinkIcon className="eb-mr-2 eb-h-4 eb-w-4" /> Link A New
                Account
              </Button>
            </LinkAccountFormDialogTrigger>
          </>
        )}
    </div>
  );
};
