/**
 * OnboardingFlow — link-account step with alternate `paymentMethods` sets
 *
 * Uses `linkAccountStepOptions.bankFormConfigOverride` (merged with `useLinkedAccountConfig` in
 * `LinkAccountScreen`). Opens directly on the link step (`flowEntry`) for quick visual QA.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BankAccountFormConfig } from '@/core/RecipientWidgets/components/BankAccountForm';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  buildApprovedClientLinkAccountStory,
  commonArgsWithCallbacks,
  commonArgTypes,
  OnboardingFlowTemplate,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const baseLinkStepDocs =
  'Only types in `paymentMethods.available` render. Locked ACH keeps a disabled checkbox when present.';

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/Payment methods',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@linked-accounts'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

function linkAccountPaymentMethodsStory(options: {
  name: string;
  description: string;
  bankFormConfigOverride?: Partial<BankAccountFormConfig>;
}): Story {
  const { name, description, bankFormConfigOverride } = options;
  const built = buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      initialValues: {},
      completionMode: 'editable',
      ...(bankFormConfigOverride !== undefined
        ? { bankFormConfigOverride }
        : {}),
    },
  });
  return {
    name,
    loaders: built.loaders,
    parameters: {
      ...built.parameters,
      docs: {
        description: {
          story: `${description} ${baseLinkStepDocs}`,
        },
      },
    },
    args: {
      ...built.args,
      flowEntry: { screenId: 'link-account' },
    },
  };
}

export const LinkStep_DefaultAchOnly: Story = linkAccountPaymentMethodsStory({
  name: 'Editable — default ACH only',
  description:
    'No override: same payment rows as production linked-account config (ACH only, locked).',
});

export const LinkStep_AchWireRtpMulti: Story = linkAccountPaymentMethodsStory({
  name: 'Editable — ACH + WIRE + RTP (multi)',
  description:
    'Host override exposes three methods; ACH stays locked from the base linked-account config.',
  bankFormConfigOverride: {
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      allowMultiple: true,
      defaultSelected: ['ACH'],
    },
  } as unknown as Partial<BankAccountFormConfig>,
});

export const LinkStep_WireRtpOnly: Story = linkAccountPaymentMethodsStory({
  name: 'Editable — WIRE + RTP only',
  description: 'ACH is omitted from `available`, so no ACH checkbox is shown.',
  bankFormConfigOverride: {
    paymentMethods: {
      available: ['WIRE', 'RTP'],
      allowMultiple: true,
      defaultSelected: ['WIRE'],
    },
  } as unknown as Partial<BankAccountFormConfig>,
});
