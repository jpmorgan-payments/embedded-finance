import { FC } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { RecipientI18nNamespace } from '../../types';

type RemoveAccountResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Recipient;
  /**
   * i18n namespace to use for translations
   * @default 'linked-accounts'
   */
  i18nNamespace?: RecipientI18nNamespace;
};

/**
 * RemoveAccountResultDialog - Dialog shown after successfully removing an account
 *
 * This component displays a success message after an account has been removed.
 * It's managed at the LinkedAccountWidget level to ensure the dialog persists
 * even after the account card is removed from the list.
 *
 * @example
 * ```tsx
 * <RemoveAccountResultDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   recipient={removedRecipient}
 * />
 * ```
 */
export const RemoveAccountResultDialog: FC<RemoveAccountResultDialogProps> = ({
  open,
  onOpenChange,
  recipient,
  i18nNamespace = 'linked-accounts',
}) => {
  const { t } = useTranslation(i18nNamespace);
  const displayName = recipient ? getRecipientDisplayName(recipient) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="eb-max-w-md eb-space-y-4">
        <DialogHeader className="eb-space-y-3">
          <div className="eb-flex eb-items-center eb-gap-3 eb-font-header">
            <div className="eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-green-100">
              <CheckCircle2 className="eb-h-5 eb-w-5 eb-text-green-600" />
            </div>
            <DialogTitle className="eb-text-xl">
              {t('forms.removeAccount.titleSuccess')}
            </DialogTitle>
          </div>
          <DialogDescription className="eb-text-sm">
            <Trans
              i18nKey="forms.removeAccount.descriptionSuccess"
              ns={i18nNamespace}
              values={{ name: displayName }}
              components={{ strong: <strong /> }}
            />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button className="eb-w-full">
              {t('forms.removeAccount.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
