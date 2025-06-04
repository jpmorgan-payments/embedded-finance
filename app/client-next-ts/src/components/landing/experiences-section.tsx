'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Users,
  Link,
  List,
  ChevronLeft,
  ChevronRight,
  Box,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExperiencesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const experiences = [
    {
      id: 'onboarding',
      title: 'Client Onboarding (KYC/KYB)',
      description:
        'Complete client verification with staggered data collection, due diligence questions, and document requests.',
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
      id: 'link-account',
      title: 'Link External Bank Account',
      description:
        'Connect external bank accounts using Account Validation Service with microdeposits verification.',
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
        'View, filter, and manage transaction records with detailed insights and comprehensive reporting.',
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
        'Process ACH, Wire, and RTP payments from Embedded Banking accounts to client bank accounts.',
      icon: <ArrowRight className="h-5 w-5" />,
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
        'Receive real-time notifications about transaction, client, account, and recipient events.',
      icon: <List className="h-5 w-5" />,
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

  const VISIBLE_EXPERIENCES = 3;
  const maxIndex = Math.max(0, experiences.length - VISIBLE_EXPERIENCES);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  return (
    <section className="py-8 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Explore Embedded Components, Experiences and Recipes
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-8 max-w-3xl mx-auto">
            Pre-built workflows and implementation patterns for common embedded
            finance use cases.
          </p>

          <div className="relative">
            <div className="overflow-x-hidden overflow-y-visible">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${(currentIndex * 100) / VISIBLE_EXPERIENCES}%)`,
                  width: `${(experiences.length * 100) / VISIBLE_EXPERIENCES}%`,
                }}
              >
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex-shrink-0 px-4 pb-4"
                    style={{ width: `${100 / experiences.length}%` }}
                  >
                    <Card className="overflow-hidden border-0 shadow-page-card bg-jpm-white rounded-page-lg h-full flex flex-col">
                      <CardHeader className="bg-jpm-brown-100 pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="flex items-center text-page-h4">
                            <div className="bg-jpm-brown-100 p-1.5 rounded-page-md mr-3 text-jpm-brown">
                              {exp.icon}
                            </div>
                            {exp.title}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-1 text-page-small font-medium rounded-page-sm ${
                                exp.status === 'live'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {exp.status === 'live' ? 'Live' : 'Coming Soon'}
                            </span>
                            {exp.hasComponents && (
                              <Box className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 flex-1 flex flex-col">
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-6">
                          {exp.description}
                        </p>

                        <div className="mb-6 flex-1">
                          <h4 className="text-page-small font-semibold mb-3 text-jpm-gray-900">
                            Implementation Steps:
                          </h4>
                          <ol className="text-page-small text-jpm-gray space-y-2 list-decimal pl-5">
                            {exp.steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="space-y-3 mt-auto">
                          {exp.recipeUrl && (
                            <Button
                              variant="outline"
                              className="w-full border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100 rounded-page-md font-semibold"
                              onClick={() =>
                                window.open(exp.recipeUrl, '_blank')
                              }
                            >
                              View Implementation Recipe
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          )}

                          {exp.docsUrl && (
                            <Button
                              variant="outline"
                              className="w-full border-jpm-blue text-jpm-blue hover:bg-blue-50 rounded-page-md font-semibold"
                              onClick={() => window.open(exp.docsUrl, '_blank')}
                            >
                              View API Documentation
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          )}

                          {exp.hasComponents && (
                            <Button
                              variant="outline"
                              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 rounded-page-md font-semibold"
                              onClick={() =>
                                window.open(
                                  'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components',
                                  '_blank',
                                )
                              }
                            >
                              <Box className="mr-2 h-4 w-4" />
                              View NPM Components
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons - only show if we can navigate */}
            {experiences.length > VISIBLE_EXPERIENCES && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-jpm-white rounded-full h-12 w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6 text-jpm-gray" />
                  <span className="sr-only">Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-jpm-white rounded-full h-12 w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={nextSlide}
                  disabled={currentIndex === maxIndex}
                >
                  <ChevronRight className="h-6 w-6 text-jpm-gray" />
                  <span className="sr-only">Next</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators - only show if we can navigate */}
          {experiences.length > VISIBLE_EXPERIENCES && (
            <div className="flex justify-center mt-8 gap-3">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-jpm-brown' : 'bg-jpm-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to position ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
