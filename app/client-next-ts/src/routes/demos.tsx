import { ArrowRight, Play } from 'lucide-react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_APPS } from '@/data/demo-apps';

export const Route = createFileRoute('/demos')({
  component: DemosPage,
});

function DemosPage() {
  return (
    <div className="min-h-screen bg-sp-bg py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-page-h2 font-bold text-jpm-gray-900">
            Interactive Demo Applications
          </h1>
          <p className="mx-auto max-w-3xl text-page-body leading-relaxed text-jpm-gray">
            Explore live demonstrations of embedded finance solutions in action.
            Each demo showcases different use cases and implementation patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {DEMO_APPS.map((demo) => (
            <Card
              key={demo.id}
              className="flex flex-col overflow-hidden rounded-page-md border-0 bg-jpm-white shadow-page-card"
            >
              <Link
                to={demo.link}
                className="group block aspect-video w-full overflow-hidden"
                aria-label={`Launch ${demo.title}`}
              >
                <img
                  src={demo.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </Link>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-page-h4 text-jpm-gray-900">
                    {demo.title}
                  </CardTitle>
                  <span className="whitespace-nowrap rounded-page-sm border border-sp-border bg-sp-accent px-2 py-1 text-page-small font-medium text-sp-brand">
                    {demo.kind}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6">
                <p className="mb-6 text-page-body leading-relaxed text-jpm-gray">
                  {demo.description}
                </p>

                <div className="mb-6">
                  <h4 className="mb-3 text-page-small font-semibold text-jpm-gray-900">
                    Features Demonstrated:
                  </h4>
                  <ul className="space-y-2 text-page-small text-jpm-gray">
                    {demo.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <div className="mr-3 h-1.5 w-1.5 rounded-full bg-jpm-brown"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  asChild
                  className="mt-auto w-full rounded-page-md border-0 bg-sp-brand font-semibold text-white shadow-page-card hover:bg-sp-brand-700"
                >
                  <Link to={demo.link} className="flex items-center">
                    <Play className="mr-2 h-4 w-4" />
                    LAUNCH DEMO
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
