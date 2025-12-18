'use client';

import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <section id="demo-applications" className="py-8 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Explore Demo Applications
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-8 max-w-3xl mx-auto">
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
                    className="flex-shrink-0 px-2 sm:px-3 md:px-4 pb-4"
                    style={{ width: `${itemWidthPercent}%` }}
                  >
                    <Card className="h-full border-0 shadow-page-card bg-jpm-white overflow-hidden rounded-page-md">
                      <div className="bg-sp-accent p-4 min-h-[4rem] flex-shrink-0 border-b border-sp-border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start text-base font-semibold leading-tight">
                            <span className="line-clamp-2 text-sp-brand">
                              {demo.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <span
                              className={`px-1.5 py-0.5 text-xs font-medium rounded-page-sm ${
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
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4 sm:p-6 md:p-8">
                        <p className="text-sm sm:text-base md:text-page-body text-jpm-gray leading-relaxed mb-4 sm:mb-5 md:mb-6">
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
                              className="w-full rounded-page-md font-semibold text-sm sm:text-base bg-sp-brand hover:bg-sp-brand-700 text-white shadow-page-card"
                            >
                              LAUNCH DEMO
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full rounded-page-md font-semibold text-sm sm:text-base border-jpm-gray-300 text-jpm-gray opacity-50 cursor-not-allowed"
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-3 md:-translate-x-4 bg-jpm-white rounded-full h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 shadow-page-card border-sp-border hover:bg-sp-accent disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  onClick={prevSlide}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-sp-brand" />
                  <span className="sr-only">Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-3 md:translate-x-4 bg-jpm-white rounded-full h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 shadow-page-card border-sp-border hover:bg-sp-accent disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  onClick={nextSlide}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-sp-brand" />
                  <span className="sr-only">Next</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators - only show if we can navigate */}
          {canNavigate && (
            <div className="flex justify-center mt-6 md:mt-8 gap-2 md:gap-3">
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
