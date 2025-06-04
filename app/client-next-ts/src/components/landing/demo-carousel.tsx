'use client';

import { useState, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const demos = [
  {
    id: 'sellsense',
    title: 'Sellsense Marketplace',
    description:
      'A marketplace platform with embedded finance tools for sellers to manage payments and onboarding.',
    image: '/marketplace-dashboard.png',
    link: '/sellsense-demo',
    active: true,
  },
  {
    id: 'commerce',
    title: 'Create Commerce',
    description:
      'An e-commerce platform with integrated payment processing and financial management tools.',
    image: '/ecommerce-platform-concept.png',
    link: '#',
    active: false,
  },
  {
    id: 'platform',
    title: 'Demo Platform',
    description:
      'A comprehensive platform showcasing all embedded finance capabilities in one interface.',
    image: '/modern-finance-platform.png',
    link: '#',
    active: false,
  },
  {
    id: 'banking',
    title: 'Digital Banking',
    description:
      'A modern banking interface with account management and transaction capabilities.',
    image: '/digital-banking-concept.png',
    link: '#',
    active: false,
  },
  {
    id: 'fintech',
    title: 'FinTech Suite',
    description:
      'Complete financial technology solution with payments, lending, and analytics.',
    image: '/fintech-suite-concept.png',
    link: '#',
    active: false,
  },
];

export function DemoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const VISIBLE_DEMOS = 3;
  const maxIndex = Math.max(0, demos.length - VISIBLE_DEMOS);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  return (
    <section className="py-12 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Explore Demo Applications
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-12 max-w-3xl mx-auto">
            Interactive demonstrations showcasing different embedded finance use
            cases and implementation patterns.
          </p>

          <div className="relative">
            <div className="overflow-hidden">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${(currentIndex * 100) / VISIBLE_DEMOS}%)`,
                  width: `${(demos.length * 100) / VISIBLE_DEMOS}%`,
                }}
              >
                {demos.map((demo) => (
                  <div
                    key={demo.id}
                    className="flex-shrink-0 px-4"
                    style={{ width: `${100 / demos.length}%` }}
                  >
                    <Card className="h-full border-0 shadow-page-card bg-jpm-white overflow-hidden rounded-page-lg">
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={demo.image || '/placeholder.svg'}
                          alt={demo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-8">
                        <h3 className="text-page-h4 text-jpm-gray-900 mb-4">
                          {demo.title}
                        </h3>
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-6">
                          {demo.description}
                        </p>
                        <Button
                          asChild={demo.active}
                          variant={demo.active ? 'default' : 'outline'}
                          className={`w-full rounded-page-md font-semibold ${
                            demo.active
                              ? 'bg-jpm-brown hover:bg-jpm-brown-700 text-jpm-white shadow-page-card'
                              : 'border-jpm-gray-300 text-jpm-gray opacity-50 cursor-not-allowed'
                          }`}
                          disabled={!demo.active}
                        >
                          {demo.active ? (
                            <Link to={demo.link}>Launch Demo</Link>
                          ) : (
                            <span>Coming Soon</span>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons - only show if we can navigate */}
            {demos.length > VISIBLE_DEMOS && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-jpm-white rounded-full h-12 w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6 text-jpm-gray" />
                  <span className="sr-only">Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-jpm-white rounded-full h-12 w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={nextSlide}
                  disabled={currentIndex === maxIndex}
                >
                  <ChevronRight className="h-6 w-6 text-jpm-gray" />
                  <span className="sr-only">Next</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators - only show if we can navigate */}
          {demos.length > VISIBLE_DEMOS && (
            <div className="flex justify-center mt-8 gap-3">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-jpm-brown' : 'bg-jpm-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
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
