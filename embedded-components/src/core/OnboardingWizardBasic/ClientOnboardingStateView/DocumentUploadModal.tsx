import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { DocumentUploadStepForm } from '../DocumentUploadStepForm/DocumentUploadStepForm';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyId?: string;
  title?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  partyId,
  title = 'Upload Required Documents',
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-max-h-[90vh] eb-max-w-4xl eb-overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="eb-text-xl eb-font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="eb-mt-4">
          <DocumentUploadStepForm
            standalone
            partyFilter={partyId}
            onComplete={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
