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
        🚧 Preview Environment: Safe Testing Space This is a development preview
        environment designed for UI testing. All interactions are simulated
        locally in your browser - no data is transmitted or stored on any
        external servers. Feel free to explore and test with sample information.
      </Text>
    </Alert>
  );
};
