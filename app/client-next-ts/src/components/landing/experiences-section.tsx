'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Link,
  UserCheck,
  Receipt,
  Zap,
  Building2,
  Box,
  ExternalLink,
  FileText,
  Play,
  Github,
} from 'lucide-react';
import { CodeExamplesModal } from './code-examples-modal';

export function ExperiencesSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleCardTitleClick = (
    componentId: string,
    componentTitle: string,
  ) => {
    setSelectedComponent({ id: componentId, title: componentTitle });
    setModalOpen(true);
  };

  const experiences = [
    {
      id: 'onboarding',
      title: 'Client Onboarding (KYC/KYB)',
      description:
        'Complete client verification with incremental information collection, due diligence questions, and document requests for seamless onboarding.',
      icon: <Users className="h-5 w-5" />,
      status: 'testing',
      npmUrl:
        'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#2-onboardingflow',
      demoUrl:
        '/sellsense-demo?fullscreen=true&component=onboarding&theme=Empty',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/OnboardingFlow',
      steps: [
        'Create client with basic business information',
        'Collect party details and due diligence responses',
        'Handle document requests and attestations',
        'Submit for verification and monitor status',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DIGITAL_ONBOARDING_FLOW_RECIPE.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client',
    },
    {
      id: 'link-account',
      title: 'Link External Bank Account',
      description:
        'Connect external bank accounts using Account Validation Service with microdeposits verification for secure account linking.',
      icon: <Link className="h-5 w-5" />,
      status: 'testing',
      npmUrl:
        'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#3-linkedaccountwidget',
      demoUrl:
        '/sellsense-demo?fullscreen=true&component=linked-accounts&theme=Empty',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/LinkedAccountWidget',
      steps: [
        'Add recipient with account details and party information',
        'Trigger Account Validation Service (AVS) checks',
        'Complete microdeposits verification if required',
        'Activate linked account for payments',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/LinkedAccountWidget/LINKED_ACCOUNTS_REQUIREMENTS.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-linked-account',
    },
    {
      id: 'recipients',
      title: 'Recipients Management',
      description:
        'Add, view, edit, and manage third-party payment recipients with dynamic validation, multi-method support (ACH, WIRE, RTP), and secure, accessible workflows.',
      icon: <UserCheck className="h-5 w-5" />,
      status: 'in progress',
      npmUrl:
        'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#5-recipients',
      demoUrl:
        '/sellsense-demo?fullscreen=true&component=recipients&theme=Empty',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/Recipients',
      steps: [
        'View, search, filter, and sort all saved recipients',
        'Add new recipients with dynamic forms based on selected payment methods',
        'Edit recipient details and update payment methods',
        'Deactivate recipients with confirmation and audit tracking',
        'Mask sensitive account information for security',
        'Comprehensive validation and error handling for all fields',
        'Accessible, mobile-responsive design with tooltips and help text',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/Recipients/RECIPIENTS_REQUIREMENTS.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/external-payments',
    },
    {
      id: 'transactions',
      title: 'Transaction History & Management',
      description:
        'View, filter, and manage transaction records with detailed insights and comprehensive reporting capabilities for better financial oversight.',
      icon: <Receipt className="h-5 w-5" />,
      status: 'in progress',
      demoUrl:
        '/sellsense-demo?fullscreen=true&component=transactions&theme=Empty',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/TransactionsDisplay',
      steps: [
        'Fetch transaction data with filtering options',
        'Display transaction details and status',
        'Provide search and sorting capabilities',
      ],
      npmUrl:
        'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#5-transactionsdisplay',
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/TransactionsDisplay/TRANSACTIONS_DISPLAY_REQUIREMENTS.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/manage-display-transactions-v2',
    },
    {
      id: 'payments',
      title: 'Make Payouts',
      description:
        'Initiate ACH, Wire, and RTP payments from Embedded Banking accounts to external recipients and linked accounts.',
      icon: <Zap className="h-5 w-5" />,
      status: 'coming soon',
      demoUrl:
        '/sellsense-demo?fullscreen=true&component=make-payment&theme=Empty',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/MakePayment',
      steps: [
        'Get debtor account ID from your Embedded account',
        'Create payment request with recipient and amount',
        'Submit transaction with reference ID and memo',
      ],
      npmUrl:
        'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#4-makepayment',
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/MakePayment/MAKE_PAYMENT_REQUIREMENTS.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/payments-without-onboarding/how-to/make-payout',
    },
    {
      id: 'accounts',
      title: 'Accounts Management',
      description:
        'View Embedded Finance accounts with detailed insights and balances for better financial oversight.',
      icon: <Building2 className="h-5 w-5" />,
      status: 'coming soon',
      demoUrl: '/sellsense-demo?fullscreen=true&component=accounts&theme=Empty',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/Accounts',
      steps: [
        'View accounts details and balances',
        'Mask sensitive account information for security',
        'Accessible, mobile-responsive design with tooltips and help text',
      ],
      npmUrl:
        'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#1-accountsdisplay',
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/Accounts/ACCOUNTS_REQUIREMENTS.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-account',
    },
  ];

  return (
    <>
      <section id="embedded-components" className="py-8 bg-jpm-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
              Explore Embedded Business Components
            </h2>
            <p className="text-page-body text-jpm-gray text-center mb-8 max-w-3xl mx-auto">
              Pre-built workflows and implementation patterns for common
              embedded finance use cases.{' '}
              <a
                href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-jpm-blue hover:text-jpm-blue-dark underline whitespace-nowrap"
              >
                View full documentation →
              </a>
            </p>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {experiences.map((exp) => (
                <Card
                  key={exp.id}
                  className="overflow-hidden border-0 shadow-page-card bg-jpm-white rounded-page-lg h-64 flex flex-col"
                >
                  <CardHeader className="bg-jpm-brown-100 p-4 min-h-[4rem] flex-shrink-0">
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-start text-base font-semibold leading-tight">
                        <div className="bg-jpm-brown-100 p-1 rounded-page-sm mr-2 text-jpm-brown-800 flex-shrink-0">
                          {exp.icon}
                        </div>
                        <button
                          onClick={() =>
                            handleCardTitleClick(exp.id, exp.title)
                          }
                          className="line-clamp-2 text-left hover:text-jpm-blue hover:underline cursor-pointer transition-colors"
                          title="Click to view code example"
                        >
                          {exp.title}
                        </button>
                      </CardTitle>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span
                          className={`px-1.5 py-0.5 text-xs font-medium rounded-page-sm ${
                            exp.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : exp.status === 'testing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : exp.status === 'in progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {exp.status === 'available'
                            ? 'Available'
                            : exp.status === 'testing'
                              ? 'Testing'
                              : exp.status === 'in progress'
                                ? 'In Progress'
                                : 'Coming Soon'}
                        </span>
                        {exp.npmUrl && (
                          <Box className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex-1 mb-4">
                      <p className="text-sm text-jpm-gray leading-relaxed line-clamp-4">
                        {exp.description}
                      </p>
                    </div>

                    {/* Always visible, centrally aligned action buttons */}
                    <div className="flex justify-center items-center gap-3 mt-auto pt-3 pb-1 border-t border-gray-100 flex-shrink-0 min-h-[3.5rem]">
                      {exp.demoUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                            onClick={() => window.open(exp.demoUrl, '_blank')}
                            title="View Live Demo"
                          >
                            <Play className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Live Demo
                          </div>
                        </div>
                      )}

                      {exp.githubUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                            onClick={() => window.open(exp.githubUrl, '_blank')}
                            title="View Source Code"
                          >
                            <Github className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Source Code
                          </div>
                        </div>
                      )}

                      {exp.recipeUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-jpm-brown-100 hover:bg-jpm-brown-200 text-jpm-brown transition-colors"
                            onClick={() => window.open(exp.recipeUrl, '_blank')}
                            title="View Implementation Recipe"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Implementation Recipe
                          </div>
                        </div>
                      )}

                      {exp.docsUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-blue-100 hover:bg-blue-200 text-jpm-blue transition-colors"
                            onClick={() => window.open(exp.docsUrl, '_blank')}
                            title="View API Documentation"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            API Documentation
                          </div>
                        </div>
                      )}

                      {exp.npmUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                            onClick={() => window.open(exp.npmUrl, '_blank')}
                            title="View NPM Components"
                          >
                            <Box className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            NPM Components
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples Modal */}
      {selectedComponent && (
        <CodeExamplesModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          componentId={selectedComponent.id}
        />
      )}
    </>
  );
}
