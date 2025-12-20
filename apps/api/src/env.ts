import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const createApiEnv = (runtimeEnv: Record<string, unknown>) =>
  createEnv({
    server: {
      DATABASE_URL: z.string().url(),
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    },
    runtimeEnv: runtimeEnv as Record<
      string,
      string | boolean | number | undefined
    >,
    skipValidation: !!runtimeEnv.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
  });
