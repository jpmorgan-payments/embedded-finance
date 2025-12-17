/**
 * IntegrationScenarios Component
 *
 * Interactive infographic showing integration approaches
 */

import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Code, Package, Server, ArrowRight } from 'lucide-react';

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
      <div className="text-sm font-semibold text-sp-brand uppercase tracking-wide mb-1">
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
              className={`relative bg-white border-2 border-sp-border rounded-page-md p-3.5 transition-all duration-200 ${
                hoveredId === group.id
                  ? 'shadow-lg transform -translate-y-1'
                  : 'shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-9 h-9 bg-sp-accent rounded-page-sm flex items-center justify-center text-sp-brand">
                    {group.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-jpm-gray-900 mb-1">
                    {group.title}
                  </div>
                  <div className="text-sm text-jpm-gray leading-relaxed">
                    {group.description}
                  </div>
                </div>
                <ArrowRight
                  className={`flex-shrink-0 h-4 w-4 text-sp-brand transition-transform duration-200 ${
                    hoveredId === group.id ? 'translate-x-1' : ''
                  }`}
                />
              </div>

              {/* Connection line to next item */}
              {index < integrationGroups.length - 1 && (
                <div className="absolute left-8 bottom-0 w-0.5 h-2.5 bg-sp-border translate-y-full" />
              )}
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/solutions"
        className="inline-flex items-center justify-center text-sp-brand hover:text-sp-brand-700 text-sm font-medium mt-2 group"
      >
        <span className="underline">Compare integration methods</span>
        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
