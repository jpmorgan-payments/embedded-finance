import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { z } from 'zod';

// Parameter validation schema
const blogPostSearchSchema = z.object({
  postId: z.enum([
    'date-selector-challenges',
    'important-date-selector-component',
  ]),
});

// Dynamic imports for blog posts
const DateSelectorChallenges = lazy(
  () => import('@/content/blog/date-selector-challenges'),
);
const ImportantDateSelectorComponent = lazy(
  () => import('@/content/blog/important-date-selector-component'),
);

// Blog post metadata
const blogPostMeta = {
  'date-selector-challenges': {
    title: 'Tackling Date Input Challenges: Common User Errors and Solutions',
    date: '2025-06-03',
    readTime: '5 min read',
    tags: ['UX', 'Date Input', 'User Experience'],
    component: DateSelectorChallenges,
  },
  'important-date-selector-component': {
    title:
      'Building an Accessible Important Date Selector: A Component Design Case Study',
    date: '2025-06-05',
    readTime: '7 min read',
    tags: ['Component Design', 'Accessibility', 'React'],
    component: ImportantDateSelectorComponent,
  },
} as const;

export const Route = createFileRoute('/blog/$postId')({
  // Parameter validation
  params: {
    parse: (params) => ({
      postId: blogPostSearchSchema.shape.postId.parse(params.postId),
    }),
    stringify: ({ postId }) => ({ postId }),
  },
  // Loader function for data fetching
  loader: ({ params }) => {
    const post = blogPostMeta[params.postId];
    if (!post) {
      throw notFound();
    }
    return { post, postId: params.postId };
  },
  // Component with proper error boundaries
  component: BlogPost,
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
            Blog Post Not Found
          </h1>
          <p className="text-page-body text-jpm-gray mb-6">
            The blog post you're looking for doesn't exist.
          </p>
          <Link to="/blog">
            <Button
              variant="outline"
              className="border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100 rounded-page-md"
            >
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  ),
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  const PostComponent = post.component;

  return (
    <div className="py-8 bg-jpm-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <Link to="/blog">
            <Button
              variant="outline"
              className="border-jpm-gray-300 text-jpm-gray hover:bg-jpm-gray-100 rounded-page-md flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Post header */}
        <header className="mb-8">
          <div className="flex items-center text-page-small text-jpm-gray mb-4">
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

          <h1 className="text-page-hero text-jpm-gray-900 mb-4">
            {post.title}
          </h1>

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
        </header>

        {/* Post content */}
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
            <PostComponent />
          </Suspense>
        </article>
      </div>
    </div>
  );
}
