import { FC } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';

import { LinkedAccountCard } from '../../components/LinkedAccountCard';

interface LinkAccountConfirmationProps {
  recipient: Recipient;
}

export const LinkAccountConfirmation: FC<LinkAccountConfirmationProps> = ({
  recipient,
}) => {
  return (
    <div className="eb-space-y-6">
      <LinkedAccountCard recipient={recipient} hideActions />

      <DialogFooter>
        <DialogClose asChild>
          <Button className="eb-w-full">Done</Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
};
