/**
 * CompactHomepage1 Component
 *
 * Refined variant with frontend design principles: distinctive typography, sophisticated motion,
 * spatial composition, and layered visual details
 */

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Box, Play, Wrench } from 'lucide-react';

import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IntegrationScenarios } from '../compact-homepage/IntegrationScenarios';

const navigationCards = [
  {
    id: 'demos',
    title: 'Demo Applications',
    description:
      'Working implementations showcasing embedded finance features in real-world scenarios.',
    icon: <Play className="h-6 w-6" />,
    link: '/demos',
    count: 3,
    accentColor: 'bg-gradient-to-br from-[rgb(26,123,153)]/15 to-[rgb(26,123,153)]/5',
    iconBg: 'bg-gradient-to-br from-[rgb(26,123,153)]/20 to-[rgb(26,123,153)]/10',
    borderGradient: 'from-[rgb(26,123,153)]',
  },
  {
    id: 'components',
    title: 'Business Components',
    description:
      'Pre-built React components for embedded banking workflows with API integration.',
    icon: <Box className="h-6 w-6" />,
    link: '/components',
    count: 6,
    accentColor: 'bg-gradient-to-br from-[rgb(177,121,207)]/15 to-[rgb(177,121,207)]/5',
    iconBg: 'bg-gradient-to-br from-[rgb(177,121,207)]/20 to-[rgb(177,121,207)]/10',
    borderGradient: 'from-[rgb(177,121,207)]',
  },
  {
    id: 'recipes',
    title: 'Implementation Guides',
    description:
      'Technical guides and best practices for building embedded finance solutions.',
    icon: <BookOpen className="h-6 w-6" />,
    link: '/stories',
    count: 3,
    accentColor: 'bg-gradient-to-br from-[rgb(226,110,0)]/15 to-[rgb(226,110,0)]/5',
    iconBg: 'bg-gradient-to-br from-[rgb(226,110,0)]/20 to-[rgb(226,110,0)]/10',
    borderGradient: 'from-[rgb(226,110,0)]',
  },
  {
    id: 'utils',
    title: 'Utility Components',
    description:
      'Specialized form components with validation and formatting for financial applications.',
    icon: <Wrench className="h-6 w-6" />,
    link: '/utils',
    count: 4,
    accentColor: 'bg-gradient-to-br from-[rgb(26,123,153)]/10 via-[rgb(177,121,207)]/10 to-[rgb(226,110,0)]/10',
    iconBg: 'bg-gradient-to-br from-[rgb(26,123,153)]/15 via-[rgb(177,121,207)]/15 to-[rgb(226,110,0)]/15',
    borderGradient: 'from-[rgb(26,123,153)] via-[rgb(177,121,207)] to-[rgb(226,110,0)]',
  },
] as const;

export function CompactHomepage1() {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-card]');
      cards.forEach((card) => observer.observe(card));
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Infographic */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-sp-bg via-sp-accent/30 to-sp-bg py-12 sm:py-16 lg:py-20"
      >
        {/* Layered background effects for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(226,110,0)]/10 via-[rgb(177,121,207)]/10 to-[rgb(26,123,153)]/10 opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(26,123,153,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(177,121,207,0.06),transparent_50%)]" />
        
        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Left side - Text content with staggered animation */}
            <div 
              className={`lg:col-span-2 transition-all duration-700 ease-out ${
                isVisible 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-8 opacity-0'
              }`}
            >
              <h1 className="mb-6 font-heading text-3xl leading-[1.1] tracking-tight text-sp-brand sm:text-4xl md:text-5xl lg:text-page-hero">
                <span className="block">Embedded Finance and Solutions</span>
                <span className="block font-bold text-sp-brand mt-1">
                  Showcases and Components
                </span>
              </h1>

              <p 
                className={`mb-8 max-w-2xl text-lg leading-relaxed text-jpm-blue sm:text-xl lg:text-page-body transition-all duration-700 delay-100 ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-6 opacity-0'
                }`}
              >
                React components, working demos, and integration guides for J.P.
                Morgan Embedded Finance APIs.
              </p>

              <div 
                className={`flex flex-col gap-4 sm:flex-row transition-all duration-700 delay-200 ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-6 opacity-0'
                }`}
              >
                <Link to="/demos" className="group">
                  <Button
                    size="lg"
                    className="w-full rounded-page-md border-0 bg-sp-brand px-8 py-4 text-base font-semibold !text-jpm-white shadow-[0_4px_14px_0_rgba(26,123,153,0.3)] transition-all duration-300 hover:bg-sp-brand-700 hover:shadow-[0_6px_20px_0_rgba(26,123,153,0.4)] hover:-translate-y-0.5 sm:w-auto"
                  >
                    EXPLORE DEMOS
                  </Button>
                </Link>
                <Link to="/documentation" className="group">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-page-md border-2 border-sp-brand px-8 py-4 text-base font-semibold text-sp-brand transition-all duration-300 hover:bg-sp-brand hover:text-jpm-white hover:shadow-lg hover:-translate-y-0.5 sm:w-auto"
                  >
                    VIEW DOCUMENTATION
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Interactive Infographic with entrance animation */}
            <div 
              className={`lg:col-span-1 transition-all duration-700 delay-300 ${
                isVisible 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-8 opacity-0'
              }`}
            >
              <IntegrationScenarios />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards Grid */}
      <section 
        ref={cardsRef}
        className="relative bg-sp-bg pt-12 pb-12"
      >
        {/* Subtle background texture */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight text-jpm-gray-900 sm:text-4xl">
              Available Resources
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-jpm-gray">
              Components, demos, and documentation for building financial
              applications
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {navigationCards.map((card, index) => (
              <Link
                key={card.id}
                to={card.link}
                className="block"
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                data-card
              >
                <Card
                  className={`group relative h-full min-h-[12rem] cursor-pointer overflow-hidden rounded-page-md border-2 border-sp-border bg-jpm-white transition-all duration-300 flex flex-col ${
                    hoveredCardId === card.id
                      ? '-translate-y-2 transform border-sp-brand shadow-[0_12px_24px_-8px_rgba(26,123,153,0.25)] ring-2 ring-sp-brand/20'
                      : 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] hover:border-sp-brand/50'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Subtle gradient glow on hover */}
                  <div 
                    className={`absolute inset-0 rounded-page-md bg-gradient-to-r ${card.borderGradient} opacity-0 transition-opacity duration-300 -z-10 blur-xl ${
                      hoveredCardId === card.id ? 'opacity-20' : ''
                    }`}
                  />
                  
                  <CardHeader className={`border-b-2 border-sp-border ${card.accentColor} p-5 flex-shrink-0 relative overflow-hidden`}>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full" />
                    
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-page-md ${card.iconBg} text-sp-brand shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all duration-300 ${
                          hoveredCardId === card.id
                            ? 'scale-110 ring-2 ring-sp-brand/30 shadow-[0_4px_12px_-2px_rgba(26,123,153,0.3)]'
                            : 'group-hover:scale-105'
                        }`}
                      >
                        {card.icon}
                      </div>
                      <span className="rounded-page-md border border-sp-brand/30 bg-white px-3.5 py-2 text-base font-bold text-sp-brand shadow-sm backdrop-blur-sm">
                        {card.count}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-jpm-gray-900 leading-tight relative z-10">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <p className="text-sm leading-relaxed text-jpm-gray flex-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
