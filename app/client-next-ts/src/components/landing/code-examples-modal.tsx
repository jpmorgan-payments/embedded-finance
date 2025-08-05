'use client';

import { useState, useEffect, useRef } from 'react';
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
        (step) => step.id === selectedStep,
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
    (step) => step.id === selectedStep,
  );
  const [startLine, endLine] = selectedStepData?.lineRange || [0, 0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {example.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {example.description}
          </p>
        </DialogHeader>

        {/* Installation Section - Full width at top */}
        <div className="mt-6 p-4 bg-jpm-brown-50 rounded-lg border border-jpm-brown-200">
          <h4 className="font-semibold text-jpm-brown-900 mb-2 text-sm">
            Installation:
          </h4>
          <div className="bg-jpm-brown-100 rounded p-2 border border-jpm-brown-300">
            <code className="text-jpm-brown-800 text-xs">
              npm install @jpmorgan-payments/embedded-finance-components
            </code>
          </div>
        </div>

        <div className="mt-6 flex gap-6 h-[60vh]">
          {/* Left Panel - Key Features and Configuration */}
          <div className="w-80 flex-shrink-0 border-r border-jpm-brown-200 pr-4">
            <h3 className="font-semibold text-jpm-brown-900 mb-4">
              Key Features and Configuration
            </h3>
            <div className="space-y-2">
              {example.steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedStep === step.id
                      ? 'border-jpm-brown bg-jpm-brown-50 text-jpm-brown-700'
                      : 'border-jpm-brown-200 hover:border-jpm-brown-300 hover:bg-jpm-brown-50'
                  }`}
                >
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-jpm-brown-600 mt-1">
                    {step.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Code Highlighting */}
          <div className="flex-1 overflow-hidden">
            <div className="bg-jpm-brown-50 rounded-lg overflow-hidden h-full border border-jpm-brown-200">
              <div className="bg-jpm-brown-100 px-4 py-2 border-b border-jpm-brown-300 flex items-center justify-between">
                <span className="text-jpm-brown-900 text-sm font-medium">
                  Usage Example
                </span>
                <span className="text-jpm-brown-700 text-xs">
                  Lines {startLine}-{endLine} selected
                </span>
              </div>
              <div className="p-4 h-full overflow-auto" ref={codeContainerRef}>
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
                            className={`${isHighlighted ? 'bg-jpm-brown-100 border-l-2 border-jpm-brown' : ''}`}
                            data-line={lineNumber}
                          >
                            <span className="text-jpm-brown-500 text-xs mr-4 select-none">
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
