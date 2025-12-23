import { z } from "@hono/zod-openapi";

// Enums
export const OsTypeEnum = z.enum(["linux", "bsd", "unix", "vintage", "other", "mobile", "windows"]);
export const ReleaseStageEnum = z.enum(["stable", "lts", "beta", "alpha", "rc", "snapshot", "nightly"]);
export const IsoTypeEnum = z.enum(["live", "installer", "minimal", "netinst", "full", "server", "rescue", "cloud"]);
export const IsoStatusEnum = z.enum(["pending", "staging", "verified", "flagged", "archived"]);
export const EditStatusEnum = z.enum(["pending", "approved", "rejected", "applied"]);
export const EditTypeEnum = z.enum(["create", "update", "merge", "delete"]);
export const VoteTypeEnum = z.enum(["yes", "no", "abstain"]);

// Common pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// Catalog
export const CatalogSearchSchema = z.object({
  q: z.string().optional(),
  distro: z.string().optional(),
  family: z.string().optional(),
  osType: OsTypeEnum.optional(),
  arch: z.string().optional(),
  edition: z.string().optional(),
  spin: z.string().optional(),
  isoType: IsoTypeEnum.optional(),
  releaseStage: ReleaseStageEnum.optional(),
  hardwareTarget: z.string().optional(),
  status: IsoStatusEnum.optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// Library
export const IsoIdSchema = z.object({ id: z.string() });
export const DistroSlugSchema = z.object({ slug: z.string() });

export const IsoListSchema = z.object({
  distro: z.string().optional(),
  status: IsoStatusEnum.optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// Curation
export const EditSubmitSchema = z.object({
  targetType: z.enum(["iso", "distro", "family"]),
  targetId: z.union([z.number(), z.string()]),
  editType: EditTypeEnum,
  data: z.record(z.string(), z.unknown()),
  comment: z.string().optional(),
});

export const EditListSchema = z.object({
  status: EditStatusEnum.optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const VoteSchema = z.object({ vote: VoteTypeEnum });
export const CommentSchema = z.object({ text: z.string().min(1) });
export const UserIdSchema = z.object({ userId: z.string() });

// Downloads
export const DownloadIdSchema = z.object({ id: z.string() });

// Uploads
export const UploadInitSchema = z.object({
  filename: z.string().min(1),
  size: z.number().positive(),
});

export const UploadCompleteSchema = z.object({
  driveFileId: z.string().min(1),
});

// Types
export type OsType = z.infer<typeof OsTypeEnum>;
export type ReleaseStage = z.infer<typeof ReleaseStageEnum>;
export type IsoType = z.infer<typeof IsoTypeEnum>;
export type IsoStatus = z.infer<typeof IsoStatusEnum>;
export type CatalogSearch = z.infer<typeof CatalogSearchSchema>;
export type EditSubmit = z.infer<typeof EditSubmitSchema>;
export type Vote = z.infer<typeof VoteSchema>;
