'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useResponsiveCarousel } from '@/hooks/use-responsive-carousel';

const demos = [
  {
    id: 'sellsense',
    title: 'Sellsense Marketplace',
    description:
      'A marketplace platform with embedded finance tools for sellers to manage payments and onboarding.',
    image: '/marketplace-dashboard.png',
    link: '/sellsense-demo?scenario=New+Seller+-+Onboarding',
    status: 'testing',
  },
  {
    id: 'commerce',
    title: 'Create Commerce',
    description:
      'An e-commerce platform with integrated payment processing and financial management tools.',
    image: '/ecommerce-platform-concept.png',
    link: '#',
    status: 'coming soon',
  },
  {
    id: 'platform',
    title: 'Demo Platform',
    description:
      'A comprehensive platform showcasing all embedded finance capabilities in one interface.',
    image: '/modern-finance-platform.png',
    link: '#',
    status: 'coming soon',
  },
];

export function DemoCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const {
    currentIndex,
    nextSlide,
    prevSlide,
    goToSlide,
    transformPercent,
    containerWidthPercent,
    itemWidthPercent,
    canNavigate,
    canGoNext,
    canGoPrev,
    totalSlides,
  } = useResponsiveCarousel({
    totalItems: demos.length,
  });

  return (
    <section id="demo-applications" className="bg-jpm-white py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-page-h2 text-jpm-gray-900">
            Explore Demo Applications
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-center text-page-body text-jpm-gray">
            Interactive demonstrations showcasing different embedded finance use
            cases and implementation patterns.
          </p>

          <div className="relative">
            <div className="overflow-x-hidden overflow-y-visible">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${transformPercent}%)`,
                  width: `${containerWidthPercent}%`,
                }}
              >
                {demos.map((demo) => (
                  <div
                    key={demo.id}
                    className="flex-shrink-0 px-2 pb-4 sm:px-3 md:px-4"
                    style={{ width: `${itemWidthPercent}%` }}
                  >
                    <Card className="h-full overflow-hidden rounded-page-md border-0 bg-jpm-white shadow-page-card">
                      <div className="min-h-[4rem] flex-shrink-0 border-b border-sp-border bg-sp-accent p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start text-base font-semibold leading-tight">
                            <span className="line-clamp-2 text-sp-brand">
                              {demo.title}
                            </span>
                          </div>
                          <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                            <span
                              className={`rounded-page-sm px-1.5 py-0.5 text-xs font-medium ${
                                demo.status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : demo.status === 'testing'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {demo.status === 'available'
                                ? 'Available'
                                : demo.status === 'testing'
                                  ? 'Testing'
                                  : 'Coming Soon'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={demo.image || '/placeholder.svg'}
                          alt={demo.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4 sm:p-6 md:p-8">
                        <p className="mb-4 text-sm leading-relaxed text-jpm-gray sm:mb-5 sm:text-base md:mb-6 md:text-page-body">
                          {demo.description}
                        </p>
                        {demo.status === 'available' ||
                        demo.status === 'testing' ? (
                          <Link
                            to={demo.link}
                            resetScroll={false}
                            className="block w-full"
                          >
                            <Button
                              variant="default"
                              className="w-full rounded-page-md bg-sp-brand text-sm font-semibold text-white shadow-page-card hover:bg-sp-brand-700 sm:text-base"
                            >
                              LAUNCH DEMO
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full cursor-not-allowed rounded-page-md border-jpm-gray-300 text-sm font-semibold text-jpm-gray opacity-50 sm:text-base"
                            disabled
                          >
                            COMING SOON
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons - only show if we can navigate */}
            {canNavigate && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 z-10 h-10 w-10 -translate-x-2 -translate-y-1/2 rounded-full border-sp-border bg-jpm-white shadow-page-card hover:bg-sp-accent disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11 sm:-translate-x-3 md:h-12 md:w-12 md:-translate-x-4"
                  onClick={prevSlide}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="h-4 w-4 text-sp-brand sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span className="sr-only">Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 translate-x-2 rounded-full border-sp-border bg-jpm-white shadow-page-card hover:bg-sp-accent disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11 sm:translate-x-3 md:h-12 md:w-12 md:translate-x-4"
                  onClick={nextSlide}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4 text-sp-brand sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span className="sr-only">Next</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators - only show if we can navigate */}
          {canNavigate && (
            <div className="mt-6 flex justify-center gap-2 md:mt-8 md:gap-3">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-sp-brand' : 'bg-jpm-gray-300'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to position ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
