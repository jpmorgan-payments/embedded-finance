import { Calendar, FileText, UserCog, Webhook } from 'lucide-react';

import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RecipesSection() {
  const recipes = [
    {
      id: 'core-functional-requirements-index',
      title: 'Core functional requirements — cross-reference',
      excerpt:
        'Index of links to all functional requirements markdown files under src/core for each active component.',
      date: '2026-04-15',
      readTime: '5 min read',
      tags: ['Documentation', 'Requirements', 'Core'],
      link: '/stories/core-functional-requirements-index',
      external: false,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'webhook-integration-recipe',
      title: 'Webhook Integration Recipe: UX Guidance',
      excerpt:
        'Client-facing and partner-platform UX patterns for webhook events, onboarding status, and operations (WEBHOOK_INTEGRATION_RECIPE.md).',
      date: '2026-01-08',
      readTime: '12 min read',
      tags: ['Webhooks', 'Integration', 'UX'],
      link: '/stories/webhook-integration-recipe',
      external: false,
      icon: <Webhook className="h-5 w-5" />,
    },
    {
      id: 'date-selector-challenges',
      title: 'JavaScript/TypeScript Date Parsing Guide',
      excerpt:
        'Timezone shifts, ambiguous formats, and reliable patterns for date handling in Embedded Finance components (DATE_PARSING_GUIDE.md).',
      date: '2025-04-28',
      readTime: '6 min read',
      tags: ['TypeScript', 'Dates', 'Parsing'],
      link: '/stories/date-selector-challenges',
    },
    {
      id: 'important-date-selector-component',
      title: 'Important Date Selector Component Recipe',
      excerpt:
        'Design guidelines and accessibility patterns for ImportantDateSelector (IMPORTANT_DATE_SELECTOR_RECIPE.md).',
      date: '2025-06-12',
      readTime: '10 min read',
      tags: ['Components', 'Accessibility', 'Dates'],
      link: '/stories/important-date-selector-component',
    },
    {
      id: 'partially-hosted-onboarding',
      title: 'Hosted Onboarding UI Integration Guide',
      excerpt:
        'Session transfer, iframe embedding, and security for the hosted onboarding experience (PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md).',
      date: '2026-03-12',
      readTime: '25 min read',
      tags: ['Onboarding', 'Hosted UI', 'Integration'],
      link: '/stories/partially-hosted-onboarding',
      external: false,
      icon: <UserCog className="h-5 w-5" />,
    },
  ];

  return (
    <section id="recipes" className="bg-jpm-white py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-page-h2 text-jpm-gray-900">
            Engineering Recipes
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-page-body text-jpm-gray">
            Practical guides and case studies for building embedded finance
            solutions and integrating our components.
          </p>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="h-70 flex flex-col overflow-hidden rounded-page-md border-0 bg-jpm-white shadow-page-card"
              >
                <CardHeader className="min-h-[4rem] flex-shrink-0 border-b border-sp-border bg-sp-accent p-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-start text-base font-semibold leading-tight">
                      <div className="mr-2 flex-shrink-0 rounded-page-sm border border-sp-border bg-white p-1 text-sp-brand">
                        {recipe.icon ? (
                          recipe.icon
                        ) : (
                          <Calendar className="h-5 w-5" />
                        )}
                      </div>
                      <span className="line-clamp-2">{recipe.title}</span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="mb-4 flex-1">
                    <p className="line-clamp-4 text-sm leading-relaxed text-jpm-gray">
                      {recipe.excerpt}
                    </p>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-page-sm border border-sp-border bg-sp-accent px-2 py-1 text-page-small text-sp-brand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* Action button perfectly bottom-aligned and always visible */}
                  <div className="mt-auto flex w-full items-center justify-center border-t border-gray-100 pb-1 pt-3">
                    {recipe.external ? (
                      <Button
                        asChild
                        variant="outline"
                        className="flex items-center whitespace-nowrap rounded-page-md border-sp-brand font-semibold text-sp-brand hover:bg-sp-accent"
                      >
                        <a
                          href={recipe.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Read More
                        </a>
                      </Button>
                    ) : (
                      <Link to={recipe.link}>
                        <Button
                          variant="outline"
                          className="flex items-center whitespace-nowrap rounded-page-md border-sp-brand font-semibold text-sp-brand hover:bg-sp-accent"
                        >
                          Read More
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
