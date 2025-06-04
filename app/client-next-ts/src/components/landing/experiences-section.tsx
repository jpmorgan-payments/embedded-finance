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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExperiencesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const experiences = [
    {
      id: 'onboarding',
      title: 'Client Onboarding',
      description:
        'Complete KYC/KYB process with document collection and verification',
      icon: <Users className="h-5 w-5" />,
      status: 'live',
      steps: [
        'Collect business details',
        'Verify identity',
        'Upload documents',
        'Review and approve',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DIGITAL_ONBOARDING_FLOW_RECIPE.md',
    },
    {
      id: 'link-account',
      title: 'Link Bank Account',
      description:
        'Securely connect external bank accounts for payments and transfers',
      icon: <Link className="h-5 w-5" />,
      status: 'live',
      steps: [
        'Select bank',
        'Authenticate',
        'Verify account',
        'Confirm connection',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/LINKED_ACCOUNTS_RECIPE.md',
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description:
        'View, filter, and manage transaction records with detailed insights',
      icon: <List className="h-5 w-5" />,
      status: 'coming soon',
      steps: [
        'Fetch transactions',
        'Apply filters',
        'Display results',
        'Export data',
      ],
    },
    {
      id: 'payments',
      title: 'Payment Processing',
      description:
        'Process payments with real-time status updates and reconciliation',
      icon: <ArrowRight className="h-5 w-5" />,
      status: 'coming soon',
      steps: [
        'Initiate payment',
        'Validate details',
        'Process transaction',
        'Confirm completion',
      ],
    },
    {
      id: 'reporting',
      title: 'Financial Reporting',
      description:
        'Generate comprehensive financial reports and analytics dashboards',
      icon: <List className="h-5 w-5" />,
      status: 'coming soon',
      steps: [
        'Collect data',
        'Process metrics',
        'Generate reports',
        'Export insights',
      ],
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
    <section className="py-12 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Explore Embedded Experiences and Recipes
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-12 max-w-3xl mx-auto">
            Pre-built workflows and implementation patterns for common embedded
            finance use cases.
          </p>

          <div className="relative">
            <div className="overflow-hidden">
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
                    className="flex-shrink-0 px-4"
                    style={{ width: `${100 / experiences.length}%` }}
                  >
                    <Card className="overflow-hidden border-0 shadow-page-card bg-jpm-white rounded-page-lg h-full">
                      <CardHeader className="bg-jpm-brown-100 pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="flex items-center text-page-h4">
                            <div className="bg-jpm-brown-100 p-1.5 rounded-page-md mr-3 text-jpm-brown">
                              {exp.icon}
                            </div>
                            {exp.title}
                          </CardTitle>
                          <span
                            className={`px-2 py-1 text-page-small font-medium rounded-page-sm ${
                              exp.status === 'live'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {exp.status === 'live' ? 'Live' : 'Coming Soon'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8">
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-6">
                          {exp.description}
                        </p>

                        <div className="mb-6">
                          <h4 className="text-page-small font-semibold mb-3 text-jpm-gray-900">
                            Implementation Steps:
                          </h4>
                          <ol className="text-page-small text-jpm-gray space-y-2 list-decimal pl-5">
                            {exp.steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        </div>

                        {exp.recipeUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100 rounded-page-md font-semibold"
                            onClick={() => window.open(exp.recipeUrl, '_blank')}
                          >
                            View Recipe
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
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
