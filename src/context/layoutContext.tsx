import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

export type TLayout = "grid" | "list";

const getLayoutFromLocalStorage = (): TLayout => {
  if (typeof window !== "undefined") {
    const layout = localStorage.getItem("layout");
    if (layout === "grid" || layout === "list") {
      return layout;
    }
  }
  return "grid";
};

export type TLayoutContext = {
  layout: TLayout;
  setLayout: (layout: TLayout) => void;
  isPending: boolean;
};

export const LayoutContext = createContext<TLayoutContext>({
  layout: getLayoutFromLocalStorage(),
  setLayout: () => {
    void 0;
  },
  isPending: false,
});

type TLayoutProvider = {
  children: React.ReactNode;
};

export const LayoutProvider = React.memo(({ children }: TLayoutProvider) => {
  const [layout, setLayout] = useState<TLayout>("grid");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLayout(getLayoutFromLocalStorage());
  }, []);

  const onChangeLayout = useCallback((newLayout: TLayout) => {
    startTransition(() => {
      setLayout(newLayout);
      localStorage.setItem("layout", newLayout);
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TLayoutContext>(
    () => ({
      layout,
      setLayout: onChangeLayout,
      isPending,
    }),
    [layout, onChangeLayout, isPending]
  );

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
});

LayoutProvider.displayName = "LayoutProvider";

export const useLayout = () => React.useContext(LayoutContext);
