import { renderHook, waitFor } from '@testing-library/react';
import {act} from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/msw/server';
import { vi } from 'vitest';
import { useIndustrySuggestions } from './useIndustrySuggestions';
import { EBComponentsProvider } from '@/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Default query client for tests with retries disabled
 */
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});


// Setup QueryClient for tests
const queryClient = createTestQueryClient();

// Mock data
const mockRecommendations = [
  { naicsCode: '541511', naicsDescription: 'Custom Computer Programming Services' },
  { naicsCode: '518210', naicsDescription: 'Data Processing, Hosting, and Related Services' },
  { naicsCode: '541512', naicsDescription: 'Computer Systems Design Services' },
];

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Create a wrapper that provides all necessary contexts for tests
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <EBComponentsProvider apiBaseUrl="https://api.test">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe('useIndustrySuggestions', () => {
  // Store the original localStorage implementation
  const originalLocalStorage = window.localStorage;

  beforeAll(() => {
    // Replace localStorage with our mock implementation
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
  });

  afterAll(() => {
    // Restore the original localStorage implementation
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    });
  });

  beforeEach(() => {
    // Clear localStorage and queryClient before each test
    mockLocalStorage.clear();
    queryClient.clear();
    
    // Reset MSW handlers before each test
    server.resetHandlers();
  });

  test('initializes with default values', () => {
    const { result } = renderHook(() => useIndustrySuggestions(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFeatureFlagEnabled).toBe(false);
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.showRecommendations).toBe(false);
    expect(result.current.showEmptyRecommendationWarning).toBe(false);
    expect(result.current.showRecommendationErrorWarning).toBe(false);
    expect(result.current.recommendationErrorMessage).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  test('enables feature flag based on localStorage value', () => {
    // Set the feature flag in localStorage
    mockLocalStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');

    const { result } = renderHook(() => useIndustrySuggestions(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFeatureFlagEnabled).toBe(true);
  });

  test('does not call API when handleSuggest is called with empty description', async () => {
    const mutationSpy = vi.fn();
    server.use(
      http.post('https://api.test/recommendations', mutationSpy),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions(''), {
      wrapper: createWrapper(),
    });

    // Call handleSuggest with empty description
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for any potential async operations
    await waitFor(() => {
      expect(mutationSpy).not.toHaveBeenCalled();
    });
  });

  test('successfully fetches and displays recommendations', async () => {
    // Setup API mock handler
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.json({
          resource: mockRecommendations,
          resourceType: 'NAICS_CODE'
        });
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions('Software development company'), {
      wrapper: createWrapper(),
    });

    // Initial state check
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.showRecommendations).toBe(false);

    // Call handleSuggest to trigger API call
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check updated state
    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.showRecommendations).toBe(true);
    expect(result.current.showEmptyRecommendationWarning).toBe(false);
    expect(result.current.showRecommendationErrorWarning).toBe(false);
  });

  test('handles empty recommendations response', async () => {
    // Setup API mock handler for empty response
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.json({
          resource: [],
          resourceType: 'NAICS_CODE'
        });
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions('Invalid description that returns no results'), {
      wrapper: createWrapper(),
    });

    // Call handleSuggest to trigger API call
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check state for empty response
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.showRecommendations).toBe(false);
    expect(result.current.showEmptyRecommendationWarning).toBe(true);
    expect(result.current.showRecommendationErrorWarning).toBe(false);
  });

  test('handles API error with context message', async () => {
    // Setup API mock handler for error response
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.json(
          {
            title: 'Error processing request',
            context: [{ message: 'Invalid input for recommendation' }],
            httpStatus: 400
          },
          { status: 400 }
        );
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions('Description that causes an error'), {
      wrapper: createWrapper(),
    });

    // Call handleSuggest to trigger API call
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check error state
    expect(result.current.showRecommendations).toBe(false);
    expect(result.current.showEmptyRecommendationWarning).toBe(false);
    expect(result.current.showRecommendationErrorWarning).toBe(true);
    expect(result.current.recommendationErrorMessage).toBe('Invalid input for recommendation');
  });

  test('handles API error with title message when context is missing', async () => {
    // Setup API mock handler for error response with only title
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.json(
          {
            title: 'Error processing request',
            httpStatus: 400
          },
          { status: 400 }
        );
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions('Another error description'), {
      wrapper: createWrapper(),
    });

    // Call handleSuggest to trigger API call
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check error state
    expect(result.current.showRecommendationErrorWarning).toBe(true);
    expect(result.current.recommendationErrorMessage).toBe('Error processing request');
  });

  test('handles API error with fallback message when context and title are missing', async () => {
    // Setup API mock handler for error with no details
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.error();
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions('Network error description'), {
      wrapper: createWrapper(),
    });

    // Call handleSuggest to trigger API call
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check error state with fallback message
    expect(result.current.showRecommendationErrorWarning).toBe(true);
    expect(result.current.recommendationErrorMessage).toBe('We could not process your request.');
  });

  test('resets warnings when handleSuggest is called multiple times', async () => {
    // First, setup an error response
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.error();
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    const { result } = renderHook(() => useIndustrySuggestions('Test description'), {
      wrapper: createWrapper(),
    });

    // First call - should result in error
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for first call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check error state
    expect(result.current.showRecommendationErrorWarning).toBe(true);

    // Now change the mock to return success
    server.use(
      http.post('https://api.test/recommendations', () => {
        return HttpResponse.json({
          resource: mockRecommendations,
          resourceType: 'NAICS_CODE'
        });
      }),
      http.options('https://api.test/recommendations', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );

    // Second call - should reset warnings
    await act(async () => {
      result.current.handleSuggest();
    });

    // Wait for second call to complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Check that warnings were reset
    expect(result.current.showRecommendationErrorWarning).toBe(false);
    expect(result.current.showEmptyRecommendationWarning).toBe(false);
    expect(result.current.recommendationErrorMessage).toBeNull();
    expect(result.current.showRecommendations).toBe(true);
  });

  test('allows manually hiding recommendations', async () => {
    const { result } = renderHook(() => useIndustrySuggestions('Test'), {
      wrapper: createWrapper(),
    });

    // Set recommendations to be shown
    await act(async () => {
      result.current.setShowRecommendations(true);
    });
    expect(result.current.showRecommendations).toBe(true);

    // Hide recommendations
    await act(async () => {
      result.current.setShowRecommendations(false);
    });
    expect(result.current.showRecommendations).toBe(false);
  });
});
