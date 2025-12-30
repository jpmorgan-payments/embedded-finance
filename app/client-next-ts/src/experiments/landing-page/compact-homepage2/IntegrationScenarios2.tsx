/**
 * IntegrationScenarios2 Component
 *
 * Interactive infographic showing integration approaches
 * Enhanced with:
 * - Subtle entrance animations
 * - Recommended badge for React Components option
 * - Enhanced hover effects with icon rotation
 */

import { useEffect, useState } from 'react';
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
    recommended: true,
  },
] as const;

export function IntegrationScenarios2() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`mb-1 text-sm font-semibold uppercase tracking-wide text-sp-brand transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}
      >
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
              className={`relative rounded-page-md border-2 bg-white p-3.5 transition-all duration-300 ${
                hoveredId === group.id
                  ? '-translate-y-1 transform border-sp-brand shadow-lg'
                  : 'border-sp-border shadow-sm hover:shadow-md'
              } ${
                'recommended' in group && group.recommended
                  ? 'ring-2 ring-sp-brand/20'
                  : ''
              } ${
                isVisible
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {'recommended' in group && group.recommended && (
                <div className="absolute -top-2 right-3 rounded-full bg-sp-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Recommended
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-page-sm bg-sp-accent text-sp-brand transition-transform duration-300 ${
                      hoveredId === group.id ? 'scale-110 rotate-3' : ''
                    }`}
                  >
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
                <div
                  className={`absolute bottom-0 left-8 h-2.5 w-0.5 translate-y-full transition-colors duration-300 ${
                    hoveredId === group.id ? 'bg-sp-brand' : 'bg-sp-border'
                  }`}
                />
              )}
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/solutions"
        className={`group mt-2 inline-flex items-center justify-center text-sm font-medium text-sp-brand transition-all duration-500 hover:text-sp-brand-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
        style={{ transitionDelay: '400ms' }}
      >
        <span className="underline decoration-sp-brand/30 underline-offset-2 transition-all group-hover:decoration-sp-brand">
          Compare integration methods
        </span>
        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
