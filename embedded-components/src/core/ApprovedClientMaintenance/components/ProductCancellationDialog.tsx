import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Loader2Icon, Undo2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button } from '@/components/ui';

export function ProductCancellationDialog({
  open,
  isPending,
  error,
  hasMaintenanceChanges,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  isPending: boolean;
  error?: unknown;
  hasMaintenanceChanges: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const [localError, setLocalError] = useState<unknown>();

  const confirm = async () => {
    setLocalError(undefined);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (nextError) {
      setLocalError(nextError);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setLocalError(undefined);
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('productCancellation.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('productCancellation.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasMaintenanceChanges ? (
          <p className="eb-rounded-md eb-border eb-bg-muted/20 eb-p-3 eb-text-sm eb-text-muted-foreground">
            {t('productCancellation.maintenancePreserved')}
          </p>
        ) : null}

        {error || localError ? (
          <ServerErrorAlert error={(error ?? localError) as never} />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('productCancellation.keep')}
          </AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="eb-animate-spin" />
            ) : (
              <Undo2Icon />
            )}
            {t('productCancellation.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
