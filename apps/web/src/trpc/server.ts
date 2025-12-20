import { appRouter, createTRPCContext } from "@iso/api";
import { createDbClient } from "@iso/db";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { env } from "@/env";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  // In Next.js RSC, we can use the same DB client configuration
  const db = createDbClient(env.DATABASE_URL);

  return createTRPCContext({
    db,
  });
});

const getQueryClient = cache(() => new QueryClient());

export const trpc = createTRPCOptionsProxy({
  router: appRouter,
  ctx: createContext,
  queryClient: getQueryClient,
});
