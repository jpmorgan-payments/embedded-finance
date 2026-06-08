'use client';

import {
  Accounts,
  LinkedAccountWidget,
  PaymentFlow,
  RecipientsWidget,
  TransactionsDisplay,
} from '@jpmorgan-payments/embedded-finance-components';

import { Button } from '@/components/ui/button';
import { DatabaseResetUtils } from '@/lib/database-reset-utils';

import { TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID } from './test-scenario-naics-codes';

export type TestScenarioDashboardProps = {
  clientId: string;
  orgDisplayName: string;
};

export function TestScenarioDashboard({
  clientId,
  orgDisplayName,
}: TestScenarioDashboardProps) {
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
          Seller wallet dashboard
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Approved client view for {orgDisplayName} — accounts, linked accounts,
          payments, recipients, and transaction history.
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
          />
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Linked bank accounts
          </h3>
          <LinkedAccountWidget
            mode="list"
            viewMode="cards"
            onAccountLinked={handleDataSettled}
            onPaymentComplete={handlePaymentSettled}
          />
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Make payment
          </h3>
          <PaymentFlow
            initialAccountId={TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID}
            onTransactionComplete={handlePaymentSettled}
            trigger={<Button>Make payment</Button>}
          />
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Recipients
          </h3>
          <RecipientsWidget
            mode="list"
            viewMode="table"
            onRecipientAdded={handleDataSettled}
            onPaymentComplete={handlePaymentSettled}
          />
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Transactions
          </h3>
          <TransactionsDisplay
            accountIds={[TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID]}
          />
        </section>
      </div>
    </div>
  );
}
