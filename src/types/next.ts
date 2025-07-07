import type { ReactElement, ReactNode } from "react";

import type { Metadata } from "next";
import type { NextRequest } from "next/server";

// Page component props with params and searchParams
export interface PageProps<
  TParams extends Record<string, string | string[]> = Record<string, never>,
  TSearchParams extends Record<string, string | string[] | undefined> = Record<
    string,
    never
  >,
> {
  params: Promise<TParams>;
  searchParams: Promise<TSearchParams>;
}

// Layout component props
export interface LayoutProps<
  TParams extends Record<string, string | string[]> = Record<string, never>,
> {
  children: ReactNode;
  params: Promise<TParams>;
}

// Route segment config type
export interface RouteSegmentConfig {
  dynamic?: "auto" | "force-dynamic" | "error" | "force-static";
  dynamicParams?: boolean;
  revalidate?: false | 0 | number;
  fetchCache?:
    | "auto"
    | "default-cache"
    | "only-cache"
    | "force-cache"
    | "force-no-store"
    | "default-no-store"
    | "only-no-store";
  runtime?: "nodejs" | "edge";
  preferredRegion?: string | string[];
  maxDuration?: number;
}

// Error component props
export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// API Route handler types
export type RouteHandler<TContext = unknown> = (
  request: NextRequest,
  context: TContext
) => Promise<Response> | Response;

// API Route context with params
export interface RouteContext<
  TParams extends Record<string, string | string[]> = Record<string, never>,
> {
  params: Promise<TParams>;
}

// Typed API response builder
export class TypedResponse<T = unknown> extends Response {
  constructor(data: T, init?: ResponseInit) {
    super(JSON.stringify(data), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }
}

// Metadata helpers
export type GenerateMetadata<
  TParams extends Record<string, string | string[]> = Record<string, never>,
  TSearchParams extends Record<string, string | string[] | undefined> = Record<
    string,
    never
  >,
> = (props: PageProps<TParams, TSearchParams>) => Promise<Metadata> | Metadata;

// Viewport config type
export interface Viewport {
  width?: number | string;
  height?: number | string;
  initialScale?: number;
  minimumScale?: number;
  maximumScale?: number;
  userScalable?: boolean;
  viewportFit?: "auto" | "cover" | "contain";
  interactiveWidget?: "resizes-visual" | "resizes-content" | "overlays-content";
}

// Type-safe dynamic route params
export type DynamicRoute<T extends string> = T extends `[...${infer P}]`
  ? { [K in P]: string[] }
  : T extends `[[...${infer P}]]`
    ? { [K in P]?: string[] }
    : T extends `[${infer P}]`
      ? { [K in P]: string }
      : Record<string, never>;

// Type-safe search params
export type SearchParams<
  T extends Record<string, string | string[] | undefined>,
> = T;

// Async component type
export type AsyncComponent<P = Record<string, never>> = (
  props: P
) => Promise<ReactElement> | ReactElement;

// Server action types
export type ServerAction<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => Promise<TOutput>;

// Typed fetch wrapper for App Router
export async function typedFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
