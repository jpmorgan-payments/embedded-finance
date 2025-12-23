'use client';

import { useEffect, useRef, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CodeExamplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: string;
}

export function CodeExamplesModal({
  open,
  onOpenChange,
  componentId,
}: CodeExamplesModalProps) {
  const [selectedStep, setSelectedStep] = useState<string>('provider');
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted lines when step changes
  useEffect(() => {
    if (codeContainerRef.current && selectedStep) {
      const example = getCodeExample(componentId);
      const selectedStepData = example.steps.find(
        (step) => step.id === selectedStep
      );
      const [startLine] = selectedStepData?.lineRange || [0, 0];

      // Find the line element and scroll to it
      const lineElements =
        codeContainerRef.current.querySelectorAll('div[data-line]');
      const targetLine = Array.from(lineElements).find((el) => {
        const lineNumber = parseInt(el.getAttribute('data-line') || '0');
        return lineNumber === startLine;
      });

      if (targetLine) {
        targetLine.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [selectedStep, componentId]);

  const getCodeExample = (componentId: string) => {
    const examples = {
      onboarding: {
        title: 'OnboardingFlow Component',
        description: 'Complete client onboarding with KYC/KYB verification',
        code: `import {
  EBComponentsProvider,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';

function OnboardingSection() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      headers={{
        'token': 'idp-jwt-token',
      }}
      queryParams={{
        'custom-param': 'value',
        'version': 'v1',
      }}
      theme={{
        variables: {
          primaryColor: '#2563eb',
          backgroundColor: '#ffffff',
        },
      }}
      contentTokens={{
        name: 'enUS',
        buttonLabels: {
          submit: 'Submit Application',
          continue: 'Continue',
          cancel: 'Cancel',
        },
        formLabels: {
          firstName: 'First Name',
          email: 'Email Address',
        },
        messages: {
          loading: 'Processing your application...',
          success: 'Application submitted successfully!',
        },
      }}
    >
      <OnboardingFlow
        availableProducts={['EMBEDDED_PAYMENTS']}
        availableJurisdictions={['US']}
        height="100vh"
        onPostClientSettled={(response, error) => {
          console.log('Client created:', response);
        }}
        docUploadOnlyMode={false}
        alertOnExit={true}
      />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [8, 9],
          },
          {
            id: 'headers',
            title: 'Authentication & Headers',
            description: 'JWT token for authentication',
            lineRange: [10, 12],
          },
          {
            id: 'queryParams',
            title: 'Query Parameters',
            description: 'Custom query parameters for API requests',
            lineRange: [13, 16],
          },
          {
            id: 'theme',
            title: 'Theme Configuration',
            description: 'Design tokens and color schemes',
            lineRange: [17, 22],
          },
          {
            id: 'contentTokens',
            title: 'Content Tokens',
            description: 'Button labels, form labels, and messages',
            lineRange: [23, 38],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Component-specific configuration',
            lineRange: [40, 48],
          },
        ],
      },
      'link-account': {
        title: 'LinkedAccountWidget Component',
        description:
          'Link external bank accounts with microdeposits verification',
        code: `import {
  EBComponentsProvider,
  LinkedAccountWidget,
} from '@jpmorgan-payments/embedded-finance-components';

function LinkedAccountSection() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      headers={{
        'token': 'idp-jwt-token',
      }}
      theme={{
        variables: {
          primaryColor: '#059669',
          secondaryColor: 'transparent',
        },
      }}
      contentTokens={{
        name: 'enUS',
        buttonLabels: {
          linkAccount: 'Link Bank Account',
          verifyAccount: 'Verify Account',
        },
        formLabels: {
          accountNumber: 'Account Number',
          routingNumber: 'Routing Number',
        },
        messages: {
          linkingAccount: 'Linking your account...',
          accountLinked: 'Account linked successfully!',
        },
      }}
    >
      <LinkedAccountWidget
        variant="default"
        showCreateButton={true}
        onLinkedAccountSettled={(recipient, error) => {
          console.log('Linked account created:', recipient);
        }}
      />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [8, 9],
          },
          {
            id: 'headers',
            title: 'Authentication & Headers',
            description: 'JWT token for authentication',
            lineRange: [10, 12],
          },
          {
            id: 'theme',
            title: 'Theme Configuration',
            description: 'Design tokens for component styling',
            lineRange: [13, 18],
          },
          {
            id: 'contentTokens',
            title: 'Content Tokens',
            description: 'Button labels, form labels, and messages',
            lineRange: [19, 33],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Widget-specific configuration',
            lineRange: [35, 41],
          },
        ],
      },
      recipients: {
        title: 'Recipients Component',
        description: 'Manage payment recipients with multiple payment methods',
        code: `import {
  EBComponentsProvider,
  Recipients,
} from '@jpmorgan-payments/embedded-finance-components';

function RecipientsSection() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      headers={{
        'token': 'idp-jwt-token',
      }}
      theme={{
        variables: {
          primaryColor: '#7c3aed',
          borderRadius: '0.375rem',
        },
      }}
      contentTokens={{
        name: 'enUS',
        buttonLabels: {
          addRecipient: 'Add Recipient',
          saveRecipient: 'Save Recipient',
        },
        formLabels: {
          recipientName: 'Recipient Name',
          email: 'Email Address',
        },
        messages: {
          recipientAdded: 'Recipient added successfully!',
          recipientUpdated: 'Recipient updated successfully!',
        },
      }}
    >
      <Recipients
        clientId="your-client-id"
        initialRecipientType="RECIPIENT"
        showCreateButton={true}
        onRecipientCreated={(recipient) => {
          console.log('Recipient created:', recipient);
        }}
      />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [8, 9],
          },
          {
            id: 'headers',
            title: 'Authentication & Headers',
            description: 'JWT token for authentication',
            lineRange: [10, 12],
          },
          {
            id: 'theme',
            title: 'Theme Configuration',
            description: 'Design tokens for component styling',
            lineRange: [13, 18],
          },
          {
            id: 'contentTokens',
            title: 'Content Tokens',
            description: 'Button labels, form labels, and messages',
            lineRange: [19, 33],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Recipients-specific configuration',
            lineRange: [35, 42],
          },
        ],
      },
      transactions: {
        title: 'TransactionsDisplay Component',
        description: 'View transaction history with filtering and sorting',
        code: `import {
  EBComponentsProvider,
  TransactionsDisplay,
} from '@jpmorgan-payments/embedded-finance-components';

function TransactionsSection() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      headers={{
        'token': 'idp-jwt-token',
      }}
      theme={{
        variables: {
          primaryColor: '#dc2626',
          cardColor: '#fef2f2',
        },
      }}
      contentTokens={{
        name: 'enUS',
        buttonLabels: {
          filter: 'Filter Transactions',
          export: 'Export',
        },
        tableHeaders: {
          date: 'Date',
          amount: 'Amount',
        },
        messages: {
          noTransactions: 'No transactions found',
          loadingTransactions: 'Loading transactions...',
        },
      }}
    >
      <TransactionsDisplay 
        accountId="your-account-id" 
      />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [8, 9],
          },
          {
            id: 'headers',
            title: 'Authentication & Headers',
            description: 'JWT token for authentication',
            lineRange: [10, 12],
          },
          {
            id: 'theme',
            title: 'Theme Configuration',
            description: 'Design tokens for component styling',
            lineRange: [13, 18],
          },
          {
            id: 'contentTokens',
            title: 'Content Tokens',
            description: 'Button labels, table headers, and messages',
            lineRange: [19, 33],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Transactions-specific configuration',
            lineRange: [35, 37],
          },
        ],
      },
      payments: {
        title: 'MakePayment Component',
        description: 'Initiate payments with multiple payment methods',
        code: `import {
  EBComponentsProvider,
  MakePayment,
} from '@jpmorgan-payments/embedded-finance-components';

function PaymentSection() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      headers={{
        'token': 'idp-jwt-token',
      }}
      theme={{
        variables: {
          primaryColor: '#059669',
          successColor: '#10b981',
        },
      }}
      contentTokens={{
        name: 'enUS',
        buttonLabels: {
          sendPayment: 'Send Payment',
          confirmPayment: 'Confirm Payment',
        },
        formLabels: {
          amount: 'Payment Amount',
          recipient: 'Recipient',
        },
        messages: {
          paymentProcessing: 'Processing your payment...',
          paymentSuccess: 'Payment sent successfully!',
        },
      }}
    >
      <MakePayment
        triggerButtonVariant="link"
        accounts={[
          { id: 'account1', name: 'Main Account' },
          { id: 'account2', name: 'Savings Account' },
        ]}
        recipients={[
          {
            id: 'recipient1',
            name: 'John Doe',
            accountNumber: '****1234',
          },
        ]}
        paymentMethods={[
          { id: 'ACH', name: 'ACH Transfer', fee: 2.5 },
          { id: 'WIRE', name: 'Wire Transfer', fee: 25.0 },
        ]}
        onTransactionSettled={(response, error) => {
          if (response) {
            console.log('Payment successful:', response);
          }
        }}
      />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [8, 9],
          },
          {
            id: 'headers',
            title: 'Authentication & Headers',
            description: 'JWT token for authentication',
            lineRange: [10, 12],
          },
          {
            id: 'theme',
            title: 'Theme Configuration',
            description: 'Design tokens for payment styling',
            lineRange: [13, 18],
          },
          {
            id: 'contentTokens',
            title: 'Content Tokens',
            description: 'Button labels, form labels, and messages',
            lineRange: [19, 33],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Payment-specific configuration',
            lineRange: [35, 57],
          },
        ],
      },
      accounts: {
        title: 'Accounts Component',
        description: 'Display account information and balances',
        code: `import {
  EBComponentsProvider,
  Accounts,
} from '@jpmorgan-payments/embedded-finance-components';

function AccountsSection() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      headers={{
        'token': 'idp-jwt-token',
      }}
      theme={{
        variables: {
          primaryColor: '#1d4ed8',
          cardColor: '#eff6ff',
        },
      }}
      contentTokens={{
        name: 'enUS',
        buttonLabels: {
          viewDetails: 'View Details',
          refreshAccounts: 'Refresh',
        },
        accountLabels: {
          accountNumber: 'Account Number',
          balance: 'Balance',
        },
        messages: {
          loadingAccounts: 'Loading your accounts...',
          noAccounts: 'No accounts found',
        },
      }}
    >
      <Accounts
        allowedCategories={['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']}
        clientId="your-client-id"
        title="My Accounts"
      />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [8, 9],
          },
          {
            id: 'headers',
            title: 'Authentication & Headers',
            description: 'JWT token for authentication',
            lineRange: [10, 12],
          },
          {
            id: 'theme',
            title: 'Theme Configuration',
            description: 'Design tokens for account styling',
            lineRange: [13, 18],
          },
          {
            id: 'contentTokens',
            title: 'Content Tokens',
            description: 'Button labels, account labels, and messages',
            lineRange: [19, 33],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Accounts-specific configuration',
            lineRange: [35, 39],
          },
        ],
      },
    };

    return (
      examples[componentId as keyof typeof examples] || {
        title: 'Component Example',
        description: 'Usage example for this component',
        code: `import {
  EBComponentsProvider,
  ComponentName,
} from '@jpmorgan-payments/embedded-finance-components';

function ComponentSection() {
  return (
    <EBComponentsProvider apiBaseUrl="https://your-api-base-url.com">
      <ComponentName />
    </EBComponentsProvider>
  );
}`,
        steps: [
          {
            id: 'provider',
            title: 'Provider Configuration',
            description: 'Core provider setup with API base URL',
            lineRange: [5, 8],
          },
          {
            id: 'component',
            title: 'Component Props',
            description: 'Component-specific configuration',
            lineRange: [49, 58],
          },
        ],
      }
    );
  };

  const example = getCodeExample(componentId);
  const selectedStepData = example.steps.find(
    (step) => step.id === selectedStep
  );
  const [startLine, endLine] = selectedStepData?.lineRange || [0, 0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {example.title}
          </DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {example.description}
          </p>
        </DialogHeader>

        {/* Installation Section - Full width at top */}
        <div className="mt-6 rounded-lg border border-sp-border bg-sp-accent p-4">
          <h4 className="mb-2 text-sm font-semibold text-sp-brand">
            Installation:
          </h4>
          <div className="rounded border border-sp-border bg-white p-2">
            <code className="text-xs text-sp-brand">
              npm install @jpmorgan-payments/embedded-finance-components
            </code>
          </div>
        </div>

        <div className="mt-6 flex h-[60vh] gap-6">
          {/* Left Panel - Key Features and Configuration */}
          <div className="w-80 flex-shrink-0 border-r border-sp-border pr-4">
            <h3 className="mb-4 font-semibold text-sp-brand">
              Key Features and Configuration
            </h3>
            <div className="space-y-2">
              {example.steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedStep === step.id
                      ? 'border-sp-brand bg-sp-accent text-sp-brand'
                      : 'border-sp-border hover:border-sp-brand hover:bg-sp-accent'
                  }`}
                >
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="mt-1 text-xs text-sp-brand">
                    {step.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Code Highlighting */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-hidden rounded-lg border border-sp-border bg-sp-accent">
              <div className="flex items-center justify-between border-b border-sp-border bg-white px-4 py-2">
                <span className="text-sm font-medium text-sp-brand">
                  Usage Example
                </span>
                <span className="text-xs text-sp-brand">
                  Lines {startLine}-{endLine} selected
                </span>
              </div>
              <div className="h-full overflow-auto p-4" ref={codeContainerRef}>
                <Highlight
                  theme={themes.vsLight}
                  code={example.code}
                  language="jsx"
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => (
                    <pre className={`${className} text-xs`} style={style}>
                      {tokens.map((line, i) => {
                        const lineNumber = i + 1;
                        const isHighlighted =
                          lineNumber >= startLine && lineNumber <= endLine;

                        return (
                          <div
                            key={i}
                            {...getLineProps({ line })}
                            className={`${isHighlighted ? 'border-l-2 border-sp-brand bg-sp-accent' : ''}`}
                            data-line={lineNumber}
                          >
                            <span className="mr-4 select-none text-xs text-sp-brand">
                              {lineNumber.toString().padStart(2, ' ')}
                            </span>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        );
                      })}
                    </pre>
                  )}
                </Highlight>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
