import { useLayoutEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowRightIcon, Building2Icon, Loader2Icon } from 'lucide-react';

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

export type OwnershipDestination = {
  partyId: string;
  name: string;
  path: string;
  depth: number;
};

export function MoveOwnershipDialog({
  open,
  partyName,
  currentParentName,
  currentParentIsClient,
  destinations,
  isPending,
  error,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  partyName: string;
  currentParentName: string;
  currentParentIsClient: boolean;
  destinations: OwnershipDestination[];
  isPending: boolean;
  error?: unknown;
  onOpenChange: (open: boolean) => void;
  onConfirm: (destinationPartyId: string) => Promise<void>;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const [destinationPartyId, setDestinationPartyId] = useState('');

  useLayoutEffect(() => {
    if (open) setDestinationPartyId('');
  }, [open]);

  const destination = destinations.find(
    (candidate) => candidate.partyId === destinationPartyId
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('ownershipEditor.moveTitle', { name: partyName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              currentParentIsClient
                ? 'ownershipEditor.moveDescriptionDirect'
                : 'ownershipEditor.moveDescriptionIndirect',
              {
                name: partyName,
                currentParentName,
              }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RadioGroup
          value={destinationPartyId}
          disabled={isPending || Boolean(error)}
          onValueChange={setDestinationPartyId}
          className="eb-max-h-64 eb-gap-2 eb-overflow-y-auto"
        >
          {destinations.map((candidate) => (
            <Label
              key={candidate.partyId}
              htmlFor={`ownership-destination-${candidate.partyId}`}
              className="eb-flex eb-cursor-pointer eb-items-center eb-gap-3 eb-rounded-md eb-border eb-px-3 eb-py-3 has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-accent/30"
              style={{ marginInlineStart: Math.min(candidate.depth, 3) * 12 }}
            >
              <RadioGroupItem
                id={`ownership-destination-${candidate.partyId}`}
                value={candidate.partyId}
                aria-label={candidate.name}
              />
              <Building2Icon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
              <span className="eb-min-w-0">
                <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
                  {candidate.name}
                </span>
                <span className="eb-mt-0.5 eb-block eb-truncate eb-text-xs eb-text-muted-foreground">
                  {candidate.path}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
        {destination ? (
          <div className="eb-flex eb-items-center eb-gap-2 eb-rounded-md eb-bg-muted/30 eb-p-3 eb-text-sm">
            <span className="eb-font-medium">{partyName}</span>
            <ArrowRightIcon className="eb-size-4 eb-shrink-0" />
            <span>{destination.name}</span>
          </div>
        ) : null}
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
