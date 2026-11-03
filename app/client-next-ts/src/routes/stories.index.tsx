import { ArrowRight, Calendar, Compass, RefreshCw } from 'lucide-react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STORIES } from '@/lib/stories-catalog';
import { formatIsoDate } from '@/lib/utils';

export const Route = createFileRoute('/stories/')({
  component: StoriesIndex,
});

function StoriesIndex() {
  return (
    <div className="bg-jpm-white py-6">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        <div className="mb-8">
          <h1 className="mb-3 text-page-hero text-jpm-gray-900">
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

        <div className="space-y-6">
          {STORIES.map((story) => (
            <Card
              key={story.id}
              className="rounded-page-md border-0 bg-jpm-white shadow-page-card"
            >
              <CardHeader className="pb-3">
                <div className="mb-2 flex flex-wrap items-center gap-y-1 text-page-small text-jpm-gray">
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
                <CardTitle className="mb-3 text-page-h3 text-jpm-gray-900">
                  {story.title}
                </CardTitle>
                <p className="text-page-body leading-relaxed text-jpm-gray">
                  {story.excerpt}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                  <div className="flex flex-wrap items-center gap-1">
                    {story.interactiveLink ? (
                      <Link
                        to={story.interactiveLink.to}
                        className="inline-flex"
                      >
                        <Button
                          variant="ghost"
                          className="whitespace-nowrap rounded-page-md px-4 font-semibold text-sp-brand shadow-none hover:bg-sp-accent hover:text-sp-brand"
                        >
                          <Compass className="h-4 w-4 flex-shrink-0" />
                          {story.interactiveLink.label.toUpperCase()}
                        </Button>
                      </Link>
                    ) : null}
                    <Link
                      to="/stories/$storyId"
                      params={{ storyId: story.id }}
                      className="inline-flex"
                    >
                      <Button
                        variant="ghost"
                        className="whitespace-nowrap rounded-page-md px-5 font-semibold text-sp-brand shadow-none hover:bg-sp-accent hover:text-sp-brand sm:px-6"
                      >
                        READ MORE
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
