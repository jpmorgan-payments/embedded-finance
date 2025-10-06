import { FC } from 'react';

import { getRecipientLabel } from '@/lib/utils';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui';

interface LinkAccountConfirmationProps {
  recipient: Recipient;
}

export const LinkAccountConfirmation: FC<LinkAccountConfirmationProps> = ({
  recipient,
}) => {
  const isMicrodepositsInitiated =
    recipient.status === 'MICRODEPOSITS_INITIATED';
  const isReadyForValidation = recipient.status === 'READY_FOR_VALIDATION';

  return (
    <div className="eb-space-y-5 eb-py-2">
      <div className="eb-space-y-2 eb-rounded-lg eb-border eb-bg-card eb-p-4">
        <div className="eb-flex eb-items-center eb-justify-between eb-gap-4">
          <h4 className="eb-text-base eb-font-medium eb-leading-none">
            {getRecipientLabel(recipient)}
          </h4>
          {!isMicrodepositsInitiated &&
          !isReadyForValidation &&
          recipient.status ? (
            <Badge>{recipient.status}</Badge>
          ) : null}
        </div>
        <p className="eb-text-xs eb-text-muted-foreground">
          {recipient?.partyDetails?.type?.toLocaleUpperCase()}
        </p>
      </div>

      <DialogFooter className="eb-gap-2">
        <DialogClose asChild>
          <Button>Done</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};
