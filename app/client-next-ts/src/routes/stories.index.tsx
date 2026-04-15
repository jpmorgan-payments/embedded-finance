import { ArrowRight, Calendar } from 'lucide-react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/stories/')({
  component: StoriesIndex,
});

// Latest first.
const stories = [
  {
    id: 'core-functional-requirements-index' as const,
    title: 'Core functional requirements — cross-reference',
    excerpt:
      'Single index of GitHub links to every functional requirements markdown file under embedded-components/src/core for each active core component.',
    date: '2026-04-15',
    readTime: '5 min read',
    tags: ['Documentation', 'Requirements', 'Core'],
  },
  {
    id: 'partially-hosted-onboarding' as const,
    title: 'Hosted Onboarding UI Integration Guide',
    excerpt:
      'Integrate the hosted Onboarding UI into your platform with session transfer, iframe embedding, postMessage, and security guidance. Source: PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md.',
    date: '2026-03-12',
    readTime: '25 min read',
    tags: ['Onboarding', 'Hosted UI', 'Integration'],
  },
  {
    id: 'webhook-integration-recipe' as const,
    title: 'Webhook Integration Recipe: UX Guidance',
    excerpt:
      'Suggested UI/UX principles for webhook integration: event types, client-facing vs partner-platform surfaces, onboarding and operations patterns, and reconciliation. Source: WEBHOOK_INTEGRATION_RECIPE.md.',
    date: '2026-01-08',
    readTime: '12 min read',
    tags: ['Webhooks', 'Integration', 'UX'],
  },
  {
    id: 'important-date-selector-component' as const,
    title: 'Important Date Selector Component Recipe',
    excerpt:
      'Design guidelines for ImportantDateSelector: problem analysis, accessibility, validation, and implementation notes for embedded finance. Source: IMPORTANT_DATE_SELECTOR_RECIPE.md.',
    date: '2025-06-12',
    readTime: '10 min read',
    tags: ['Components', 'Accessibility', 'Dates'],
  },
  {
    id: 'date-selector-challenges' as const,
    title: 'JavaScript/TypeScript Date Parsing Guide',
    excerpt:
      'Common date parsing pitfalls in JS/TS (timezones, ambiguous strings, DST) and reliable patterns for Embedded Finance components. Source: DATE_PARSING_GUIDE.md.',
    date: '2025-04-28',
    readTime: '6 min read',
    tags: ['TypeScript', 'Dates', 'Parsing'],
  },
] as const;

function StoriesIndex() {
  return (
    <div className="bg-jpm-white py-8">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="mb-4 text-page-hero text-jpm-gray-900">
            Engineering Recipes
          </h1>
          <p className="max-w-2xl text-page-body leading-relaxed text-jpm-gray">
            Technical guides from{' '}
            <code className="rounded bg-jpm-gray-100 px-1.5 py-0.5 font-mono text-page-small text-jpm-gray-900">
              embedded-components/docs
            </code>
            .
          </p>
        </div>

        <div className="space-y-8">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="rounded-page-md border-0 bg-jpm-white shadow-page-card"
            >
              <CardHeader className="pb-4">
                <div className="mb-2 flex items-center text-page-small text-jpm-gray">
                  <Calendar className="mr-2 h-4 w-4" />
                  <time dateTime={story.date}>
                    {new Date(story.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span className="mx-2">•</span>
                  <span>{story.readTime}</span>
                </div>
                <CardTitle className="mb-3 text-page-h3 text-jpm-gray-900">
                  {story.title}
                </CardTitle>
                <p className="text-page-body leading-relaxed text-jpm-gray">
                  {story.excerpt}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-page-sm border border-sp-border bg-sp-accent px-2 py-1 text-page-small text-sp-brand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link to="/stories/$storyId" params={{ storyId: story.id }}>
                    <Button
                      variant="outline"
                      className="flex items-center whitespace-nowrap rounded-page-md border-sp-brand font-semibold text-sp-brand hover:bg-sp-accent"
                    >
                      READ MORE
                      <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
