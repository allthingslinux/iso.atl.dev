import { useCallback, useEffect, useRef } from "react";

// Performance monitoring hook for production optimization
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    return () => {
      const unmountTime = performance.now();
      const lifespan = unmountTime - mountTimeRef.current;

      if (process.env.NODE_ENV === "development") {
        console.info(
          `[Performance] ${componentName} lifespan: ${lifespan.toFixed(2)}ms, renders: ${renderCountRef.current}`
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now();

    if (lastRenderTimeRef.current > 0) {
      const timeBetweenRenders = renderTime - lastRenderTimeRef.current;

      if (process.env.NODE_ENV === "development" && timeBetweenRenders < 16) {
        console.debug(
          `[Performance Warning] ${componentName} re-rendered within ${timeBetweenRenders.toFixed(2)}ms`
        );
      }
    }

    lastRenderTimeRef.current = renderTime;
  });

  const measureFunction = useCallback(
    (fn: () => void, functionName: string) => {
      const start = performance.now();
      fn();
      const end = performance.now();

      if (process.env.NODE_ENV === "development") {
        console.info(
          `[Performance] ${componentName}.${functionName}: ${(end - start).toFixed(2)}ms`
        );
      }
    },
    [componentName]
  );

  return {
    renderCount: renderCountRef.current,
    measureFunction,
  };
}

// Hook for measuring async operations
export function useAsyncPerformanceMonitor() {
  const measureAsync = useCallback(
    async <T>(asyncFn: () => Promise<T>, operationName: string): Promise<T> => {
      const start = performance.now();

      try {
        const result = await asyncFn();
        const end = performance.now();

        if (process.env.NODE_ENV === "development") {
          console.info(
            `[Async Performance] ${operationName}: ${(end - start).toFixed(2)}ms`
          );
        }

        return result;
      } catch (error) {
        const end = performance.now();

        if (process.env.NODE_ENV === "development") {
          console.error(
            `[Async Performance Error] ${operationName}: ${(end - start).toFixed(2)}ms`,
            error
          );
        }

        throw error;
      }
    },
    []
  );

  return { measureAsync };
}

// Hook for detecting heavy re-renders
export function useRenderOptimization(componentName: string, threshold = 16) {
  const renderTimesRef = useRef<number[]>([]);
  const warningCountRef = useRef(0);

  useEffect(() => {
    const renderTime = performance.now();
    renderTimesRef.current.push(renderTime);

    // Keep only last 10 render times
    if (renderTimesRef.current.length > 10) {
      renderTimesRef.current.shift();
    }

    // Check for rapid re-renders
    if (renderTimesRef.current.length >= 2) {
      const lastTwo = renderTimesRef.current.slice(-2);
      const timeDiff = lastTwo[1] - lastTwo[0];

      if (timeDiff < threshold) {
        warningCountRef.current += 1;

        if (
          process.env.NODE_ENV === "development" &&
          warningCountRef.current >= 3
        ) {
          console.debug(
            `[Render Optimization] ${componentName} has ${warningCountRef.current} rapid re-renders (< ${threshold}ms apart). Consider optimization.`
          );
          warningCountRef.current = 0; // Reset to avoid spam
        }
      }
    }
  });

  return {
    averageRenderTime:
      renderTimesRef.current.length >= 2
        ? (renderTimesRef.current[renderTimesRef.current.length - 1] -
            renderTimesRef.current[0]) /
          (renderTimesRef.current.length - 1)
        : 0,
    renderCount: renderTimesRef.current.length,
  };
}
