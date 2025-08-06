import { notifications } from '@mantine/notifications';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

export interface ClipboardThemeData {
  variables: EBThemeVariables;
}

export const importThemeFromClipboard =
  async (): Promise<EBThemeVariables | null> => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      // Read from clipboard
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        throw new Error('Clipboard is empty');
      }

      // Parse JSON
      const parsedData = JSON.parse(clipboardText) as ClipboardThemeData;

      // Validate structure
      if (!parsedData.variables || typeof parsedData.variables !== 'object') {
        throw new Error(
          'Invalid theme data structure. Expected { variables: { ... } }',
        );
      }

      // Return the variables object
      return parsedData.variables;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to import from clipboard';

      notifications.show({
        title: 'Import Failed',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
        withCloseButton: true,
      });

      return null;
    }
  };

export const validateThemeVariables = (
  variables: EBThemeVariables,
): boolean => {
  // Basic validation - check if it's an object
  if (!variables || typeof variables !== 'object') {
    return false;
  }

  // Check for at least one valid property
  const validProperties = Object.keys(variables).filter(
    (key) =>
      variables[key as keyof EBThemeVariables] !== undefined &&
      variables[key as keyof EBThemeVariables] !== null,
  );

  return validProperties.length > 0;
};
