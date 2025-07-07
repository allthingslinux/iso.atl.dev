"use server";

import { type ActionResponseSchema } from "@/types";
import { type AsyncZippable, strToU8, zipSync } from "fflate";
import { type z } from "zod";

import {
  type Schema_App_Configuration,
  type Schema_App_Configuration_Env,
} from "@/types/schema";

import {
  base64Decode,
  base64Encode,
  encryptionService,
} from "@/lib/utils.server";

export async function GenerateServiceAccountB64(
  serviceAccount: string
): Promise<ActionResponseSchema<string>> {
  const b64 = base64Encode(serviceAccount, "standard");

  // Test
  const decoded = base64Decode(b64, "standard");
  if (decoded === null) {
    return {
      success: false,
      message: "Failed to decode the service account",
      error:
        "Something went wrong while encoding the service account, please try again",
    };
  }
  if (decoded !== serviceAccount) {
    return {
      success: false,
      message: "Encode failed to match the original string",
      error:
        "Something went wrong while testing the encoding, please try again",
    };
  }

  return {
    success: true,
    message: "Service account generated",
    data: b64,
  };
}
