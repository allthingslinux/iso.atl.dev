import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/src/index";

export const trpc = createTRPCReact<AppRouter>();
