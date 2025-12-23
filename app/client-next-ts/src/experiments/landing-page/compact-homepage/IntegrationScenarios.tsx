/**
 * IntegrationScenarios Component
 *
 * Interactive infographic showing integration approaches
 */

import { useState } from 'react';
import { ArrowRight, Code, Package, Server } from 'lucide-react';

import { Link } from '@tanstack/react-router';

const integrationGroups = [
  {
    id: 'build',
    title: 'Custom Implementation',
    description: 'Build your own UI using API specifications and guides',
    icon: <Code className="h-5 w-5" />,
  },
  {
    id: 'dropin',
    title: 'React Components',
    description: 'Use pre-built components via npm package',
    icon: <Package className="h-5 w-5" />,
  },
  {
    id: 'hosted',
    title: 'Hosted Pages',
    description: 'J.P. Morgan hosted UI with iframe integration',
    icon: <Server className="h-5 w-5" />,
  },
] as const;

export function IntegrationScenarios() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-sp-brand">
        Integration Options
      </div>

      <div className="space-y-2.5">
        {integrationGroups.map((group, index) => (
          <Link
            key={group.id}
            to="/solutions"
            className="block"
            onMouseEnter={() => setHoveredId(group.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className={`relative rounded-page-md border-2 border-sp-border bg-white p-3.5 transition-all duration-200 ${
                hoveredId === group.id
                  ? '-translate-y-1 transform shadow-lg'
                  : 'shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-page-sm bg-sp-accent text-sp-brand">
                    {group.icon}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-sm font-semibold text-jpm-gray-900">
                    {group.title}
                  </div>
                  <div className="text-sm leading-relaxed text-jpm-gray">
                    {group.description}
                  </div>
                </div>
                <ArrowRight
                  className={`h-4 w-4 flex-shrink-0 text-sp-brand transition-transform duration-200 ${
                    hoveredId === group.id ? 'translate-x-1' : ''
                  }`}
                />
              </div>

              {/* Connection line to next item */}
              {index < integrationGroups.length - 1 && (
                <div className="absolute bottom-0 left-8 h-2.5 w-0.5 translate-y-full bg-sp-border" />
              )}
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/solutions"
        className="group mt-2 inline-flex items-center justify-center text-sm font-medium text-sp-brand hover:text-sp-brand-700"
      >
        <span className="underline">Compare integration methods</span>
        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
