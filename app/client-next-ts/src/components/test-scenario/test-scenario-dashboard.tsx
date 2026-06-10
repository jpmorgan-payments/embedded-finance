'use client';

import {
  Accounts,
  RecipientsWidget,
  TransactionsDisplay,
} from '@jpmorgan-payments/embedded-finance-components';

import { DatabaseResetUtils } from '@/lib/database-reset-utils';

import { TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID } from './test-scenario-naics-codes';

export type TestScenarioDashboardProps = {
  clientId: string;
  orgDisplayName: string;
  componentProps?: Record<string, unknown>;
};

export function TestScenarioDashboard({
  clientId,
  orgDisplayName,
  componentProps = {},
}: TestScenarioDashboardProps) {
  const accountsProps =
    (componentProps.accounts as Record<string, unknown> | undefined) ?? {};
  const recipientsProps =
    (componentProps.recipients as Record<string, unknown> | undefined) ?? {};
  const transactionsProps =
    (componentProps.transactions as Record<string, unknown> | undefined) ?? {};
  const accountIds = (componentProps.accountIds as string[] | undefined) ?? [
    TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID,
  ];
  const handleDataSettled = () => {
    setTimeout(() => {
      DatabaseResetUtils.emulateTabSwitch();
    }, 500);
  };

  const handlePaymentSettled = () => {
    setTimeout(() => {
      DatabaseResetUtils.emulateTabSwitch();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">
          Payments account dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Approved client view for {orgDisplayName} — accounts, recipients, and
          transaction history.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Accounts
          </h3>
          <Accounts
            allowedCategories={['LIMITED_DDA_PAYMENTS']}
            clientId={clientId}
            {...accountsProps}
          />
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Recipients
          </h3>
          <RecipientsWidget
            mode="list"
            viewMode="compact-cards"
            onRecipientAdded={handleDataSettled}
            onPaymentComplete={handlePaymentSettled}
            {...recipientsProps}
          />
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Transactions
          </h3>
          <TransactionsDisplay accountIds={accountIds} {...transactionsProps} />
        </section>
      </div>
    </div>
  );
}
