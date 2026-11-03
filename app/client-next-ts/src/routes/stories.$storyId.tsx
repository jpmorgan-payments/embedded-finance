import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react';
import { z } from 'zod';

import { createFileRoute, Link, notFound } from '@tanstack/react-router';

import { StoryRecipeGithubActions } from '@/components/stories/story-recipe-github-actions';
import { Button } from '@/components/ui/button';
import { getStory, STORY_IDS, type StoryId } from '@/lib/stories-catalog';
import { storyHasLlmSource } from '@/lib/story-llm-sources';
import { formatIsoDate } from '@/lib/utils';

const storyIdSchema = z.enum(STORY_IDS);

const storyComponents: Record<StoryId, LazyExoticComponent<ComponentType>> = {
  'ux-atlas': lazy(() => import('@/content/stories/ux-atlas')),
  'publicly-traded-companies-recipe': lazy(
    () => import('@/content/stories/publicly-traded-companies-recipe')
  ),
  'approved-client-maintenance-recipe': lazy(
    () => import('@/content/stories/approved-client-maintenance-recipe')
  ),
  'cross-border-fx-payout-client-recipe': lazy(
    () => import('@/content/stories/cross-border-fx-payout-client-recipe')
  ),
  'core-functional-requirements-index': lazy(
    () => import('@/content/stories/core-functional-requirements-index')
  ),
  'list-transactions-recipe': lazy(
    () => import('@/content/stories/list-transactions-recipe')
  ),
  'partially-hosted-onboarding': lazy(
    () => import('@/content/stories/partially-hosted-onboarding')
  ),
  'webhook-integration-recipe': lazy(
    () => import('@/content/stories/webhook-integration-recipe')
  ),
  'important-date-selector-component': lazy(
    () => import('@/content/stories/important-date-selector-component')
  ),
  'date-selector-challenges': lazy(
    () => import('@/content/stories/date-selector-challenges')
  ),
  'digital-onboarding-recipe': lazy(
    () => import('@/content/stories/digital-onboarding-recipe')
  ),
};

export const Route = createFileRoute('/stories/$storyId')({
  // Parameter validation
  params: {
    parse: (params) => ({
      storyId: storyIdSchema.parse(params.storyId),
    }),
    stringify: ({ storyId }) => ({ storyId }),
  },
  // Loader function for data fetching
  loader: ({ params }) => {
    const story = getStory(params.storyId);
    if (!story) {
      throw notFound();
    }
    return { story, storyId: params.storyId };
  },
  // Component with proper error boundaries
  component: Story,
  // Loading component
  pendingComponent: () => (
    <div className="bg-jpm-white py-6">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
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
    <div className="bg-jpm-white py-6">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
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
  const StoryComponent = storyComponents[storyId];

  return (
    <div className="bg-jpm-white py-6">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        {/* Back button */}
        <div className="mb-5">
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
        <header className="mb-5">
          <div className="mb-3 flex flex-wrap items-center gap-y-1 text-page-small text-jpm-gray">
            <Calendar className="mr-2 h-4 w-4" />
            <time dateTime={story.date}>{formatIsoDate(story.date)}</time>
            <span className="mx-2">•</span>
            <span>{story.readTime}</span>
            {story.updated ? (
              <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Updated{' '}
                <time dateTime={story.updated}>
                  {formatIsoDate(story.updated, 'short')}
                </time>
              </span>
            ) : null}
          </div>

          <h1 className="mb-3 text-page-hero text-jpm-gray-900">
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

          {storyHasLlmSource(storyId) ? (
            <div className="mt-3 border-t border-jpm-gray-100 pt-3">
              <StoryRecipeGithubActions storyId={storyId} />
            </div>
          ) : null}
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
