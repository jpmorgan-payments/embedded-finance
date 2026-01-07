import { FC } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
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

type VerificationResultVariant = 'success' | 'maxAttemptsExceeded';

type VerificationResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Recipient;
  variant: VerificationResultVariant;
};

const VARIANT_CONFIG = {
  success: {
    icon: CheckCircle2,
    iconBgClass: 'eb-bg-success/10',
    iconColorClass: 'eb-text-success',
    titleKey: 'verificationSuccess.title',
    descriptionKey: 'verificationSuccess.description',
    closeKey: 'verificationSuccess.close',
  },
  maxAttemptsExceeded: {
    icon: AlertCircle,
    iconBgClass: 'eb-bg-destructive/10',
    iconColorClass: 'eb-text-destructive',
    titleKey: 'maxAttemptsExceeded.title',
    descriptionKey: 'maxAttemptsExceeded.description',
    closeKey: 'maxAttemptsExceeded.close',
  },
} as const;

/**
 * VerificationResultDialog - Dialog shown for microdeposit verification results
 *
 * This component displays success or failure messages after microdeposit verification.
 * It supports two variants:
 * - 'success': Shows when verification succeeds (VERIFIED status)
 * - 'maxAttemptsExceeded': Shows when max verification attempts are exceeded
 *
 * @example
 * ```tsx
 * // Success case
 * <VerificationResultDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   recipient={recipient}
 *   variant="success"
 * />
 *
 * // Max attempts exceeded case
 * <VerificationResultDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   recipient={recipient}
 *   variant="maxAttemptsExceeded"
 * />
 * ```
 */
export const VerificationResultDialog: FC<VerificationResultDialogProps> = ({
  open,
  onOpenChange,
  recipient,
  variant,
}) => {
  const { t } = useTranslation('linked-accounts');
  const displayName = recipient ? getRecipientDisplayName(recipient) : '';

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="eb-max-w-md eb-space-y-4">
        <DialogHeader className="eb-space-y-3">
          <div className="eb-flex eb-items-center eb-gap-3 eb-font-header">
            <div
              className={cn(
                'eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full',
                config.iconBgClass
              )}
            >
              <Icon className={cn('eb-h-5 eb-w-5', config.iconColorClass)} />
            </div>
            <DialogTitle className="eb-text-xl">
              {t(config.titleKey)}
            </DialogTitle>
          </div>
          <DialogDescription className="eb-text-sm">
            <Trans
              i18nKey={config.descriptionKey}
              ns="linked-accounts"
              values={{ name: displayName }}
            />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button className="eb-w-full">{t(config.closeKey)}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
