import { z } from "@hono/zod-openapi";

export const HelloSchema = z.object({
  name: z.string().optional().openapi({
    description: "Name to greet",
    example: "World",
  }),
});

export type HelloInput = z.infer<typeof HelloSchema>;

export const SearchSchema = z.object({
  q: z.string().optional().openapi({
    description: "Search query",
    example: "ubuntu",
  }),
  arch: z.string().optional().openapi({
    description: "Architecture filter",
    example: "x86_64",
  }),
});

export type SearchInput = z.infer<typeof SearchSchema>;

export const ReputationSchema = z.object({
  userId: z.string().openapi({
    description: "User ID",
    example: "user123",
  }),
});

export type ReputationInput = z.infer<typeof ReputationSchema>;

export const CurationActionSchema = z.object({
  id: z.number().openapi({
    description: "ISO ID",
    example: 456,
  }),
  userId: z.string().openapi({
    description: "User ID performing the action",
    example: "user123",
  }),
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

// RESTful API Schemas

// ISO query parameters (combines search + filters)
export const IsoQuerySchema = z.object({
  q: z.string().optional().openapi({
    description: "Search query",
    example: "ubuntu",
  }),
  arch: z.string().optional().openapi({
    description: "Architecture filter",
    example: "x86_64",
  }),
  status: z
    .enum(["pending", "approved", "rejected", "live"])
    .optional()
    .openapi({
      description: "ISO status filter",
      example: "pending",
    }),
  limit: z.number().optional().openapi({
    description: "Results per page",
    example: 50,
  }),
  offset: z.number().optional().openapi({
    description: "Pagination offset",
    example: 0,
  }),
});

export type IsoQuery = z.infer<typeof IsoQuerySchema>;

// ISO path parameters
export const IsoParamsSchema = z.object({
  id: z.string().openapi({
    description: "ISO ID",
    example: "123",
    param: {
      name: "id",
      in: "path",
    },
  }),
});

export type IsoParams = z.infer<typeof IsoParamsSchema>;

// ISO update body
export const IsoUpdateSchema = z.object({
  status: z.enum(["approved", "rejected", "live"]).optional().openapi({
    description: "New status",
    example: "approved",
  }),
  reviewedBy: z.string().optional().openapi({
    description: "User ID of reviewer",
    example: "user123",
  }),
  reason: z.string().optional().openapi({
    description: "Reason for rejection",
    example: "Duplicate entry",
  }),
});

export type IsoUpdate = z.infer<typeof IsoUpdateSchema>;

// User path parameters
export const UserParamsSchema = z.object({
  userId: z.string().openapi({
    description: "User ID",
    example: "user123",
    param: {
      name: "userId",
      in: "path",
    },
  }),
});

export type UserParams = z.infer<typeof UserParamsSchema>;

// Export response schemas
export * from "./responses";

// Export v1 API schemas
export * from "./v1";
