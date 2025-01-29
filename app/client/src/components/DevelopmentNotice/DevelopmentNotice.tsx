import { Alert, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export const DevelopmentNotice = () => {
  return (
    <Alert
      variant="light"
      color="yellow"
      title="Development Version Notice"
      icon={<IconAlertTriangle size={16} />}
      mb="md"
    >
      <Text size="sm">
        This is a preview version under active development. All data and API
        interactions are simulated using local mock services.
      </Text>
    </Alert>
  );
};
