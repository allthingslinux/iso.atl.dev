import { initTRPC } from "@trpc/server";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

// tRPC Setup
const t = initTRPC.create();
const publicProcedure = t.procedure;
const router = t.router;

import { CurationService } from "./services/curation";
import { SearchService } from "./services/search";
import { SyncService } from "./services/sync";

const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(
      ({ input }) => `Hello ${input.name ?? "World"} from Hono on Cloudflare!`
    ),

  triggerSync: publicProcedure.mutation(async () => {
    const syncer = new SyncService();
    const stats = await syncer.runSync("root_folder_id");
    return { status: "completed", ...stats };
  }),

  search: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        arch: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const searcher = new SearchService();
      return await searcher.search(input.q || "", { arch: input.arch });
    }),

  curation: router({
    getPending: publicProcedure.query(async () => {
      const curator = new CurationService();
      return await curator.getPendingIsos();
    }),

    getReputation: publicProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        const curator = new CurationService();
        return await curator.getReputation(input.userId);
      }),

    approve: publicProcedure
      .input(z.object({ id: z.number(), userId: z.string() }))
      .mutation(async ({ input }) => {
        const curator = new CurationService();
        return await curator.approveIso(input.id, input.userId);
      }),

    reject: publicProcedure
      .input(z.object({ id: z.number(), userId: z.string() }))
      .mutation(async ({ input }) => {
        const curator = new CurationService();
        return await curator.rejectIso(input.id, input.userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Hono Adapter for tRPC would go here,
// strictly simplified for MVP:
app.get("/", (c) => c.text("ISO Archive API is running"));

export default app;
