/**
 * CompactHomepage2 Component
 *
 * Enhanced landing page with:
 * - Subtle entrance animations
 * - Developer-focused quick start (npm install snippet)
 * - Quick stats and value propositions
 * - Featured card highlighting
 * - Recommended integration badge
 */

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Box,
  Check,
  ClipboardCopy,
  Play,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';

import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IntegrationScenarios2 } from './IntegrationScenarios2';

// Quick stats for developer confidence
const quickStats = [
  { label: 'Components', value: '6+' },
  { label: 'Demos', value: '3' },
  { label: 'TypeScript', value: '100%' },
] as const;

// Value propositions for developers
const valueProps = [
  { icon: <Zap className="h-4 w-4" />, text: 'Fully customizable' },
  { icon: <Sparkles className="h-4 w-4" />, text: 'Design & content tokens' },
] as const;

const navigationCards = [
  {
    id: 'demos',
    title: 'Demo Applications',
    description:
      'Sample implementations of Embedded Finance APIs. Includes onboarding workflows, make payment forms, recipients and linked accounts management examples.',
    icon: <Play className="h-6 w-6" />,
    link: '/demos',
    count: 3,
    featured: true,
  },
  {
    id: 'components',
    title: 'Business Components',
    description:
      'Components for client onboarding, linked bank accounts, payment initiation, and transaction display. Includes API integration and error handling.',
    icon: <Box className="h-6 w-6" />,
    link: '/components',
    count: 6,
    featured: false,
  },
  {
    id: 'recipes',
    title: 'Implementation Guides',
    description:
      'Technical guides covering form validation, date input patterns, accessibility requirements, and integration approaches with code examples.',
    icon: <BookOpen className="h-6 w-6" />,
    link: '/stories',
    count: 3,
    featured: false,
  },
  {
    id: 'utils',
    title: 'Utility Components',
    description:
      'Components to capture important dates, industry codes, tax IDs, and addresses. Includes validation logic and formatting for financial forms.',
    icon: <Wrench className="h-6 w-6" />,
    link: '/utils',
    count: 4,
    featured: false,
  },
] as const;

export function CompactHomepage2() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText('npm install @embedded-components');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Infographic */}
      <section className="bg-sp-bg py-6 sm:py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Left side - Text content */}
            <div className="lg:col-span-2">
              {/* Animated tagline */}
              <div
                className={`mb-3 inline-flex items-center gap-2 rounded-full border border-sp-brand/20 bg-sp-accent px-3 py-1.5 text-sm font-medium text-sp-brand transition-all duration-700 ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : '-translate-y-2 opacity-0'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Build faster with pre-built embedded UI components</span>
              </div>

              <h1
                className={`mb-4 text-3xl leading-tight text-sp-brand transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-page-hero ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
              >
                Embedded Finance and Solutions
                <span className="block font-bold text-sp-brand">
                  Showcases and Components
                </span>
              </h1>

              <p
                className={`mb-4 max-w-2xl text-lg leading-relaxed text-jpm-blue transition-all delay-200 duration-700 sm:text-xl lg:text-page-body ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
              >
                React components, working demos, and integration guides for J.P.
                Morgan Embedded Finance APIs.
              </p>

              {/* Quick Stats */}
              <div
                className={`mb-5 flex flex-wrap items-center gap-4 transition-all delay-300 duration-700 ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
              >
                {quickStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-1.5 text-sm text-jpm-gray-700"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="font-bold text-sp-brand">
                      {stat.value}
                    </span>
                    <span>{stat.label}</span>
                  </div>
                ))}
                <span className="text-jpm-gray-300">•</span>
                {valueProps.map((prop) => (
                  <div
                    key={prop.text}
                    className="flex items-center gap-1.5 text-sm text-jpm-gray-700"
                  >
                    <span className="text-sp-brand">{prop.icon}</span>
                    <span>{prop.text}</span>
                  </div>
                ))}
              </div>

              {/* Quick Start Code Snippet */}
              <div
                className={`delay-[350ms] mb-5 transition-all duration-700 ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
              >
                <button
                  onClick={handleCopyInstall}
                  className="group flex items-center gap-3 rounded-page-md border border-sp-border bg-jpm-gray-900 px-4 py-2.5 font-mono text-sm text-jpm-gray-100 transition-all hover:border-sp-brand hover:bg-jpm-gray-800"
                >
                  <span className="text-jpm-gray-400">$</span>
                  <span>npm install @embedded-components</span>
                  <span className="ml-2 flex items-center gap-1 text-jpm-gray-400 transition-colors group-hover:text-sp-accent">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-green-400">Copied!</span>
                      </>
                    ) : (
                      <ClipboardCopy className="h-4 w-4" />
                    )}
                  </span>
                </button>
              </div>

              <div
                className={`delay-[400ms] flex flex-col gap-3 transition-all duration-700 sm:flex-row ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
              >
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
            <div
              className={`transition-all delay-500 duration-700 lg:col-span-1 ${
                isVisible
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-4 opacity-0'
              }`}
            >
              <IntegrationScenarios2 />
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
            {navigationCards.map((card, index) => (
              <Link key={card.id} to={card.link}>
                <Card
                  className={`group h-full cursor-pointer rounded-page-md border-2 bg-jpm-white shadow-sm transition-all duration-500 hover:shadow-lg ${
                    card.featured
                      ? 'border-sp-brand ring-2 ring-sp-brand/20 hover:ring-sp-brand/40'
                      : 'border-sp-border hover:border-sp-brand'
                  } ${
                    isVisible
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0'
                  }`}
                  style={{ transitionDelay: `${600 + index * 100}ms` }}
                >
                  <CardHeader
                    className={`border-b-2 border-sp-border p-4 ${
                      card.featured ? 'bg-sp-brand/5' : 'bg-sp-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-shrink-0 text-sp-brand transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                        {card.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {card.featured && (
                          <span className="rounded-full bg-sp-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Start here
                          </span>
                        )}
                        <span
                          className={`rounded-page-sm border px-2.5 py-1 text-xs font-bold ${
                            card.featured
                              ? 'border-sp-brand bg-sp-brand text-white'
                              : 'border-sp-border bg-white text-sp-brand'
                          }`}
                        >
                          {card.count}
                        </span>
                      </div>
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
