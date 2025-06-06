import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/blog/')({
  component: BlogIndex,
});

const blogPosts = [
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
] as const;

function BlogIndex() {
  return (
    <div className="py-8 bg-jpm-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-page-hero text-jpm-gray-900 mb-4">
            Engineering Blog
          </h1>
          <p className="text-page-body text-jpm-gray leading-relaxed max-w-2xl">
            Insights from our engineering team on building embedded finance and
            solutions, component design patterns, and user experience lessons
            learned.
          </p>
        </div>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="border-0 shadow-page-card bg-jpm-white rounded-page-lg"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center text-page-small text-jpm-gray mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>
                <CardTitle className="text-page-h3 text-jpm-gray-900 mb-3">
                  {post.title}
                </CardTitle>
                <p className="text-page-body text-jpm-gray leading-relaxed">
                  {post.excerpt}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-jpm-brown-100 text-jpm-brown text-page-small rounded-page-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link to="/blog/$postId" params={{ postId: post.id }}>
                    <Button
                      variant="outline"
                      className="border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100 rounded-page-md font-semibold flex items-center whitespace-nowrap"
                    >
                      Read More
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
