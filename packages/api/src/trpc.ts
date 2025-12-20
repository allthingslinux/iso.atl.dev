import type { DbClient } from "@iso/db";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
export interface TRPCContext extends Record<string, unknown> {
  db: DbClient;
  // Add other context items here (e.g., auth, env)
}

export const createTRPCContext = async (opts: {
  db: DbClient;
}): Promise<TRPCContext> => ({
  db: opts.db,
});

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE
 *
 * These are the pieces you use to build your tRPC API.
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
