import { Alert, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons';

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
        🚧 Preview Environment: Safe Testing Space. This environment is for UI
        testing, with interactions simulated locally. No data is transmitted or
        stored externally. Feel free to explore and test.
      </Text>
    </Alert>
  );
};
