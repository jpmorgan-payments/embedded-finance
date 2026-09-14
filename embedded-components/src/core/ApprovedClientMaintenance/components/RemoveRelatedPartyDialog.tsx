import { useEffect, useLayoutEffect, useState } from 'react';
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

export function RemoveRelatedPartyDialog({
  open,
  name,
  isPending,
  error,
  replacementRequired,
  controllerIsBeneficialOwner,
  canAddReplacement,
  replacementAlreadyAdded,
  onOpenChange,
  onConfirm,
  onAddReplacement,
}: {
  open: boolean;
  name: string;
  isPending: boolean;
  error?: unknown;
  replacementRequired: boolean;
  controllerIsBeneficialOwner: boolean;
  canAddReplacement: boolean;
  replacementAlreadyAdded: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onAddReplacement: (remainsBeneficialOwner: boolean) => void | Promise<void>;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const [remainsBeneficialOwner, setRemainsBeneficialOwner] = useState<
    boolean | undefined
  >();
  const [presentation, setPresentation] = useState({
    name,
    replacementRequired,
    controllerIsBeneficialOwner,
    canAddReplacement,
    replacementAlreadyAdded,
  });

  useLayoutEffect(() => {
    if (open) {
      setPresentation({
        name,
        replacementRequired,
        controllerIsBeneficialOwner,
        canAddReplacement,
        replacementAlreadyAdded,
      });
    }
    // Freeze presentation through refetches and the exit animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) setRemainsBeneficialOwner(undefined);
  }, [open]);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(
              presentation.replacementRequired
                ? 'removeParty.replacementDialogTitle'
                : 'removeParty.title',
              { name: presentation.name }
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {presentation.replacementRequired
              ? t('removeParty.replacementDescription')
              : t('removeParty.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {presentation.replacementRequired && !presentation.canAddReplacement ? (
          <p className="eb-text-sm eb-font-medium eb-text-warning-foreground">
            {t('removeParty.replacementUnavailable')}
          </p>
        ) : null}
        {presentation.replacementRequired &&
        presentation.controllerIsBeneficialOwner ? (
          <fieldset className="eb-space-y-2">
            <legend className="eb-text-sm eb-font-semibold">
              {t('removeParty.remainsOwnerQuestion')}
            </legend>
            <div className="eb-grid eb-gap-2 @[40rem]:eb-grid-cols-2">
              {[true, false].map((value) => (
                <Button
                  key={String(value)}
                  type="button"
                  variant={
                    remainsBeneficialOwner === value ? 'default' : 'outline'
                  }
                  onClick={() => setRemainsBeneficialOwner(value)}
                >
                  {t(
                    value
                      ? 'removeParty.remainsOwnerYes'
                      : 'removeParty.remainsOwnerNo'
                  )}
                </Button>
              ))}
            </div>
          </fieldset>
        ) : null}
        {error ? <ServerErrorAlert error={error as never} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('removeParty.keep')}
          </AlertDialogCancel>
          {presentation.replacementRequired ? (
            <Button
              disabled={
                isPending ||
                !presentation.canAddReplacement ||
                (presentation.controllerIsBeneficialOwner &&
                  remainsBeneficialOwner === undefined)
              }
              onClick={() =>
                void onAddReplacement(remainsBeneficialOwner === true)
              }
            >
              {t(
                presentation.replacementAlreadyAdded
                  ? 'removeParty.finishReplacement'
                  : 'removeParty.addReplacement'
              )}
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? <Loader2Icon className="eb-animate-spin" /> : null}
              {t('removeParty.confirm')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
