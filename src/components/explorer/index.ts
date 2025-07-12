import { lazy } from "react";

// Immediately needed components (not lazy loaded)
export { default as FileItem } from "./FileItem";
export { default as FileExplorerLayout } from "./FileLayout";
export { default as FileBreadcrumb } from "./FileBreadcrumbs";

// Lazy loaded components for better performance
export const FileReadme = lazy(() => import("./FileReadme"));
