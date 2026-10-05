import { useLayoutEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  Loader2Icon,
  PackageIcon,
  PencilLineIcon,
  Undo2Icon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
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

import { useFieldChangeValueFormatter } from '../hooks/useFieldChangeValueFormatter';
import { useMaintenancePartyCaption } from '../hooks/useMaintenancePartyCaption';
import type { MaintenanceUpdateScope } from '../hooks/useMaintenanceRequestSummary';
import type {
  MaintenanceDiscardContent,
  MaintenanceDiscardEntry,
} from '../utils/buildMaintenanceDiscardContent';
import { getMaintenancePartyIdentity } from '../utils/maintenanceDisplay';

type CancelMaintenanceDialogProps = {
  open: boolean;
  content?: MaintenanceDiscardContent;
  updateScope: MaintenanceUpdateScope;
  clientPartyId?: string;
  error?: unknown;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

function DiscardGroup({
  groupId,
  title,
  Icon,
  iconClassName,
  items,
}: {
  groupId: string;
  title: string;
  Icon: LucideIcon;
  iconClassName: string;
  items: Array<{ id: string; name: string; detail: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <section data-discard-group={groupId}>
      <h3 className="eb-mb-1.5 eb-flex eb-items-center eb-gap-1.5 eb-text-sm eb-font-semibold">
        <Icon aria-hidden className={cn('eb-size-4', iconClassName)} />
        {title}
        <span className="eb-font-normal eb-tabular-nums eb-text-muted-foreground">
          {items.length}
        </span>
      </h3>
      <ul className="eb-divide-y eb-rounded-md eb-border">
        {items.map((item) => (
          <li key={item.id} className="eb-px-3 eb-py-2">
            <p className="eb-text-sm eb-font-medium">{item.name}</p>
            <p className="eb-text-xs eb-text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CancelMaintenanceDialog({
  open,
  content,
  updateScope,
  clientPartyId,
  error,
  isPending,
  onOpenChange,
  onConfirm,
}: CancelMaintenanceDialogProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const describeParty = useMaintenancePartyCaption(clientPartyId);
  const formatValue = useFieldChangeValueFormatter();
  const [localError, setLocalError] = useState<unknown>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [presentation, setPresentation] = useState(content);

  useLayoutEffect(() => {
    if (open) setPresentation(content);
    // Snapshot only when a new open cycle starts; live refetches must not
    // replace dialog content during its open or exit animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const displayed = presentation ?? content;
  if (!displayed) return null;

  const notProvided = tString('notProvided');
  // i18n codes (enUS) are not BCP 47 tags; Intl needs en-US.
  const locale =
    i18n.resolvedLanguage === 'esUS'
      ? 'es-US'
      : i18n.resolvedLanguage === 'frCA'
        ? 'fr-CA'
        : 'en-US';
  const listFormat = new Intl.ListFormat(locale, {
    type: 'conjunction',
  });
  const getName = (entry: MaintenanceDiscardEntry) =>
    getMaintenancePartyIdentity(entry.party, entry.change, notProvided)
      .displayName;
  const getRoles = (entry: MaintenanceDiscardEntry) =>
    entry.isOrganization
      ? tString('organization')
      : describeParty(entry.proposedParty);
  const getFieldLabels = (entry: MaintenanceDiscardEntry) =>
    listFormat.format(
      entry.fieldChanges.map((change) =>
        tString([change.labelKey] as unknown as TemplateStringsArray)
      )
    );

  const isRemoval = displayed.kind === 'removal';
  const isReplacement = displayed.kind === 'controller-replacement';
  const isBusy = isPending || isConfirming;
  const singleEntry = 'entry' in displayed ? displayed.entry : undefined;
  const name = singleEntry ? getName(singleEntry) : '';
  const isBusiness = singleEntry?.entityKind === 'business';
  const keyBase = isReplacement ? 'controllerReplacement' : displayed.kind;
  // After the discard the approved name is what remains.
  const getApprovedName = (entry: MaintenanceDiscardEntry) =>
    getMaintenancePartyIdentity(entry.party, undefined, notProvided)
      .displayName;

  const title =
    displayed.kind === 'all'
      ? t([
          `cancel.all.title.${updateScope}`,
        ] as unknown as TemplateStringsArray)
      : displayed.kind === 'controller-replacement'
        ? t('cancel.controllerReplacement.title', {
            name: getApprovedName(displayed.outgoing),
          })
        : t(
            [
              `cancel.${displayed.kind}.title`,
            ] as unknown as TemplateStringsArray,
            { name }
          );
  const description =
    displayed.kind === 'all'
      ? t('cancel.all.description')
      : displayed.kind === 'controller-replacement'
        ? t(
            displayed.incomingIsAddition
              ? 'cancel.controllerReplacement.additionDescription'
              : 'cancel.controllerReplacement.editDescription',
            {
              outgoing: getApprovedName(displayed.outgoing),
              incoming: getName(displayed.incoming),
            }
          )
        : displayed.kind === 'edit'
          ? t('cancel.edit.description', {
              name: getApprovedName(displayed.entry),
            })
          : t(
              [
                `cancel.${displayed.kind}.${isBusiness ? 'business' : 'person'}Description`,
              ] as unknown as TemplateStringsArray,
              { name, roles: getRoles(displayed.entry) }
            );

  const confirm = async () => {
    setLocalError(undefined);
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (nextError) {
      setLocalError(nextError);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isBusy) {
          setLocalError(undefined);
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent data-discard-kind={displayed.kind}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {displayed.kind !== 'all' && displayed.hasOtherChanges
              ? ` ${tString('cancel.otherChangesStay')}`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {displayed.kind === 'all' ? (
          <div className="eb-max-h-72 eb-space-y-4 eb-overflow-y-auto">
            <DiscardGroup
              groupId="product"
              title={tString('submission.productTitle')}
              Icon={PackageIcon}
              iconClassName="eb-text-informative"
              items={displayed.products.map((change) => ({
                id: `${change.product}-${change.subProduct ?? ''}`,
                name: tString(
                  [
                    `common:subProducts.${change.subProduct ?? ''}`,
                    `common:products.${change.product}`,
                  ] as unknown as TemplateStringsArray,
                  { defaultValue: change.subProduct ?? change.product }
                ),
                detail: tString('submission.subProductOf', {
                  product: tString(
                    [
                      `common:products.${change.product}`,
                    ] as unknown as TemplateStringsArray,
                    { defaultValue: change.product }
                  ),
                }),
              }))}
            />
            <DiscardGroup
              groupId="added"
              title={tString('submission.groups.added')}
              Icon={CirclePlusIcon}
              iconClassName="eb-text-informative"
              items={displayed.added.map((entry) => ({
                id: entry.id,
                name: getName(entry),
                detail: getRoles(entry),
              }))}
            />
            <DiscardGroup
              groupId="updated"
              title={tString('submission.groups.updated')}
              Icon={PencilLineIcon}
              iconClassName="eb-text-muted-foreground"
              items={displayed.updated.map((entry) => ({
                id: entry.id,
                name: getName(entry),
                detail: getFieldLabels(entry),
              }))}
            />
            <DiscardGroup
              groupId="removed"
              title={tString('submission.groups.removed')}
              Icon={CircleMinusIcon}
              iconClassName="eb-text-destructive"
              items={displayed.removed.map((entry) => ({
                id: entry.id,
                name: getName(entry),
                detail: getRoles(entry),
              }))}
            />
          </div>
        ) : displayed.kind === 'edit' &&
          displayed.entry.fieldChanges.length > 0 ? (
          <dl
            data-discard-changes=""
            className="eb-max-h-72 eb-divide-y eb-overflow-y-auto eb-rounded-md eb-border"
          >
            {displayed.entry.fieldChanges.map((change) => {
              const from = formatValue(change, 'approved') || notProvided;
              const to = formatValue(change, 'proposed') || notProvided;
              return (
                <div key={change.field} className="eb-px-3 eb-py-2">
                  <dt className="eb-text-xs eb-text-muted-foreground">
                    {t([change.labelKey] as unknown as TemplateStringsArray)}
                  </dt>
                  <dd className="eb-mt-0.5 eb-break-words eb-text-sm">
                    <span className="eb-sr-only">
                      {t('changes.currentProfile')}:{' '}
                    </span>
                    <span className="eb-text-muted-foreground">{from}</span>
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="eb-mx-1.5 eb-inline eb-size-3.5 eb-align-[-2px] eb-text-muted-foreground"
                    />
                    <span className="eb-sr-only">
                      {t('changes.draftUpdate')}:{' '}
                    </span>
                    <span className="eb-font-medium">{to}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : displayed.kind === 'controller-replacement' ? (
          <p
            data-discard-reason=""
            className="eb-rounded-md eb-border eb-bg-muted/30 eb-px-3 eb-py-2 eb-text-sm"
          >
            {t('cancel.controllerReplacement.reason')}
          </p>
        ) : null}

        {isRemoval ? null : (
          <p className="eb-text-sm eb-text-muted-foreground">
            {t('cancel.cannotUndo')}
          </p>
        )}

        {error || localError ? (
          <ServerErrorAlert error={(error ?? localError) as never} />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>
            {t([`cancel.${keyBase}.keep`] as unknown as TemplateStringsArray)}
          </AlertDialogCancel>
          {/* Restoring a party or a controller is not styled as destructive. */}
          <Button
            variant={isRemoval || isReplacement ? 'default' : 'destructive'}
            onClick={confirm}
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2Icon className="eb-animate-spin" />
            ) : (
              <Undo2Icon />
            )}
            {displayed.kind === 'all'
              ? t('cancel.cancelAll')
              : isReplacement
                ? t('cancel.controllerReplacement.confirm')
                : displayed.kind === 'addition'
                  ? t('pendingAddition.discard')
                  : isRemoval
                    ? t('pendingRemoval.cancel')
                    : t('cancel.discardChanges')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
