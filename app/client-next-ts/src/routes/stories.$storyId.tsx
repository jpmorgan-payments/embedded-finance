import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { z } from 'zod';

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
  () => import('@/content/stories/date-selector-challenges'),
);
const ImportantDateSelectorComponent = lazy(
  () => import('@/content/stories/important-date-selector-component'),
);
const PartiallyHostedOnboarding = lazy(
  () => import('../content/stories/partially-hosted-onboarding'),
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
    <div className="py-8 bg-jpm-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-jpm-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-jpm-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-jpm-gray-200 rounded"></div>
            <div className="h-4 bg-jpm-gray-200 rounded"></div>
            <div className="h-4 bg-jpm-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  // Error component
  errorComponent: () => (
    <div className="py-8 bg-jpm-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-page-h2 text-jpm-gray-900 mb-4">
            Story Not Found
          </h1>
          <p className="text-page-body text-jpm-gray mb-6">
            The story you're looking for doesn't exist.
          </p>
          <Link to="/stories">
            <Button
              variant="outline"
              className="border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100 rounded-page-md"
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
    <div className="py-8 bg-jpm-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <Link to="/stories">
            <Button
              variant="outline"
              className="border-sp-brand text-sp-brand hover:bg-sp-accent rounded-page-md flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK TO RECIPES
            </Button>
          </Link>
        </div>

        {/* Story header */}
        <header className="mb-8">
          <div className="flex items-center text-page-small text-jpm-gray mb-4">
            <Calendar className="h-4 w-4 mr-2" />
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

          <h1 className="text-page-hero text-jpm-gray-900 mb-4">
            {story.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-sp-accent text-sp-brand text-page-small rounded-page-sm border border-sp-border"
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
                <div className="h-4 bg-jpm-gray-200 rounded"></div>
                <div className="h-4 bg-jpm-gray-200 rounded"></div>
                <div className="h-4 bg-jpm-gray-200 rounded"></div>
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
