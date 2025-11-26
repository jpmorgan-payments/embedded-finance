import { useCallback, useState } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

export interface UseRecipientsDialogsReturn {
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isDetailsDialogOpen: boolean;
  selectedRecipient: Recipient | null;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  setIsCreateDialogOpen: (open: boolean) => void;
  openEditDialog: (recipient: Recipient) => void;
  closeEditDialog: () => void;
  openDetailsDialog: (recipient: Recipient) => void;
  closeDetailsDialog: () => void;
  setSelectedRecipient: (recipient: Recipient | null) => void;
}

/**
 * Hook for managing dialog state for create, edit, and details dialogs
 */
export function useRecipientsDialogs(): UseRecipientsDialogsReturn {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );

  const openCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const openEditDialog = useCallback((recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setIsEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedRecipient(null);
  }, []);

  const openDetailsDialog = useCallback((recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setIsDetailsDialogOpen(true);
  }, []);

  const closeDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedRecipient(null);
  }, []);

  return {
    isCreateDialogOpen,
    isEditDialogOpen,
    isDetailsDialogOpen,
    selectedRecipient,
    openCreateDialog,
    closeCreateDialog,
    setIsCreateDialogOpen,
    openEditDialog,
    closeEditDialog,
    openDetailsDialog,
    closeDetailsDialog,
    setSelectedRecipient,
  };
}
