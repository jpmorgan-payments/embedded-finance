import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Loader2Icon } from 'lucide-react';

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

type CancelMaintenanceDialogProps = {
  open: boolean;
  scope: 'all' | 'party';
  affectedNames: string[];
  changedFieldLabels?: React.ReactNode[];
  error?: unknown;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

export function CancelMaintenanceDialog({
  open,
  scope,
  affectedNames,
  changedFieldLabels = [],
  error,
  isPending,
  onOpenChange,
  onConfirm,
}: CancelMaintenanceDialogProps) {
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
          <AlertDialogTitle>
            {scope === 'all'
              ? t('cancel.allTitle')
              : t('cancel.personTitle', {
                  name: affectedNames[0] ?? '',
                })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {scope === 'all'
              ? t('cancel.allDescription')
              : t('cancel.personDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {affectedNames.length > 0 ? (
          <div>
            <p className="eb-text-sm eb-font-medium">
              {scope === 'all'
                ? t('cancel.affectedPeople')
                : t('cancel.pendingUpdates')}
            </p>
            <ul className="eb-mt-2 eb-list-inside eb-list-disc eb-space-y-1 eb-text-sm eb-text-muted-foreground">
              {(scope === 'all' ? affectedNames : changedFieldLabels).map(
                (label, index) => (
                  <li key={index}>{label}</li>
                )
              )}
            </ul>
          </div>
        ) : null}

        <p className="eb-text-sm eb-text-muted-foreground">
          {t('cancel.profileUnchanged')} {t('cancel.cannotUndo')}
        </p>

        {error || localError ? (
          <ServerErrorAlert error={(error ?? localError) as never} />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('cancel.keep')}
          </AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending ? <Loader2Icon className="eb-animate-spin" /> : null}
            {scope === 'all'
              ? t('cancel.confirmAll')
              : t('cancel.confirmPerson')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
