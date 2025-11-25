import React, { useMemo } from 'react';

import type { UpdateRecipientRequest } from '@/api/generated/ep-recipients.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BankAccountForm,
  transformBankAccountFormToRecipientPayload,
  useRecipientConfig,
  useRecipientEditConfig,
  type BankAccountFormConfig,
  type BankAccountFormData,
} from '@/components/BankAccountForm';

import type { RecipientFormProps } from './RecipientForm.types';

/**
 * RecipientForm - Wrapper around BankAccountForm for recipient management
 *
 * This component uses the shared BankAccountForm with recipient-specific configuration.
 * It handles both create and edit modes for payment recipients.
 */
export const RecipientForm: React.FC<RecipientFormProps> = ({
  mode,
  recipient,
  onSubmit,
  onCancel,
  isLoading = false,
  showCardWrapper = true,
}) => {
  // Get the appropriate configuration based on mode
  const createConfig = useRecipientConfig();
  const editConfig = useRecipientEditConfig();
  const defaultConfig = mode === 'create' ? createConfig : editConfig;

  // Use the configuration hook to get properly configured form
  const formConfig: BankAccountFormConfig = useMemo(
    () => ({
      ...defaultConfig,
      // Override content based on mode
      content: {
        ...defaultConfig.content,
        title: mode === 'create' ? 'Create New Recipient' : 'Edit Recipient',
        submitButtonText:
          mode === 'create' ? 'Create Recipient' : 'Update Recipient',
      },
    }),
    [defaultConfig, mode]
  );

  // Handle form submission
  const handleSubmit = (data: BankAccountFormData) => {
    // Always use 'RECIPIENT' type since this component is specifically for recipients
    const payload = transformBankAccountFormToRecipientPayload(
      data,
      'RECIPIENT'
    );

    if (mode === 'create') {
      onSubmit(payload);
    } else {
      onSubmit(payload as UpdateRecipientRequest);
    }
  };

  // Render with or without Card wrapper
  if (showCardWrapper) {
    return (
      <Card className="eb-mx-auto eb-w-full eb-max-w-4xl">
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create New Recipient' : 'Edit Recipient'}
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-scrollable-content eb-max-h-[70vh] eb-overflow-y-auto">
          <BankAccountForm
            config={formConfig}
            recipient={recipient}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isLoading={isLoading}
            showCard={false}
          />
        </CardContent>
      </Card>
    );
  }

  // Render just the form content for dialog usage
  return (
    <BankAccountForm
      config={formConfig}
      recipient={recipient}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      showCard={false}
    />
  );
};
