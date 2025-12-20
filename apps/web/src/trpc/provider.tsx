"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import type React from "react";
import { useState } from "react";
import superjson from "superjson";
import { env } from "@/env";
import { trpc } from "./client";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "http://localhost:8787";
  }
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  return `http://localhost:${env.PORT ?? 8787}`;
};

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
