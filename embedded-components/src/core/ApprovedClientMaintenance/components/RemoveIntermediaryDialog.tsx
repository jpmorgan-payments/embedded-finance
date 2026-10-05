import { useLayoutEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { IndentDecreaseIcon, Loader2Icon, Trash2Icon } from 'lucide-react';

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

export function RemoveIntermediaryDialog({
  open,
  isPendingAddition = false,
  name,
  parentName,
  directChildNames,
  dependentNames,
  isPending,
  error,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  /** A business added in this request is discarded rather than removed. */
  isPendingAddition?: boolean;
  name: string;
  parentName: string;
  directChildNames: string[];
  dependentNames: string[];
  isPending: boolean;
  error?: unknown;
  onOpenChange: (open: boolean) => void;
  onConfirm: (strategy: 'promote-children' | 'remove-branch') => Promise<void>;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const [strategy, setStrategy] = useState<
    'promote-children' | 'remove-branch'
  >('promote-children');
  const [presentation, setPresentation] = useState({
    isPendingAddition,
    name,
    parentName,
    directChildNames,
    dependentNames,
  });

  useLayoutEffect(() => {
    if (open) {
      setPresentation({
        isPendingAddition,
        name,
        parentName,
        directChildNames,
        dependentNames,
      });
      setStrategy('promote-children');
    }
    // Freeze presentation through refetches and the exit animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hasDependents = presentation.dependentNames.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(
              presentation.isPendingAddition
                ? 'removeIntermediary.discardTitle'
                : 'removeIntermediary.title',
              { name: presentation.name }
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              hasDependents
                ? 'removeIntermediary.chooseStrategyDescription'
                : 'removeIntermediary.description',
              { count: presentation.dependentNames.length }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasDependents ? (
          <RadioGroup
            value={strategy}
            disabled={isPending || Boolean(error)}
            onValueChange={(value) =>
              setStrategy(value as 'promote-children' | 'remove-branch')
            }
            className="eb-gap-3"
          >
            <Label
              htmlFor="promote-intermediary-children"
              className="eb-flex eb-cursor-pointer eb-items-start eb-gap-3 eb-rounded-md eb-border eb-p-4 has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-accent/30"
            >
              <RadioGroupItem
                id="promote-intermediary-children"
                value="promote-children"
                className="eb-mt-0.5"
              />
              <IndentDecreaseIcon className="eb-size-5 eb-shrink-0" />
              <span>
                <span className="eb-block eb-text-sm eb-font-semibold">
                  {t('removeIntermediary.promoteTitle')}
                </span>
                <span className="eb-mt-1 eb-block eb-text-sm eb-leading-5 eb-text-muted-foreground">
                  {t('removeIntermediary.promoteDescription', {
                    count: presentation.directChildNames.length,
                    parentName: presentation.parentName,
                  })}
                </span>
              </span>
            </Label>
            <Label
              htmlFor="remove-intermediary-branch"
              className="eb-flex eb-cursor-pointer eb-items-start eb-gap-3 eb-rounded-md eb-border eb-border-destructive/40 eb-p-4 has-[[data-state=checked]]:eb-bg-destructive-accent"
            >
              <RadioGroupItem
                id="remove-intermediary-branch"
                value="remove-branch"
                className="eb-mt-0.5"
              />
              <Trash2Icon className="eb-size-5 eb-shrink-0 eb-text-destructive" />
              <span>
                <span className="eb-block eb-text-sm eb-font-semibold eb-text-destructive">
                  {t('removeIntermediary.removeBranchTitle')}
                </span>
                <span className="eb-mt-1 eb-block eb-text-sm eb-leading-5 eb-text-muted-foreground">
                  {t('removeIntermediary.removeBranchDescription', {
                    count: presentation.dependentNames.length,
                  })}
                </span>
                <span className="eb-mt-1 eb-block eb-text-xs eb-leading-5 eb-text-muted-foreground">
                  {t('removeIntermediary.removeBranchRolePreservation')}
                </span>
              </span>
            </Label>
          </RadioGroup>
        ) : null}
        {hasDependents ? (
          <div className="eb-rounded-md eb-border eb-bg-muted/20 eb-p-3">
            <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider">
              {t(
                strategy === 'promote-children'
                  ? 'removeIntermediary.resultingRelationships'
                  : 'removeIntermediary.affectedParties'
              )}
            </p>
            <ul className="eb-mt-2 eb-max-h-36 eb-space-y-1 eb-overflow-y-auto">
              {(strategy === 'promote-children'
                ? presentation.directChildNames
                : presentation.dependentNames
              ).map((dependentName, index) => (
                <li key={`${dependentName}-${index}`} className="eb-text-sm">
                  {strategy === 'promote-children'
                    ? t('removeIntermediary.promotedRelationship', {
                        name: dependentName,
                        parentName: presentation.parentName,
                      })
                    : dependentName}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? <ServerErrorAlert error={error as never} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('removeIntermediary.keep')}
          </AlertDialogCancel>
          <Button
            variant={strategy === 'remove-branch' ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={() => void onConfirm(strategy)}
          >
            {isPending ? <Loader2Icon className="eb-animate-spin" /> : null}
            {t(
              error
                ? 'ownershipEditor.retryRemaining'
                : hasDependents
                  ? strategy === 'promote-children'
                    ? 'removeIntermediary.promoteConfirm'
                    : presentation.isPendingAddition
                      ? 'removeIntermediary.discardBranchConfirm'
                      : 'removeIntermediary.removeBranchConfirm'
                  : 'removeIntermediary.confirm'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
