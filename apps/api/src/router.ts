import { createTRPCRouter, publicProcedure } from "@iso/api";
import {
  type CurationActionInput,
  CurationActionSchema,
  type HelloInput,
  HelloSchema,
  type ReputationInput,
  ReputationSchema,
  type SearchInput,
  SearchSchema,
} from "@iso/validators";
import { CurationService } from "./services/curation";
import { SearchService } from "./services/search";
import { SyncService } from "./services/sync";

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(HelloSchema)
    .query(
      ({ input }: { input: HelloInput }) =>
        `Hello ${input.name ?? "World"} from Hono on Cloudflare!`
    ),

  triggerSync: publicProcedure.mutation(async ({ ctx }) => {
    const syncer = new SyncService(ctx.db);
    const stats = await syncer.runSync("root_folder_id");
    return { status: "completed", ...stats };
  }),

  search: publicProcedure
    .input(SearchSchema)
    .query(async ({ input, ctx }: { input: SearchInput; ctx: any }) => {
      const searcher = new SearchService(ctx.db);
      return await searcher.search(input.q || "", { arch: input.arch });
    }),

  curation: createTRPCRouter({
    getPending: publicProcedure.query(async ({ ctx }) => {
      const curator = new CurationService(ctx.db);
      return await curator.getPendingIsos();
    }),

    getReputation: publicProcedure
      .input(ReputationSchema)
      .query(async ({ input, ctx }: { input: ReputationInput; ctx: any }) => {
        const curator = new CurationService(ctx.db);
        const reputation = await curator.getReputation(input.userId);
        return { reputation };
      }),

    approve: publicProcedure
      .input(CurationActionSchema)
      .mutation(
        async ({ input, ctx }: { input: CurationActionInput; ctx: any }) => {
          const curator = new CurationService(ctx.db);
          return await curator.approveIso(input.id, input.userId);
        }
      ),

    reject: publicProcedure
      .input(CurationActionSchema)
      .mutation(
        async ({ input, ctx }: { input: CurationActionInput; ctx: any }) => {
          const curator = new CurationService(ctx.db);
          return await curator.rejectIso(input.id, input.userId);
        }
      ),
  }),
});

export type AppRouter = typeof appRouter;
