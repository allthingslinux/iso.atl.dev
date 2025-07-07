import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook that returns a debounced value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook that returns a throttled callback function
 * @param callback - The function to throttle
 * @param delay - The delay in milliseconds
 * @returns The throttled function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Hook that returns a throttled value
 * @param value - The value to throttle
 * @param delay - The delay in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRunRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    let timeoutId: NodeJS.Timeout;

    if (timeSinceLastRun >= delay) {
      setThrottledValue(value);
      lastRunRef.current = now;
    } else {
      timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastRunRef.current = Date.now();
      }, delay - timeSinceLastRun);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook for debounced search with loading state
 * @param searchFn - The search function
 * @param delay - The delay in milliseconds
 * @returns Object with search state and handlers
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 300
): {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
  isSearching: boolean;
  error: Error | null;
} {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebounce(query, delay);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const search = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchFn(debouncedQuery);
        setResults(searchResults);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err : new Error("Search failed"));
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    search();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, searchFn]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
  };
}
