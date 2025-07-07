import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Optimize by checking if we're in SSR and avoiding multiple checks
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    // Single media query instance for better performance
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    
    // Set initial value
    setIsMobile(mql.matches);
    
    // Use the newer addEventListener instead of deprecated addListener
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// Additional hook for desktop detection to avoid double negation in components
export function useIsDesktop() {
  const isMobile = useIsMobile();
  return !isMobile;
}

// Hook that returns both mobile and desktop states for better performance
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<{
    isMobile: boolean;
    isDesktop: boolean;
  }>({
    isMobile: false,
    isDesktop: true,
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      const isMobile = mql.matches;
      setBreakpoint({
        isMobile,
        isDesktop: !isMobile,
      });
    };
    
    // Set initial value
    onChange();
    
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return breakpoint;
}
