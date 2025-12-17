/**
 * CompactHomepage Component
 *
 * Slick, compact landing page with interactive infographic
 */

import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Box, BookOpen, Wrench } from 'lucide-react';
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
    title: 'React Components',
    description:
      'TypeScript components for client onboarding, linked bank accounts, payment initiation, and transaction display. Includes API integration and error handling.',
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
    title: 'Form Components',
    description:
      'Input components for dates, industry codes, tax IDs, and addresses. Includes validation logic and formatting for financial forms.',
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Left side - Text content */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-page-hero text-sp-brand leading-tight mb-4">
                Embedded Finance and Solutions
                <span className="block font-bold text-sp-brand">
                  Showcases and Components
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-page-body text-jpm-blue leading-relaxed mb-5 max-w-2xl">
                React components, working demos, and integration guides for J.P.
                Morgan Embedded Finance APIs.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/demos">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-sp-brand hover:bg-sp-brand-700 !text-jpm-white font-semibold px-7 py-3 text-base rounded-page-md shadow-page-card border-0"
                  >
                    EXPLORE DEMOS
                  </Button>
                </Link>
                <Link to="/documentation">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-2 border-sp-brand text-sp-brand hover:bg-sp-brand hover:text-jpm-white font-semibold px-7 py-3 text-base rounded-page-md transition-all duration-200"
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
      <section className="py-10 bg-jpm-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-jpm-gray-900 mb-2">
              Available Resources
            </h2>
            <p className="text-base text-jpm-gray max-w-2xl mx-auto">
              Components, demos, and documentation for building financial
              applications
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {navigationCards.map((card) => (
              <Link key={card.id} to={card.link}>
                <Card className="h-full border-2 border-sp-border shadow-sm bg-jpm-white rounded-page-md hover:shadow-lg hover:border-sp-brand transition-all duration-200 cursor-pointer group">
                  <CardHeader className="bg-sp-accent border-b-2 border-sp-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sp-brand flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        {card.icon}
                      </div>
                      <span className="px-2.5 py-1 bg-white text-xs font-bold rounded-page-sm border border-sp-border text-sp-brand">
                        {card.count}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-base font-bold text-jpm-gray-900 mb-2">
                      {card.title}
                    </CardTitle>
                    <p className="text-sm text-jpm-gray leading-relaxed">
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
