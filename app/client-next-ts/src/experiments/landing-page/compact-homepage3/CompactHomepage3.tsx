/**
 * CompactHomepage3 Component
 *
 * A completely different layout approach:
 * - Centered, single-column hero (vs left-right split)
 * - Code-first visual emphasis with live code blocks
 * - 3-column action cards (vs 4-column)
 * - Horizontal integration tabs (vs vertical list)
 * - More whitespace and focused content
 */

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Box,
  Check,
  ClipboardCopy,
  Code,
  ExternalLink,
  Github,
  Package,
  Play,
  Server,
} from 'lucide-react';

import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

// Action cards - simplified to 3 main paths
const actionCards = [
  {
    id: 'demos',
    title: 'Explore Demos',
    description: 'See working implementations in action',
    icon: <Play className="h-6 w-6" />,
    link: '/demos',
    cta: 'View demos',
  },
  {
    id: 'components',
    title: 'Use Components',
    description: 'Drop-in React components for your app',
    icon: <Box className="h-6 w-6" />,
    link: '/components',
    cta: 'Browse components',
  },
  {
    id: 'guides',
    title: 'Read Guides',
    description: 'Integration patterns and best practices',
    icon: <BookOpen className="h-6 w-6" />,
    link: '/stories',
    cta: 'Start reading',
  },
] as const;

// Integration options as horizontal tabs
const integrationOptions = [
  {
    id: 'npm',
    label: 'npm Package',
    icon: <Package className="h-4 w-4" />,
    description: 'Install and import React components',
  },
  {
    id: 'custom',
    label: 'Custom Build',
    icon: <Code className="h-4 w-4" />,
    description: 'Use APIs directly with your own UI',
  },
  {
    id: 'hosted',
    label: 'Hosted Pages',
    icon: <Server className="h-4 w-4" />,
    description: 'Embed via iframe integration',
  },
] as const;

// Quick links for footer
const quickLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/jpmorgan-payments',
    icon: <Github className="h-4 w-4" />,
  },
  {
    label: 'Storybook',
    href: '/storybook',
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: 'API Reference',
    href: '/documentation',
    icon: <Code className="h-4 w-4" />,
  },
] as const;

export function CompactHomepage3() {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('npm');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-sp-bg">
      {/* Hero Section - Centered, Single Column */}
      <section className="pb-8 pt-8 sm:pb-10 sm:pt-10 lg:pb-12 lg:pt-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div
            className={`mb-4 inline-flex items-center gap-3 rounded-full border border-sp-border bg-white px-4 py-1.5 text-sm transition-all duration-700 ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : '-translate-y-4 opacity-0'
            }`}
          >
            <span className="font-medium text-jpm-gray-700">Open Source</span>
            <span className="h-1 w-1 rounded-full bg-sp-border" />
            <span className="font-medium text-jpm-gray-700">React 18+</span>
            <span className="h-1 w-1 rounded-full bg-sp-border" />
            <span className="font-medium text-jpm-gray-700">TypeScript</span>
          </div>

          {/* Headline */}
          <h1
            className={`mb-4 text-3xl font-bold leading-tight text-jpm-gray-900 transition-all delay-100 duration-700 sm:text-4xl lg:text-5xl ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            Embedded Finance
            <span className="block text-sp-brand">UI Components</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mx-auto mb-6 max-w-2xl text-base leading-relaxed text-jpm-gray transition-all delay-200 duration-700 sm:text-lg ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            Production-ready React components for J.P. Morgan Embedded Finance
            APIs. Fully customizable with design and content tokens.
          </p>

          {/* Code Blocks - Side by Side */}
          <div
            className={`mb-6 grid gap-3 transition-all delay-300 duration-700 sm:grid-cols-2 ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            {/* Install Command */}
            <div className="group relative overflow-hidden rounded-lg border border-sp-border bg-jpm-gray-900 p-3 text-left">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-jpm-gray-400">
                Install
              </div>
              <code className="block font-mono text-sm text-jpm-gray-100">
                <span className="text-jpm-gray-500">$</span> npm install
                @embedded-components
              </code>
              <button
                onClick={() => handleCopy('npm install @embedded-components')}
                className="absolute right-3 top-3 rounded p-1.5 text-jpm-gray-400 transition-colors hover:bg-jpm-gray-800 hover:text-white"
                aria-label="Copy install command"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <ClipboardCopy className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Usage Example */}
            <div className="overflow-hidden rounded-lg border border-sp-border bg-jpm-gray-900 p-3 text-left">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-jpm-gray-400">
                Usage
              </div>
              <code className="block font-mono text-sm text-jpm-gray-100">
                <span className="text-purple-400">import</span>{' '}
                <span className="text-yellow-300">{'{ OnboardingFlow }'}</span>
                <br />
                <span className="text-purple-400">from</span>{' '}
                <span className="text-green-400">'@embedded-components'</span>
              </code>
            </div>
          </div>

          {/* Primary CTA */}
          <div
            className={`delay-[400ms] transition-all duration-700 ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            <Link to="/demos">
              <Button
                size="lg"
                className="rounded-full bg-sp-brand px-8 py-3 text-base font-semibold !text-jpm-white shadow-lg transition-all hover:bg-sp-brand-700 hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What Do You Want To Do? - 3 Column Cards */}
      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2
            className={`mb-6 text-center text-xl font-bold text-jpm-gray-900 transition-all delay-500 duration-700 sm:text-2xl ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            What do you want to do?
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {actionCards.map((card, index) => (
              <Link
                key={card.id}
                to={card.link}
                className={`group rounded-xl border-2 border-sp-border bg-white p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:border-sp-brand hover:shadow-lg ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${550 + index * 100}ms` }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sp-accent text-sp-brand transition-transform duration-300 group-hover:scale-110">
                  {card.icon}
                </div>
                <h3 className="mb-1 text-base font-bold text-jpm-gray-900">
                  {card.title}
                </h3>
                <p className="mb-3 text-sm text-jpm-gray">{card.description}</p>
                <span className="inline-flex items-center text-sm font-medium text-sp-brand transition-colors group-hover:text-sp-brand-700">
                  {card.cta}
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Options - Horizontal Tabs */}
      <section className="bg-sp-bg py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2
            className={`mb-4 text-center text-xl font-bold text-jpm-gray-900 transition-all delay-700 duration-700 sm:text-2xl ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            Choose your integration path
          </h2>

          {/* Tabs */}
          <div
            className={`delay-[750ms] mb-4 flex justify-center transition-all duration-700 ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="inline-flex rounded-full border border-sp-border bg-white p-1">
              {integrationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveTab(option.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === option.id
                      ? 'bg-sp-brand text-white'
                      : 'text-jpm-gray-700 hover:text-sp-brand'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div
            className={`delay-[800ms] text-center transition-all duration-700 ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            }`}
          >
            <p className="text-jpm-gray">
              {integrationOptions.find((o) => o.id === activeTab)?.description}
            </p>
            <Link
              to="/solutions"
              className="mt-2 inline-flex items-center text-sm font-medium text-sp-brand hover:text-sp-brand-700"
            >
              Learn more about integration options
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Quick Links */}
      <section className="border-t border-sp-border bg-white py-5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 text-sm font-medium text-jpm-gray-700 transition-colors hover:text-sp-brand"
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
