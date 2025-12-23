import { z } from "@hono/zod-openapi";

// ISO Response Schema
export const IsoResponseSchema = z.object({
  id: z.number().openapi({ example: 123 }),
  distroSlug: z.string().nullable().openapi({ example: "ubuntu" }),
  distroName: z.string().nullable().openapi({ example: "Ubuntu" }),
  version: z.string().nullable().openapi({ example: "22.04" }),
  arch: z.string().nullable().openapi({ example: "x86_64" }),
  filename: z.string().openapi({ example: "ubuntu-22.04-desktop-amd64.iso" }),
  size: z.number().optional().openapi({ example: 3_774_873_600 }),
  checksum: z.string().optional().openapi({ example: "sha256:abc123..." }),
  downloadUrl: z.string().optional(),
  confidence: z.number().nullable().openapi({ example: 95 }),
  createdAt: z.string().optional(),
});

export type IsoResponse = z.infer<typeof IsoResponseSchema>;

// Search Results Schema
export const SearchResultsSchema = z.array(IsoResponseSchema);

// Reputation Response Schema
export const ReputationResponseSchema = z.object({
  reputation: z.number().openapi({ example: 150 }),
});

export type ReputationResponse = z.infer<typeof ReputationResponseSchema>;

// Curation Action Response Schema
export const CurationActionResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
});

export type CurationActionResponse = z.infer<
  typeof CurationActionResponseSchema
>;

// Sync Stats Schema
export const SyncStatsSchema = z.object({
  scanned: z.number().optional(),
  added: z.number().optional(),
  updated: z.number().optional(),
  removed: z.number().optional(),
  duration: z.number().optional(),
});

export const SyncResponseSchema = z.object({
  status: z.string().openapi({ example: "completed" }),
  stats: SyncStatsSchema.optional(),
});

export type SyncResponse = z.infer<typeof SyncResponseSchema>;

// Hello Response Schema
export const HelloResponseSchema = z.object({
  message: z.string().openapi({ example: "Hello World from Hono!" }),
});

export type HelloResponse = z.infer<typeof HelloResponseSchema>;
