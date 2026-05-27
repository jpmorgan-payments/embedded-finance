/**
 * BankAccountForm — linked-account payment method configuration
 *
 * Rows are driven only by `config.paymentMethods.available`: types not listed are **omitted**
 * from the UI (not shown as disabled). When a method is `locked` in `paymentMethods.configs`,
 * it stays selected and its checkbox is **disabled** (linked-account ACH default).
 */

import { useMemo } from 'react';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { ClientStatus } from '@/api/generated/smbdo.schemas';

import {
  BankAccountForm,
  createCustomConfig,
  useLinkedAccountConfig,
  type BankAccountFormConfig,
} from '../components/BankAccountForm';

const storyClient: ClientResponse = {
  ...efClientCorpEBMock,
  id: 'bank-form-pm-story-client',
  status: ClientStatus.APPROVED,
};

function LinkedAccountBankFormPaymentMethodsDemo({
  override,
}: {
  override?: Partial<BankAccountFormConfig>;
}) {
  const base = useLinkedAccountConfig();
  const config = useMemo(
    () => (override ? createCustomConfig(base, override) : base),
    [base, override]
  );

  return (
    <div className="eb-mx-auto eb-max-w-2xl eb-p-4">
      <BankAccountForm
        client={storyClient}
        config={config}
        embedded
        showCard
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
}

const meta = {
  title: 'Core/BankAccountForm/Linked account payment methods',
  component: LinkedAccountBankFormPaymentMethodsDemo,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Illustrates `paymentMethods.available` and `allowMultiple` on top of `useLinkedAccountConfig`. Methods outside `available` are not rendered.',
      },
    },
  },
  args: {
    override: undefined,
  },
  argTypes: {
    override: { control: false },
  },
  render: (args) => (
    <LinkedAccountBankFormPaymentMethodsDemo override={args.override} />
  ),
} satisfies Meta<typeof LinkedAccountBankFormPaymentMethodsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default linked-account config: ACH only, checkbox disabled (locked). */
export const DefaultAchOnlyOthersHidden: Story = {
  name: 'ACH only (others hidden)',
  args: { override: undefined },
};

/** Extra methods appear when added to `available`; ACH remains locked from the base config. */
export const AchWireRtpMultiLockedAch: Story = {
  name: 'ACH + WIRE + RTP (multi-select, ACH locked)',
  args: {
    override: {
      paymentMethods: {
        available: ['ACH', 'WIRE', 'RTP'],
        allowMultiple: true,
        defaultSelected: ['ACH'],
      },
    } as unknown as Partial<BankAccountFormConfig>,
  },
};

export const AchWireSingleSelect: Story = {
  name: 'ACH + WIRE (single select)',
  args: {
    override: {
      paymentMethods: {
        available: ['ACH', 'WIRE'],
        allowMultiple: false,
        defaultSelected: ['ACH'],
      },
    } as unknown as Partial<BankAccountFormConfig>,
  },
};

/** No ACH row when ACH is not in `available`. */
export const WireRtpOnly: Story = {
  name: 'WIRE + RTP only',
  args: {
    override: {
      paymentMethods: {
        available: ['WIRE', 'RTP'],
        allowMultiple: true,
        defaultSelected: ['WIRE'],
      },
    } as unknown as Partial<BankAccountFormConfig>,
  },
};
