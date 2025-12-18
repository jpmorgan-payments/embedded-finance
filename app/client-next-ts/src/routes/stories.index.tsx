import { ArrowRight, Calendar } from 'lucide-react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/stories/')({
  component: StoriesIndex,
});

const stories = [
  {
    id: 'date-selector-challenges' as const,
    title: 'Tackling Date Input Challenges: Common User Errors and Solutions',
    excerpt:
      "Our team's experience implementing date selectors revealed critical UX issues that impact user experience. Learn from our mistakes and discover better approaches.",
    date: '2024-12-23',
    readTime: '5 min read',
    tags: ['UX', 'Date Input', 'User Experience'],
  },
  {
    id: 'important-date-selector-component' as const,
    title:
      'Building an Accessible Important Date Selector: A Component Design Case Study',
    excerpt:
      'Follow-up to our date input challenges: How we designed and built a specialized Important Date Selector component that prioritizes accessibility and user experience.',
    date: '2024-12-30',
    readTime: '7 min read',
    tags: ['Component Design', 'Accessibility', 'React'],
  },
  {
    id: 'partially-hosted-onboarding' as const,
    title: 'Partially Hosted Onboarding Integration',
    excerpt:
      'Implement a hybrid onboarding approach where parts of client verification are handled in your app while leveraging embedded components for regulated steps.',
    date: '2025-06-12',
    readTime: '6 min read',
    tags: ['Onboarding', 'Integration', 'Hybrid'],
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
            Insights from our engineering team on building embedded finance
            solutions, component design patterns, and user experience lessons
            learned.
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
