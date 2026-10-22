import { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  Loader2Icon,
  UserRoundCheckIcon,
  UserRoundMinusIcon,
} from 'lucide-react';

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
import { Button, Label, RadioGroup, RadioGroupItem } from '@/components/ui';

import { usePendingAction } from '../hooks/usePendingAction';

export function RemoveRelatedPartyDialog({
  open,
  name,
  isPending,
  error,
  replacementRequired,
  controllerIsBeneficialOwner,
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
  replacementAlreadyAdded: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onAddReplacement: (remainsBeneficialOwner: boolean) => void | Promise<void>;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const replacement = usePendingAction<'replace'>();
  const { reset: resetReplacement } = replacement;
  const [remainsBeneficialOwner, setRemainsBeneficialOwner] = useState<
    boolean | undefined
  >();
  const [presentation, setPresentation] = useState({
    name,
    replacementRequired,
    controllerIsBeneficialOwner,
    replacementAlreadyAdded,
  });

  useLayoutEffect(() => {
    if (open) {
      setPresentation({
        name,
        replacementRequired,
        controllerIsBeneficialOwner,
        replacementAlreadyAdded,
      });
      // Only a current owner is asked whether they stay on.
      setRemainsBeneficialOwner(
        controllerIsBeneficialOwner ? undefined : false
      );
    }
    // Freeze presentation through refetches and the exit animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      setRemainsBeneficialOwner(undefined);
      resetReplacement();
    }
  }, [open, resetReplacement]);
  const isBusy = isPending || replacement.isPending;
  const asksAboutOwnership =
    presentation.replacementRequired &&
    presentation.controllerIsBeneficialOwner;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isBusy) onOpenChange(nextOpen);
      }}
    >
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
        {asksAboutOwnership ? (
          <fieldset disabled={isBusy}>
            <legend className="eb-mb-3 eb-text-sm eb-font-semibold">
              {t('removeParty.remainsOwnerQuestion')}
            </legend>
            <RadioGroup
              value={
                remainsBeneficialOwner === undefined
                  ? ''
                  : String(remainsBeneficialOwner)
              }
              disabled={isBusy}
              onValueChange={(value) =>
                setRemainsBeneficialOwner(value === 'true')
              }
              className="eb-gap-3"
            >
              {[
                {
                  value: 'true',
                  Icon: UserRoundCheckIcon,
                  label: t('removeParty.remainsOwnerYes'),
                },
                {
                  value: 'false',
                  Icon: UserRoundMinusIcon,
                  label: t('removeParty.remainsOwnerNo'),
                },
              ].map(({ value, Icon, label }) => (
                <Label
                  key={value}
                  htmlFor={`controller-remains-owner-${value}`}
                  className="eb-flex eb-cursor-pointer eb-items-center eb-gap-3 eb-rounded-md eb-border eb-p-4 eb-font-normal has-[:disabled]:eb-cursor-not-allowed has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-accent/30 has-[:disabled]:eb-opacity-60"
                >
                  <RadioGroupItem
                    id={`controller-remains-owner-${value}`}
                    value={value}
                  />
                  <Icon
                    aria-hidden="true"
                    className="eb-size-5 eb-shrink-0 eb-text-muted-foreground"
                  />
                  <span className="eb-text-sm eb-font-semibold">{label}</span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        ) : null}
        {error || replacement.error ? (
          <ServerErrorAlert error={(error ?? replacement.error) as never} />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>
            {t('removeParty.keep')}
          </AlertDialogCancel>
          {presentation.replacementRequired ? (
            <Button
              disabled={isBusy || remainsBeneficialOwner === undefined}
              onClick={() =>
                void replacement.run('replace', () =>
                  onAddReplacement(remainsBeneficialOwner === true)
                )
              }
            >
              {replacement.isPending ? (
                <Loader2Icon className="eb-animate-spin" />
              ) : null}
              {t(
                presentation.replacementAlreadyAdded
                  ? 'removeParty.finishReplacement'
                  : 'removeParty.addReplacement'
              )}
            </Button>
          ) : (
            <Button variant="destructive" disabled={isBusy} onClick={onConfirm}>
              {isPending ? <Loader2Icon className="eb-animate-spin" /> : null}
              {t('removeParty.confirm')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
