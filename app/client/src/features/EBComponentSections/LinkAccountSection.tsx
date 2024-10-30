import { Text, Badge } from '@mantine/core';
import { Panel, ComponentSamplePanel } from 'components';
import {
  LinkedAccountWidget,
  EBComponentsProvider,
} from '@jpmorgan-payments/embedded-finance-components';

const componentSample = (
  <EBComponentsProvider apiBaseUrl="">
    <LinkedAccountWidget />
  </EBComponentsProvider>
);

const codeSample = `

import { LinkedAccountWidget } from "@jpmorgan-payments/embedded-finance-components"

<LinkedAccountWidget/>
`;

export const LinkAccountSection = () => {
  return (
    <Panel
      title={'Link Account'}
      customBadge={
        <Badge variant="filled" color="jpmc" radius="xs">
          Component
        </Badge>
      }
    >
      <Text mb="md"> This component allows you to link an account</Text>
      <ComponentSamplePanel
        component={componentSample}
        code={`${codeSample}`}
      />
    </Panel>
  );
};
