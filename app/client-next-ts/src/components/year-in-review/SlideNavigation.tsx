import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SLIDE_COUNT = 11;

interface SlideNavigationProps {
  sectionRefs: React.RefObject<HTMLElement | null>[];
}

export function SlideNavigation({ sectionRefs }: SlideNavigationProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToSlide = useCallback(
    (index: number) => {
      const section = sectionRefs[index]?.current;
      if (!section) return;

      setIsScrolling(true);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setTimeout(() => setIsScrolling(false), 1000);
    },
    [sectionRefs]
  );

  const goToNext = useCallback(() => {
    if (activeSlide < SLIDE_COUNT - 1) {
      scrollToSlide(activeSlide + 1);
    }
  }, [activeSlide, scrollToSlide]);

  const goToPrev = useCallback(() => {
    if (activeSlide > 0) {
      scrollToSlide(activeSlide - 1);
    }
  }, [activeSlide, scrollToSlide]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isScrolling) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = sectionRefs.findIndex(
            (ref) => ref.current === entry.target
          );
          if (index !== -1) {
            setActiveSlide(index);
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    sectionRefs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      sectionRefs.forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [sectionRefs, isScrolling]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  return (
    <div className="fixed left-2 top-1/2 z-50 hidden -translate-y-1/2 md:block lg:left-4">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-background/80 p-2 shadow-lg backdrop-blur-sm">
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrev}
          disabled={activeSlide === 0}
          className="h-8 w-8 rounded-full"
          aria-label="Previous slide"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        {/* Stepper Dots */}
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-all duration-300',
                activeSlide === index
                  ? 'scale-125 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeSlide === index ? 'step' : undefined}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={activeSlide === SLIDE_COUNT - 1}
          className="h-8 w-8 rounded-full"
          aria-label="Next slide"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
