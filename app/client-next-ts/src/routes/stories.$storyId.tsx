import { lazy, Suspense } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { z } from 'zod';

import { createFileRoute, Link, notFound } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

// Parameter validation schema
const storySearchSchema = z.object({
  storyId: z.enum([
    'date-selector-challenges',
    'important-date-selector-component',
    'partially-hosted-onboarding',
  ]),
});

// Dynamic imports for stories
const DateSelectorChallenges = lazy(
  () => import('@/content/stories/date-selector-challenges')
);
const ImportantDateSelectorComponent = lazy(
  () => import('@/content/stories/important-date-selector-component')
);
const PartiallyHostedOnboarding = lazy(
  () => import('../content/stories/partially-hosted-onboarding')
);

// Story metadata (serializable data only)
const storyMeta = {
  'date-selector-challenges': {
    title: 'Tackling Date Input Challenges: Common User Errors and Solutions',
    date: '2025-06-03',
    readTime: '5 min read',
    tags: ['UX', 'Date Input', 'User Experience'],
  },
  'important-date-selector-component': {
    title:
      'Building an Accessible Important Date Selector: A Component Design Case Study',
    date: '2025-06-05',
    readTime: '7 min read',
    tags: ['Component Design', 'Accessibility', 'React'],
  },
  'partially-hosted-onboarding': {
    title: 'Partially Hosted Onboarding Integration',
    date: '2024-12-01',
    readTime: '6 min read',
    tags: ['Onboarding', 'Integration', 'Hybrid'],
  },
} as const;

// Component mapping (separate from serializable data)
const storyComponents = {
  'date-selector-challenges': DateSelectorChallenges,
  'important-date-selector-component': ImportantDateSelectorComponent,
  'partially-hosted-onboarding': PartiallyHostedOnboarding,
} as const;

export const Route = createFileRoute('/stories/$storyId')({
  // Parameter validation
  params: {
    parse: (params) => ({
      storyId: storySearchSchema.shape.storyId.parse(params.storyId),
    }),
    stringify: ({ storyId }) => ({ storyId }),
  },
  // Loader function for data fetching
  loader: ({ params }) => {
    const story = storyMeta[params.storyId];
    if (!story) {
      throw notFound();
    }
    return { story, storyId: params.storyId };
  },
  // Component with proper error boundaries
  component: Story,
  // Loading component
  pendingComponent: () => (
    <div className="bg-jpm-white py-8">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 rounded bg-jpm-gray-200"></div>
          <div className="mb-8 h-12 rounded bg-jpm-gray-200"></div>
          <div className="space-y-4">
            <div className="h-4 rounded bg-jpm-gray-200"></div>
            <div className="h-4 rounded bg-jpm-gray-200"></div>
            <div className="h-4 rounded bg-jpm-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  // Error component
  errorComponent: () => (
    <div className="bg-jpm-white py-8">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-page-h2 text-jpm-gray-900">
            Story Not Found
          </h1>
          <p className="mb-6 text-page-body text-jpm-gray">
            The story you're looking for doesn't exist.
          </p>
          <Link to="/stories">
            <Button
              variant="outline"
              className="rounded-page-md border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100"
            >
              Back to Recipes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  ),
});

function Story() {
  const { story, storyId } = Route.useLoaderData();
  const StoryComponent =
    storyComponents[storyId as keyof typeof storyComponents];

  return (
    <div className="bg-jpm-white py-8">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <Link to="/stories">
            <Button
              variant="outline"
              className="flex items-center rounded-page-md border-sp-brand text-sp-brand hover:bg-sp-accent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK TO RECIPES
            </Button>
          </Link>
        </div>

        {/* Story header */}
        <header className="mb-8">
          <div className="mb-4 flex items-center text-page-small text-jpm-gray">
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

          <h1 className="mb-4 text-page-hero text-jpm-gray-900">
            {story.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-page-sm border border-sp-border bg-sp-accent px-2 py-1 text-page-small text-sp-brand"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Story content */}
        <article className="prose prose-lg max-w-none">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-4 rounded bg-jpm-gray-200"></div>
                <div className="h-4 rounded bg-jpm-gray-200"></div>
                <div className="h-4 rounded bg-jpm-gray-200"></div>
              </div>
            }
          >
            <StoryComponent />
          </Suspense>
        </article>
      </div>
    </div>
  );
}
