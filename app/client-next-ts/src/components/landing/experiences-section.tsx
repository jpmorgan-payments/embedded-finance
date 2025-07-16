'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Users,
  Link,
  List,
  Box,
  ExternalLink,
  UserCog,
  FileText,
  Zap,
  Bell,
} from 'lucide-react';

export function ExperiencesSection() {
  const experiences = [
    {
      id: 'onboarding',
      title: 'Client Onboarding (KYC/KYB)',
      description:
        'Complete client verification with staggered data collection, due diligence questions, and document requests for seamless onboarding.',
      icon: <Users className="h-5 w-5" />,
      status: 'live',
      hasComponents: true,
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
      id: 'recipients',
      title: 'Recipients Management',
      description:
        'Add, view, edit, and manage third-party payment recipients with dynamic validation, multi-method support (ACH, WIRE, RTP), and secure, accessible workflows.',
      icon: <List className="h-5 w-5" />,
      status: 'beta',
      hasComponents: true,
      steps: [
        'View, search, filter, and sort all saved recipients',
        'Add new recipients with dynamic forms based on selected payment methods',
        'Edit recipient details and update payment methods',
        'Delete recipients with confirmation and audit tracking',
        'Initiate payments directly from recipient list or details',
        'Mask sensitive account information for security',
        'Comprehensive validation and error handling for all fields',
        'Accessible, mobile-responsive design with tooltips and help text',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/Recipients/RECIPIENTS_REQUIREMENTS.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/third-party-recipient',
    },
    {
      id: 'document-upload',
      title: 'Documents Requests Management',
      description:
        'Guided document upload with validation and multi-party support.',
      icon: <FileText className="h-5 w-5" />,
      status: 'live',
      hasComponents: true,
      steps: [
        'Load document requests with ACTIVE status validation',
        'Progressive disclosure of requirements with step-by-step interface',
        'Handle both required and optional documents with validation',
        'Upload documents and submit requests',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/OnboardingWizardBasic/DocumentUploadStepForm/IMPLEMENTATION_GUIDE.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/upload-documents',
    },
    {
      id: 'partially-hosted-onboarding',
      title: 'Partially Hosted Onboarding Integration',
      description:
        'Implement a hybrid onboarding approach where parts of the client verification process are handled by your application while leveraging embedded components.',
      icon: <UserCog className="h-5 w-5" />,
      status: 'live',
      hasComponents: false,
      steps: [
        'Configure your application to handle initial client data collection',
        'Integrate embedded components for specific onboarding steps',
        'Implement seamless handoff between hosted and embedded flows',
        'Customize the user experience to match your brand requirements',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/docs/PARTIALLY_HOSTED_ONBOARDING_INTEGRATION_GUIDE.md',
    },
    {
      id: 'link-account',
      title: 'Link External Bank Account',
      description:
        'Connect external bank accounts using Account Validation Service with microdeposits verification for secure account linking.',
      icon: <Link className="h-5 w-5" />,
      status: 'live',
      hasComponents: true,
      steps: [
        'Add recipient with account details and party information',
        'Trigger Account Validation Service (AVS) checks',
        'Complete microdeposits verification if required',
        'Activate linked account for payments',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/LINKED_ACCOUNTS_RECIPE.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-linked-account',
    },
    {
      id: 'transactions',
      title: 'Transaction History & Management',
      description:
        'View, filter, and manage transaction records with detailed insights and comprehensive reporting capabilities for better financial oversight.',
      icon: <List className="h-5 w-5" />,
      status: 'coming soon',
      hasComponents: false,
      steps: [
        'Fetch transaction data with filtering options',
        'Display transaction details and status',
        'Provide search and sorting capabilities',
        'Export transaction data for reporting',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/TRANSACTIONS_DISPLAY_RECIPE.md',
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/manage-display-transactions-v2',
    },
    {
      id: 'payments',
      title: 'Make Payouts',
      description:
        'Process ACH, Wire, and RTP payments from Embedded Banking accounts with real-time status tracking and comprehensive payment management.',
      icon: <Zap className="h-5 w-5" />,
      status: 'coming soon',
      hasComponents: false,
      steps: [
        'Get debtor account ID from your Embedded account',
        'Create payment request with recipient and amount',
        'Submit transaction with reference ID and memo',
        'Monitor payment status and completion',
      ],
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/payments-without-onboarding/how-to/make-payout',
    },
    {
      id: 'notifications',
      title: 'Notifications & Webhooks',
      description:
        'Receive real-time notifications about transaction and client events with customizable webhook endpoints for seamless integration.',
      icon: <Bell className="h-5 w-5" />,
      status: 'coming soon',
      hasComponents: false,
      steps: [
        'Set up webhook subscription endpoints',
        'Configure event types for notifications',
        'Handle real-time event notifications',
        'Update UI based on event data',
      ],
      docsUrl:
        'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/notification-subscriptions',
    },
  ];

  return (
    <section id="embedded-components" className="py-8 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Explore Embedded Business Components and Recipes
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-8 max-w-3xl mx-auto">
            Pre-built workflows and implementation patterns for common embedded
            finance use cases.
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
                      <span className="line-clamp-2">{exp.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-page-sm ${
                          exp.status === 'live'
                            ? 'bg-green-100 text-green-800'
                            : exp.status === 'beta'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {exp.status === 'live'
                          ? 'Live'
                          : exp.status === 'beta'
                            ? 'Beta'
                            : 'Soon'}
                      </span>
                      {exp.hasComponents && (
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

                    {exp.hasComponents && (
                      <div className="relative group">
                        <button
                          className="p-2.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                          onClick={() =>
                            window.open(
                              'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components',
                              '_blank',
                            )
                          }
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
  );
}
