import React, { createContext, useEffect, useState, useCallback, useMemo } from "react";

const DefaultQuery = "(min-width: 768px)";
export type TResponsiveContext = {
  isDesktop: boolean;
  isMobile: boolean;
};
export const ResponsiveContext = createContext<TResponsiveContext>({
  isDesktop: true,
  isMobile: false,
});

type TResponsiveProvider = {
  query?: string;
  children: React.ReactNode;
};

export const ResponsiveProvider = React.memo(({
  query = DefaultQuery,
  children,
}: TResponsiveProvider) => {
  const [isDesktop, setDesktop] = useState<boolean>(true);

  const onChangeLayout = useCallback((event: MediaQueryListEvent) => {
    setDesktop(event.matches);
  }, []);

  useEffect(() => {
    const result = matchMedia(query);
    result.addEventListener("change", onChangeLayout);
    setDesktop(result.matches);

    return () => result.removeEventListener("change", onChangeLayout);
  }, [query, onChangeLayout]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TResponsiveContext>(() => ({
    isDesktop,
    isMobile: !isDesktop
  }), [isDesktop]);

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
});

ResponsiveProvider.displayName = "ResponsiveProvider";

export const useResponsive = () => {
  const context = React.useContext(ResponsiveContext);
  if (!context) {
    throw new Error("useResponsive must be used within a ResponsiveProvider");
  }

  return context;
};
