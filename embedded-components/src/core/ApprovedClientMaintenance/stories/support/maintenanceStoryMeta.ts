import { createElement } from 'react';
import type { Decorator, Meta } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import { ApprovedClientMaintenance } from '../../ApprovedClientMaintenance';
import type { ApprovedClientMaintenanceProps } from '../../ApprovedClientMaintenance.types';
import { FULL_ELIGIBILITY } from './maintenanceStoryClients';
import {
  createMaintenanceStoryHandlers,
  STORY_CLIENT_ID,
  type MaintenanceStoryScenario,
} from './maintenanceStoryHandlers';

export type MaintenanceStoryArgs = ApprovedClientMaintenanceProps &
  BaseStoryArgs;

// Well past the five-minute gate, so the product upgrade is available.
export const SETTLED_VERIFICATION_TIME = '2026-08-26T11:50:00.000Z';

export const maintenanceStoryDecorator: Decorator = (Story) =>
  createElement(
    'div',
    { className: 'eb-mx-auto eb-w-full eb-max-w-[1200px]' },
    createElement(Story)
  );

export const maintenanceStoryArgs: Partial<MaintenanceStoryArgs> = {
  clientId: STORY_CLIENT_ID,
  eligibility: FULL_ELIGIBILITY,
  initialProductVerificationAcceptedAt: SETTLED_VERIFICATION_TIME,
};

export const maintenanceStoryArgTypes = {
  eligibility: {
    control: { type: 'object' },
    description:
      'Country and legal entity rules. Each operation unlocks one kind of change; missing operations hide their controls.',
    table: { category: 'Maintenance' },
  },
  initialProductVerificationAcceptedAt: {
    control: { type: 'text' },
    description:
      'When the original product verification was accepted. The product upgrade opens five minutes later.',
    table: { category: 'Maintenance' },
  },
} as const;

/** MSW parameters for a mocked scenario; each story keeps its own state. */
export const withScenario = (scenario: MaintenanceStoryScenario) => ({
  msw: { handlers: createMaintenanceStoryHandlers(scenario) },
});

/** Everything a maintenance story file shares except its `title`. */
export const maintenanceStoryMetaBase = {
  component: ApprovedClientMaintenance,
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: maintenanceStoryArgs,
  argTypes: maintenanceStoryArgTypes,
  render: (args) => createElement(ApprovedClientMaintenance, args),
} satisfies Omit<Meta<MaintenanceStoryArgs>, 'title'>;
