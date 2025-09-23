import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, UserCog } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function RecipesSection() {
  const recipes = [
    {
      id: 'date-selector-challenges',
      title: 'Tackling Date Input Challenges: Common User Errors and Solutions',
      excerpt:
        "Our team's experience implementing date selectors revealed critical UX issues that impact user experience. Learn from our mistakes and discover better approaches.",
      date: '2024-12-23',
      readTime: '5 min read',
      tags: ['UX', 'Date Input', 'User Experience'],
      link: '/stories/date-selector-challenges',
    },
    {
      id: 'important-date-selector-component',
      title:
        'Building an Accessible Important Date Selector: A Component Design Case Study',
      excerpt:
        'Follow-up to our date input challenges: How we designed and built a specialized Important Date Selector component that prioritizes accessibility and user experience.',
      date: '2024-12-30',
      readTime: '7 min read',
      tags: ['Component Design', 'Accessibility', 'React'],
      link: '/stories/important-date-selector-component',
    },
    {
      id: 'partially-hosted-onboarding',
      title: 'Partially Hosted Onboarding Integration',
      excerpt:
        'Implement a hybrid onboarding approach where parts of the client verification process are handled by your application while leveraging embedded components.',
      date: '2024-12-01',
      readTime: '6 min read',
      tags: ['Onboarding', 'Integration', 'Hybrid'],
      link: '/stories/partially-hosted-onboarding',
      external: false,
      icon: <UserCog className="h-5 w-5" />,
    },
  ];

  return (
    <section id="recipes" className="py-8 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Engineering Recipes
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-8 max-w-2xl mx-auto">
            Practical guides and case studies for building embedded finance
            solutions and integrating our components.
          </p>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden border-0 shadow-page-card bg-jpm-white rounded-page-md h-70 flex flex-col"
              >
                <CardHeader className="bg-sp-accent p-4 min-h-[4rem] flex-shrink-0 border-b border-sp-border">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-start text-base font-semibold leading-tight">
                      <div className="bg-white p-1 rounded-page-sm mr-2 text-sp-brand flex-shrink-0 border border-sp-border">
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
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1 mb-4">
                    <p className="text-sm text-jpm-gray leading-relaxed line-clamp-4">
                      {recipe.excerpt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-sp-accent text-sp-brand text-page-small rounded-page-sm border border-sp-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* Action button perfectly bottom-aligned and always visible */}
                  <div className="w-full flex justify-center items-center mt-auto pt-3 pb-1 border-t border-gray-100">
                    {recipe.external ? (
                      <Button
                        asChild
                        variant="outline"
                        className="border-sp-brand text-sp-brand hover:bg-sp-accent rounded-page-md font-semibold flex items-center whitespace-nowrap"
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
                          className="border-sp-brand text-sp-brand hover:bg-sp-accent rounded-page-md font-semibold flex items-center whitespace-nowrap"
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
