import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

// Types for the hook
export interface UseAsyncDataState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncDataOptions<T> {
  // Initial data
  initialData?: T;
  // Whether to fetch on mount
  fetchOnMount?: boolean;
  // Retry configuration
  retry?: boolean | number;
  retryDelay?: number;
  // Callbacks
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  // Caching
  cacheTime?: number;
  staleTime?: number;
  // Dependencies that trigger refetch
  dependencies?: any[];
}

export interface UseAsyncDataReturn<T> extends UseAsyncDataState<T> {
  execute: () => Promise<void>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: Error) => void;
}

// Cache for storing data
const dataCache = new Map<string, { data: any; timestamp: number }>();

export function useAsyncData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    initialData = null,
    fetchOnMount = true,
    retry = false,
    retryDelay = 1000,
    onSuccess,
    onError,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    dependencies = [],
  } = options;

  // State management
  const [state, setState] = useState<UseAsyncDataState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
    isRefreshing: false,
    isSuccess: !!initialData,
    isError: false,
  });

  // Refs for tracking
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check cache
  const checkCache = useCallback((): T | null => {
    const cached = dataCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > cacheTime) {
      dataCache.delete(key);
      return null;
    }

    if (age <= staleTime) {
      return cached.data;
    }

    return null;
  }, [key, cacheTime, staleTime]);

  // Update cache
  const updateCache = useCallback((data: T): void => {
    dataCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, [key]);

  // Execute the fetcher
  const execute = useCallback(async (): Promise<void> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState((prev) => {
      // Check cache first
      const cachedData = checkCache();
      if (cachedData !== null && prev.data === null) {
        return {
          data: cachedData,
          error: null,
          isLoading: false,
          isRefreshing: false,
          isSuccess: true,
          isError: false,
        };
      }

      return {
        ...prev,
        isLoading: !prev.data,
        isRefreshing: !!prev.data,
        error: null,
      };
    });

    try {
      const data = await fetcher();

      if (!isMountedRef.current) return;

      setState({
        data,
        error: null,
        isLoading: false,
        isRefreshing: false,
        isSuccess: true,
        isError: false,
      });

      updateCache(data);
      retryCountRef.current = 0;
      onSuccess?.(data);
    } catch (error) {
      if (!isMountedRef.current) return;

      // Don't handle aborted requests as errors
      if (error instanceof Error && error.name === "AbortError") return;

      const errorObj = error instanceof Error ? error : new Error(getErrorMessage(error));

      setState({
        data: null,
        error: errorObj,
        isLoading: false,
        isRefreshing: false,
        isSuccess: false,
        isError: true,
      });

      onError?.(errorObj);

      // Handle retry
      if (retry && (typeof retry === "boolean" || retryCountRef.current < retry)) {
        retryCountRef.current++;
        setTimeout(() => {
          if (isMountedRef.current) {
            execute();
          }
        }, retryDelay * retryCountRef.current);
      }
    }
  }, [fetcher, checkCache, updateCache, onSuccess, onError, retry, retryDelay]);

  // Reset state
  const reset = useCallback((): void => {
    setState({
      data: initialData,
      error: null,
      isLoading: false,
      isRefreshing: false,
      isSuccess: !!initialData,
      isError: false,
    });
    retryCountRef.current = 0;
  }, [initialData]);

  // Set data manually
  const setData = useCallback((data: T): void => {
    setState({
      data,
      error: null,
      isLoading: false,
      isRefreshing: false,
      isSuccess: true,
      isError: false,
    });
    updateCache(data);
  }, [updateCache]);

  // Set error manually
  const setError = useCallback((error: Error): void => {
    setState({
      data: null,
      error,
      isLoading: false,
      isRefreshing: false,
      isSuccess: false,
      isError: true,
    });
  }, []);

  // Memoize dependencies to prevent infinite loops
  const memoizedDependencies = useMemo(
    () => dependencies,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  );

  // Effect for initial fetch and dependency changes
  useEffect(() => {
    if (fetchOnMount || memoizedDependencies.length > 0) {
      execute();
    }
  }, [fetchOnMount, execute, memoizedDependencies]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useAsyncMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<UseAsyncDataOptions<TData>, "fetchOnMount" | "dependencies"> = {}
): {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
} & UseAsyncDataState<TData> {
  const [state, setState] = useState<UseAsyncDataState<TData>>({
    data: null,
    error: null,
    isLoading: false,
    isRefreshing: false,
    isSuccess: false,
    isError: false,
  });

  const { retry = false, retryDelay = 1000, onSuccess, onError } = options;

  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await mutationFn(variables);

      if (!isMountedRef.current) throw new Error("Component unmounted");

      setState({
        data,
        error: null,
        isLoading: false,
        isRefreshing: false,
        isSuccess: true,
        isError: false,
      });

      retryCountRef.current = 0;
      onSuccess?.(data);

      return data;
    } catch (error) {
      if (!isMountedRef.current) throw error;

      const errorObj = error instanceof Error ? error : new Error(getErrorMessage(error));

      setState({
        data: null,
        error: errorObj,
        isLoading: false,
        isRefreshing: false,
        isSuccess: false,
        isError: true,
      });

      onError?.(errorObj);

      // Handle retry
      if (retry && (typeof retry === "boolean" || retryCountRef.current < retry)) {
        retryCountRef.current++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCountRef.current));
        return mutateAsync(variables);
      }

      throw errorObj;
    }
  }, [mutationFn, onSuccess, onError, retry, retryDelay]);

  const mutate = useCallback(async (variables: TVariables): Promise<void> => {
    try {
      await mutateAsync(variables);
    } catch {
      // Error is already handled in state
    }
  }, [mutateAsync]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    mutate,
    mutateAsync,
  };
}