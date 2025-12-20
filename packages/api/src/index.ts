import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./root";

export { type AppRouter, appRouter } from "./root";
export {
  createTRPCContext,
  createTRPCRouter,
  publicProcedure,
  type TRPCContext,
} from "./trpc";

/**
 * Inference helpers for input types
 * @example
 * type HelloInput = RouterInputs['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type HelloOutput = RouterOutputs['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
