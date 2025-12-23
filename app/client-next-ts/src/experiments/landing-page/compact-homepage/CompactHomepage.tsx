/**
 * CompactHomepage Component
 *
 * Slick, compact landing page with interactive infographic
 */

import { BookOpen, Box, Play, Wrench } from 'lucide-react';

import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IntegrationScenarios } from './IntegrationScenarios';

const navigationCards = [
  {
    id: 'demos',
    title: 'Demo Applications',
    description:
      'Working implementations of embedded finance applications. Includes onboarding workflows, payment processing, and account management examples.',
    icon: <Play className="h-6 w-6" />,
    link: '/demos',
    count: 3,
  },
  {
    id: 'components',
    title: 'Business Components',
    description:
      'Components for client onboarding, linked bank accounts, payment initiation, and transaction display. Includes API integration and error handling.',
    icon: <Box className="h-6 w-6" />,
    link: '/components',
    count: 6,
  },
  {
    id: 'recipes',
    title: 'Implementation Guides',
    description:
      'Technical guides covering form validation, date input patterns, accessibility requirements, and integration approaches with code examples.',
    icon: <BookOpen className="h-6 w-6" />,
    link: '/stories',
    count: 3,
  },
  {
    id: 'utils',
    title: 'Utility Components',
    description:
      'Components for dates, industry codes, tax IDs, and addresses. Includes validation logic and formatting for financial forms.',
    icon: <Wrench className="h-6 w-6" />,
    link: '/utils',
    count: 4,
  },
] as const;

export function CompactHomepage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Infographic */}
      <section className="bg-sp-bg py-6 sm:py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Left side - Text content */}
            <div className="lg:col-span-2">
              <h1 className="mb-4 text-3xl leading-tight text-sp-brand sm:text-4xl md:text-5xl lg:text-page-hero">
                Embedded Finance and Solutions
                <span className="block font-bold text-sp-brand">
                  Showcases and Components
                </span>
              </h1>

              <p className="mb-5 max-w-2xl text-lg leading-relaxed text-jpm-blue sm:text-xl lg:text-page-body">
                React components, working demos, and integration guides for J.P.
                Morgan Embedded Finance APIs.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/demos">
                  <Button
                    size="lg"
                    className="w-full rounded-page-md border-0 bg-sp-brand px-7 py-3 text-base font-semibold !text-jpm-white shadow-page-card hover:bg-sp-brand-700 sm:w-auto"
                  >
                    EXPLORE DEMOS
                  </Button>
                </Link>
                <Link to="/documentation">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-page-md border-2 border-sp-brand px-7 py-3 text-base font-semibold text-sp-brand transition-all duration-200 hover:bg-sp-brand hover:text-jpm-white sm:w-auto"
                  >
                    VIEW DOCUMENTATION
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Interactive Infographic */}
            <div className="lg:col-span-1">
              <IntegrationScenarios />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards Grid */}
      <section className="bg-jpm-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-jpm-gray-900 sm:text-4xl">
              Available Resources
            </h2>
            <p className="mx-auto max-w-2xl text-base text-jpm-gray">
              Components, demos, and documentation for building financial
              applications
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {navigationCards.map((card) => (
              <Link key={card.id} to={card.link}>
                <Card className="group h-full cursor-pointer rounded-page-md border-2 border-sp-border bg-jpm-white shadow-sm transition-all duration-200 hover:border-sp-brand hover:shadow-lg">
                  <CardHeader className="border-b-2 border-sp-border bg-sp-accent p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-shrink-0 text-sp-brand transition-transform duration-200 group-hover:scale-110">
                        {card.icon}
                      </div>
                      <span className="rounded-page-sm border border-sp-border bg-white px-2.5 py-1 text-xs font-bold text-sp-brand">
                        {card.count}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="mb-2 text-base font-bold text-jpm-gray-900">
                      {card.title}
                    </CardTitle>
                    <p className="text-sm leading-relaxed text-jpm-gray">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
