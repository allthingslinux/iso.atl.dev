import type { DbClient } from "@iso/db";

export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    GOOGLE_CLIENT_EMAIL?: string;
    GOOGLE_PRIVATE_KEY?: string;
    GOOGLE_DRIVE_FOLDER_ID?: string;
  };
  Variables: {
    db: DbClient;
    userId?: string;
  };
};
