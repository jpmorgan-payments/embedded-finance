import { useCallback, useEffect, useState } from 'react';

interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

interface UseResponsiveCarouselOptions {
  totalItems: number;
  breakpoints?: ResponsiveBreakpoints;
  defaultVisible?: number;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
};

export function useResponsiveCarousel({
  totalItems,
  breakpoints = DEFAULT_BREAKPOINTS,
  defaultVisible = 3,
}: UseResponsiveCarouselOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(defaultVisible);

  // Calculate responsive visible items based on screen size
  const getVisibleItems = useCallback(() => {
    if (typeof window === 'undefined') return defaultVisible;

    const width = window.innerWidth;
    if (width < 768) return breakpoints.mobile;
    if (width < 1024) return breakpoints.tablet;
    return breakpoints.desktop;
  }, [breakpoints, defaultVisible]);

  // Calculate max index based on current visible items
  const getMaxIndex = useCallback(
    (visible: number) => {
      return Math.max(0, totalItems - visible);
    },
    [totalItems]
  );

  // Update visible items count on mount and resize
  useEffect(() => {
    const updateVisibleItems = () => {
      const newVisibleItems = getVisibleItems();
      const newMaxIndex = getMaxIndex(newVisibleItems);

      // Update visible items first
      setVisibleItems(newVisibleItems);

      // Then adjust current index if needed to prevent blank screens
      setCurrentIndex((prevIndex) => {
        const adjustedIndex = Math.min(prevIndex, newMaxIndex);
        return Math.max(0, adjustedIndex);
      });
    };

    // Initial calculation
    updateVisibleItems();

    // Add resize listener with debounce to prevent excessive updates
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(updateVisibleItems, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [getVisibleItems, getMaxIndex]);

  const maxIndex = getMaxIndex(visibleItems);

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex <= maxIndex ? newIndex : prevIndex;
    });
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex >= 0 ? newIndex : prevIndex;
    });
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      const clampedIndex = Math.min(Math.max(0, index), maxIndex);
      setCurrentIndex(clampedIndex);
    },
    [maxIndex]
  );

  // Ensure currentIndex is always within bounds
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), maxIndex);

  // Calculate transform and styling values
  const itemWidthPercent = 100 / totalItems;
  const transformPercent = safeCurrentIndex * itemWidthPercent;
  const containerWidthPercent = (totalItems * 100) / visibleItems;

  // Navigation state
  const canNavigate = totalItems > visibleItems;
  const canGoNext = safeCurrentIndex < maxIndex;
  const canGoPrev = safeCurrentIndex > 0;

  return {
    // State
    currentIndex: safeCurrentIndex,
    visibleItems,
    maxIndex,

    // Navigation functions
    nextSlide,
    prevSlide,
    goToSlide,

    // Calculated values for styling
    transformPercent,
    containerWidthPercent,
    itemWidthPercent,

    // Navigation state
    canNavigate,
    canGoNext,
    canGoPrev,

    // Utility values
    totalSlides: maxIndex + 1,
  };
}
