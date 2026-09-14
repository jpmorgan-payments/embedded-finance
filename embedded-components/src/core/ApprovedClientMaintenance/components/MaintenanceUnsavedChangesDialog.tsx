import { useTranslationWithTokens } from '@/i18n';
import { Undo2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui';

export function MaintenanceUnsavedChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onKeepEditing()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('formExit.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('formExit.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('formExit.keepEditing')}</AlertDialogCancel>
          <Button variant="destructive" onClick={onDiscard}>
            <Undo2Icon />
            {t('formExit.discard')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
