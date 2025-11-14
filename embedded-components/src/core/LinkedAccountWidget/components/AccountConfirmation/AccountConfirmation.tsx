import { FC } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';

import { AccountDisplayCard } from '../AccountDisplayCard/AccountDisplayCard';

interface AccountConfirmationProps {
  recipient: Recipient;
}

/**
 * AccountConfirmation - Confirmation component for account operations
 * Used by both LinkAccountForm and EditAccountForm
 * Uses the generic AccountDisplayCard with a success header
 */
export const AccountConfirmation: FC<AccountConfirmationProps> = ({
  recipient,
}) => {
  return (
    <div className="eb-space-y-6">
      <AccountDisplayCard recipient={recipient} />

      <DialogFooter>
        <DialogClose asChild>
          <Button className="eb-w-full">Done</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};
