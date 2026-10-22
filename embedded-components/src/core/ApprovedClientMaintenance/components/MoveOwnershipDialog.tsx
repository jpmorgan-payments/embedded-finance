import { useLayoutEffect, useState } from 'react';
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

import {
  MaintenanceOwnershipPicker,
  MaintenanceOwnershipPickerMarker,
  type OwnershipPickerNode,
} from './MaintenanceOwnershipPicker';

export function MoveOwnershipDialog({
  open,
  partyName,
  partyKind,
  clientPartyId,
  currentParentPartyId,
  currentParentName,
  nodes,
  isPending,
  error,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  partyName: string;
  partyKind: 'person' | 'business';
  clientPartyId: string;
  currentParentPartyId: string;
  currentParentName: string;
  /** Your business and every business the party could connect through. */
  nodes: OwnershipPickerNode[];
  isPending: boolean;
  error?: unknown;
  onOpenChange: (open: boolean) => void;
  onConfirm: (destinationPartyId: string) => Promise<void>;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const [destinationPartyId, setDestinationPartyId] = useState('');

  useLayoutEffect(() => {
    if (open) setDestinationPartyId('');
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:eb-max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('ownershipEditor.moveTitle', { name: partyName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              currentParentPartyId === clientPartyId
                ? 'ownershipEditor.moveDescriptionDirect'
                : 'ownershipEditor.moveDescriptionIndirect',
              { name: partyName, currentParentName }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <MaintenanceOwnershipPicker
          label={tString('ownershipEditor.moveDestinationLabel')}
          rootPartyId={clientPartyId}
          nodes={nodes}
          value={destinationPartyId}
          disabled={isPending || Boolean(error)}
          onValueChange={setDestinationPartyId}
          className="eb-max-h-[min(24rem,50vh)] eb-overflow-y-auto eb-pr-1"
          getBranchStart={(partyId) => [
            ...(partyId === currentParentPartyId
              ? [
                  {
                    key: 'current-position',
                    content: (
                      <MaintenanceOwnershipPickerMarker
                        kind={partyKind}
                        name={partyName}
                        label={tString('ownershipEditor.moveCurrent')}
                        variant="current"
                        muted={Boolean(destinationPartyId)}
                      />
                    ),
                  },
                ]
              : []),
            ...(partyId === destinationPartyId
              ? [
                  {
                    key: 'new-position',
                    highlight: true,
                    content: (
                      <MaintenanceOwnershipPickerMarker
                        kind={partyKind}
                        name={partyName}
                        label={tString('ownershipEditor.moveResult')}
                        variant="new"
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
        {error ? <ServerErrorAlert error={error as never} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('ownershipEditor.cancel')}
          </AlertDialogCancel>
          <Button
            disabled={!destinationPartyId || isPending}
            onClick={() => void onConfirm(destinationPartyId)}
          >
            {isPending ? <Loader2Icon className="eb-animate-spin" /> : null}
            {t(
              error
                ? 'ownershipEditor.retryRemaining'
                : 'ownershipEditor.moveConfirm'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
