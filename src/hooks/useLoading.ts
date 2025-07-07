"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

// Custom hook for loading state management with debouncing
export default function useLoading() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathnameRef = useRef<string>(pathname);

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
    // Track pathname changes for loading state
    if (previousPathnameRef.current !== pathname) {
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
  }, [pathname, setLoadingWithDebounce]);

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
