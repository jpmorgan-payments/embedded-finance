import { useLayoutEffect, useState } from 'react';
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

type CancelMaintenanceDialogProps = {
  open: boolean;
  scope: 'all' | 'party' | 'organization' | 'pending-addition';
  affectedNames: string[];
  allTargets?: React.ReactNode[];
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
  allTargets = [],
  changedFieldLabels = [],
  error,
  isPending,
  onOpenChange,
  onConfirm,
}: CancelMaintenanceDialogProps) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const [localError, setLocalError] = useState<unknown>();
  const [presentation, setPresentation] = useState({
    scope,
    affectedNames,
    allTargets,
    changedFieldLabels,
  });

  useLayoutEffect(() => {
    if (open) {
      setPresentation({ scope, affectedNames, allTargets, changedFieldLabels });
    }
    // Snapshot only when a new open cycle starts; live refetches must not
    // replace dialog content during its open or exit animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const displayedScope = presentation.scope;
  const displayedNames = presentation.affectedNames;
  const displayedTargets = presentation.allTargets;
  const displayedFieldLabels = presentation.changedFieldLabels;

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
            {displayedScope === 'all'
              ? t('cancel.allTitle')
              : displayedScope === 'organization'
                ? t('cancel.organizationTitle')
                : displayedScope === 'pending-addition'
                  ? t('pendingAddition.discardTitle', {
                      name: displayedNames[0] ?? '',
                    })
                  : t('cancel.personTitle', {
                      name: displayedNames[0] ?? '',
                    })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {displayedScope === 'all'
              ? t('cancel.allDescription')
              : displayedScope === 'organization'
                ? t('cancel.organizationDescription')
                : displayedScope === 'pending-addition'
                  ? t('pendingAddition.discardDescription')
                  : t('cancel.personDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {displayedNames.length > 0 || displayedTargets.length > 0 ? (
          <div>
            <p className="eb-text-sm eb-font-medium">
              {displayedScope === 'all'
                ? t('cancel.affectedPeople')
                : displayedScope === 'pending-addition'
                  ? t('pendingAddition.pendingParty')
                  : t('cancel.pendingUpdates')}
            </p>
            <ul className="eb-mt-2 eb-list-inside eb-list-disc eb-space-y-1 eb-text-sm eb-text-muted-foreground">
              {(displayedScope === 'all'
                ? displayedTargets
                : displayedScope === 'pending-addition'
                  ? displayedNames
                  : displayedFieldLabels
              ).map((label, index) => (
                <li key={index}>{label}</li>
              ))}
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
            {!isPending ? <Undo2Icon /> : null}
            {displayedScope === 'all'
              ? t('cancel.confirmAll')
              : displayedScope === 'pending-addition'
                ? t('pendingAddition.discard')
                : t('cancel.discardChanges')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
