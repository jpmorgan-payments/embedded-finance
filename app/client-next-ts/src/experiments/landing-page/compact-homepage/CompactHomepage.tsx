/**
 * CompactHomepage Component
 *
 * Slick, compact landing page with interactive infographic
 */

import { useState } from 'react';
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
      'Working implementations showcasing embedded finance features in real-world scenarios.',
    icon: <Play className="h-6 w-6" />,
    link: '/demos',
    count: 3,
    accentColor:
      'bg-gradient-to-br from-[rgb(26,123,153)]/15 to-[rgb(26,123,153)]/5',
    iconBg:
      'bg-gradient-to-br from-[rgb(26,123,153)]/20 to-[rgb(26,123,153)]/10',
    borderGradient: 'from-[rgb(26,123,153)]',
  },
  {
    id: 'components',
    title: 'Business Components',
    description:
      'Pre-built React components for embedded banking workflows with API integration.',
    icon: <Box className="h-6 w-6" />,
    link: '/components',
    count: 6,
    accentColor:
      'bg-gradient-to-br from-[rgb(177,121,207)]/15 to-[rgb(177,121,207)]/5',
    iconBg:
      'bg-gradient-to-br from-[rgb(177,121,207)]/20 to-[rgb(177,121,207)]/10',
    borderGradient: 'from-[rgb(177,121,207)]',
  },
  {
    id: 'recipes',
    title: 'Implementation Guides',
    description:
      'Technical guides and best practices for building embedded finance solutions.',
    icon: <BookOpen className="h-6 w-6" />,
    link: '/stories',
    count: 3,
    accentColor:
      'bg-gradient-to-br from-[rgb(226,110,0)]/15 to-[rgb(226,110,0)]/5',
    iconBg: 'bg-gradient-to-br from-[rgb(226,110,0)]/20 to-[rgb(226,110,0)]/10',
    borderGradient: 'from-[rgb(226,110,0)]',
  },
  {
    id: 'utils',
    title: 'Utility Components',
    description:
      'Specialized form components with validation and formatting for financial applications.',
    icon: <Wrench className="h-6 w-6" />,
    link: '/utils',
    count: 4,
    accentColor:
      'bg-gradient-to-br from-[rgb(26,123,153)]/10 via-[rgb(177,121,207)]/10 to-[rgb(226,110,0)]/10',
    iconBg:
      'bg-gradient-to-br from-[rgb(26,123,153)]/15 via-[rgb(177,121,207)]/15 to-[rgb(226,110,0)]/15',
    borderGradient:
      'from-[rgb(26,123,153)] via-[rgb(177,121,207)] to-[rgb(226,110,0)]',
  },
] as const;

export function CompactHomepage() {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Infographic */}
      <section className="relative bg-gradient-to-br from-sp-bg via-sp-accent/30 to-sp-bg py-6 sm:py-8 lg:py-10">
        {/* Decorative gradient overlay inspired by J.P. Morgan Payments Developer Portal */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(226,110,0)]/10 via-[rgb(177,121,207)]/10 to-[rgb(26,123,153)]/10 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      <section className="pb-10 pt-10">
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
              <Link
                key={card.id}
                to={card.link}
                className="block"
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                <Card
                  className={`relative flex h-full min-h-[11rem] cursor-pointer flex-col overflow-hidden rounded-page-md border-2 border-sp-border bg-jpm-white transition-all duration-200 ${
                    hoveredCardId === card.id
                      ? '-translate-y-1 transform border-sp-brand shadow-lg ring-2 ring-sp-brand/20'
                      : 'shadow-sm hover:border-sp-brand/50 hover:shadow-md'
                  }`}
                >
                  <CardHeader
                    className={`border-b-2 border-sp-border ${card.accentColor} flex-shrink-0 p-4`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-page-sm ${card.iconBg} text-sp-brand shadow-sm transition-all duration-200 ${
                          hoveredCardId === card.id
                            ? 'scale-110 ring-2 ring-sp-brand/30'
                            : ''
                        }`}
                      >
                        {card.icon}
                      </div>
                      <span className="rounded-page-sm border border-sp-brand/30 bg-white px-3 py-1.5 text-base font-bold text-sp-brand shadow-sm">
                        {card.count}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold leading-tight text-jpm-gray-900">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <p className="flex-1 text-sm leading-relaxed text-jpm-gray">
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
