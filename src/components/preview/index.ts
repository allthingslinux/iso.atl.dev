import { lazy } from "react";

// Lazy load preview components as they're only used when viewing files
export const Information = lazy(() => import("./Information"));
export const PreviewLayout = lazy(() => import("./PreviewLayout"));
export const Rich = lazy(() => import("./Rich"));
