import { useEffect, useState } from "react";

/**
 * Hook to prevent hydration mismatches by tracking if component has mounted
 * Use this when you need to conditionally render content that differs between server and client
 *
 * @returns {boolean} mounted - True after the component has mounted on the client
 *
 * @example
 * ```tsx
 * function ThemeIcon() {
 *   const mounted = useHydration();
 *
 *   if (!mounted) {
 *     return <Skeleton className="h-6 w-6" />; // Server-safe fallback
 *   }
 *
 *   return <Icon name={theme === 'dark' ? 'Moon' : 'Sun'} />; // Client-only content
 * }
 * ```
 */
export function useHydration(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Hook to safely access client-side only APIs like localStorage
 * Returns undefined on server and during hydration
 *
 * @param key - localStorage key
 * @param defaultValue - Default value to return when key doesn't exist
 * @returns {string | undefined} The stored value or undefined
 *
 * @example
 * ```tsx
 * function UserPreference() {
 *   const preference = useClientStorage('theme', 'system');
 *   const mounted = useHydration();
 *
 *   if (!mounted) return <div>Loading...</div>;
 *
 *   return <div>Theme: {preference}</div>;
 * }
 * ```
 */
export function useClientStorage(
  key: string,
  defaultValue?: string
): string | undefined {
  const [value, setValue] = useState<string | undefined>(undefined);
  const mounted = useHydration();

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      setValue(stored ?? defaultValue);
    }
  }, [key, defaultValue, mounted]);

  return value;
}

/**
 * Hook for conditional rendering based on environment
 * Useful for features that should only work on client or server
 *
 * @returns Object with environment booleans
 */
export function useEnvironment() {
  const mounted = useHydration();

  return {
    isServer: !mounted,
    isClient: mounted,
    isHydrating: !mounted,
    isMounted: mounted,
  };
}
