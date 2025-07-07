"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

/**
 * Custom hook for loading state management with debouncing.
 *
 * If using the async mode, you must always pass a new array reference for `deps` when any dependency changes.
 *
 * Example:
 *   useLoading(fetchData, [id, filter])
 *
 * The effect will only re-run if the array reference changes.
 */
export default function useLoading(): boolean;
export default function useLoading(
  asyncFn: () => Promise<void>,
  deps: unknown[]
): boolean;

export default function useLoading(
  asyncFn?: () => Promise<void>,
  deps: unknown[] = []
): boolean {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    if (asyncFn) {
      let cancelled = false;
      setIsLoading(true);
      asyncFn()
        .catch(console.error)
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [asyncFn, deps]);

  // Debounced loading state to prevent flickering
  const setLoadingWithDebounce = useCallback(
    (loading: boolean, delay = 100) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (loading) {
        // Show loading immediately
        setIsLoading(true);
      } else {
        // Delay hiding loading to prevent flickering
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    },
    []
  );

  useEffect(() => {
    // Only track pathname changes if no asyncFn is provided
    if (!asyncFn && previousPathnameRef.current !== pathname) {
      setLoadingWithDebounce(true);

      // Automatically hide loading after navigation
      const navigationTimeout = setTimeout(() => {
        setLoadingWithDebounce(false, 0);
      }, 500);

      previousPathnameRef.current = pathname;

      return () => {
        clearTimeout(navigationTimeout);
      };
    }
    return undefined;
  }, [pathname, setLoadingWithDebounce, asyncFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return isLoading;
}

// Additional hook for manual loading control
export function useManualLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean, delay = 0) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(loading);
      }, delay);
    } else {
      setIsLoading(loading);
    }
  }, []);

  const toggle = useCallback(() => {
    setLoading(!isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    setLoading,
    toggle,
  };
}
