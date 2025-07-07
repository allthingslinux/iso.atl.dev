import { useCallback, useEffect, useMemo, useState } from "react";

// Breakpoint constants following standard responsive design patterns
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  WIDE: 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

interface MediaQueryState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  breakpoint: Breakpoint;
}

// Custom hook for detecting if the device is mobile with SSR safety
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Create media query only on client side
    const mediaQuery = window.matchMedia(
      `(max-width: ${BREAKPOINTS.MOBILE - 1}px)`
    );

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent): void => {
      setIsMobile(event.matches);
    };

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Modern event listener (not deprecated addListener)
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobile;
}

// Comprehensive breakpoint hook with all device types
export function useMediaQuery(): MediaQueryState {
  // Initialize with undefined to handle SSR properly
  const [state, setState] = useState<MediaQueryState | undefined>(undefined);

  useEffect(() => {
    // Create all media queries
    const queries = {
      mobile: window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`),
      tablet: window.matchMedia(
        `(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.TABLET - 1}px)`
      ),
      desktop: window.matchMedia(
        `(min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.WIDE - 1}px)`
      ),
      wide: window.matchMedia(`(min-width: ${BREAKPOINTS.WIDE}px)`),
    };

    const updateState = (): void => {
      const newState: MediaQueryState = {
        isMobile: queries.mobile.matches,
        isTablet: queries.tablet.matches,
        isDesktop: queries.desktop.matches,
        isWide: queries.wide.matches,
        breakpoint: queries.mobile.matches
          ? "MOBILE"
          : queries.tablet.matches
            ? "TABLET"
            : queries.desktop.matches
              ? "DESKTOP"
              : "WIDE",
      };
      setState(newState);
    };

    // Set initial state
    updateState();

    // Add listeners
    const handlers: Array<[MediaQueryList, () => void]> = Object.values(
      queries
    ).map((query) => [query, updateState]);

    handlers.forEach(([query, handler]) => {
      query.addEventListener("change", handler);
    });

    return () => {
      handlers.forEach(([query, handler]) => {
        query.removeEventListener("change", handler);
      });
    };
  }, []);

  // Return default state for SSR/initial render
  return (
    state ?? {
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isWide: false,
      breakpoint: "DESKTOP" as Breakpoint,
    }
  );
}

// Hook for custom media queries
export function useCustomMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

// Utility hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
  default: T;
}): T {
  const { breakpoint } = useMediaQuery();

  return useMemo(() => {
    switch (breakpoint) {
      case "MOBILE":
        return values.mobile ?? values.default;
      case "TABLET":
        return values.tablet ?? values.desktop ?? values.default;
      case "DESKTOP":
        return values.desktop ?? values.default;
      case "WIDE":
        return values.wide ?? values.desktop ?? values.default;
      default:
        return values.default;
    }
  }, [breakpoint, values]);
}

// Hook for responsive class names
export function useResponsiveClassName(
  classNames: Partial<Record<Breakpoint | "default", string>>
): string {
  const { breakpoint } = useMediaQuery();

  const className = useMemo(() => {
    return classNames[breakpoint] ?? classNames.default ?? "";
  }, [breakpoint, classNames]);

  return className;
}
