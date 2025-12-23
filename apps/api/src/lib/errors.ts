import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export const Errors = {
  NOT_FOUND: (resource = "Resource") =>
    new HTTPException(404, { message: `${resource} not found` }),
  BAD_REQUEST: (message: string) => new HTTPException(400, { message }),
  UNAUTHORIZED: () => new HTTPException(401, { message: "Unauthorized" }),
  FORBIDDEN: (message = "Insufficient permissions") =>
    new HTTPException(403, { message }),
  CONFLICT: (message: string) => new HTTPException(409, { message }),
  RATE_LIMITED: () =>
    new HTTPException(429, { message: "Rate limit exceeded" }),
};

export function errorHandler(err: Error, c: Context) {
  console.error(`[API Error] ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    return c.json<ApiError>(
      { error: { code: err.status.toString(), message: err.message } },
      err.status
    );
  }

  return c.json<ApiError>(
    { error: { code: "500", message: "Internal server error" } },
    500
  );
}
