import { Text, Box } from '@mantine/core';
import { Panel } from 'components';
import { Prism } from '@mantine/prism';

export const InstallationSection = () => {
  return (
    <Panel title="Installation">
      <Text size="md" mb="sm">
        To get started, run the following npm command
      </Text>
      <Box style={{ maxWidth: 600 }}>
        <Prism language={'javascript'}>
          npm i @jpmorgan-payments/embedded-finance-components
        </Prism>
      </Box>
    </Panel>
  );
};
