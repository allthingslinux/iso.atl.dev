import { z } from "zod";

export const HelloSchema = z.object({
  name: z.string().optional(),
});

export type HelloInput = z.infer<typeof HelloSchema>;

export const SearchSchema = z.object({
  q: z.string().optional(),
  arch: z.string().optional(),
});

export type SearchInput = z.infer<typeof SearchSchema>;

export const ReputationSchema = z.object({
  userId: z.string(),
});

export type ReputationInput = z.infer<typeof ReputationSchema>;

export const CurationActionSchema = z.object({
  id: z.number(),
  userId: z.string(),
});

export type CurationActionInput = z.infer<typeof CurationActionSchema>;

export const ISOMetadataSchema = z.object({
  distro: z.string(),
  version: z.string(),
  arch: z.string(),
  type: z.string().optional(),
  date: z.string().optional(), // YYYYMMDD
  lang: z.string().optional(),
  originalFilename: z.string(),
  confidence: z.number().min(0).max(100),
});

export type ISOMetadata = z.infer<typeof ISOMetadataSchema>;
