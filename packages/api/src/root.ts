import {
  CurationActionSchema,
  HelloSchema,
  ReputationSchema,
  SearchSchema,
} from "@iso/validators";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(HelloSchema)
    .query(
      ({ input }) => `Hello ${input.name ?? "World"} from shared @iso/api!`
    ),

  triggerSync: publicProcedure
    .input(z.void())
    .mutation(() => ({ status: "completed" })),

  search: publicProcedure.input(SearchSchema).query(async ({ input }) => {
    // Implementation will be in apps/api
    return [] as any[];
  }),

  curation: createTRPCRouter({
    getPending: publicProcedure.query(async () => [] as any[]),

    getReputation: publicProcedure
      .input(ReputationSchema)
      .query(async ({ input }) => ({ reputation: 0 })),

    approve: publicProcedure
      .input(CurationActionSchema)
      .mutation(async ({ input }) => ({ success: true })),

    reject: publicProcedure
      .input(CurationActionSchema)
      .mutation(async ({ input }) => ({ success: true })),
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
