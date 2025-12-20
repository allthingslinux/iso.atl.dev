import { z } from "zod";

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

// Basic regex to extract info from standard filenames
const FILENAME_REGEX =
  /^(?<distro>[a-zA-Z]+)-(?<version>[\d.]+)-(?<arch>amd64|x86_64|arm64)/i;

export function parseFilename(filename: string): ISOMetadata {
  // Heuristic 1: Regex
  // Try to match standard pattern: <distro>-<version>-<arch>.iso
  const match = filename.match(FILENAME_REGEX);

  let confidence = 0;

  if (match?.groups) {
    confidence = 100;
    return {
      distro: match.groups.distro,
      version: match.groups.version,
      arch: match.groups.arch,
      type: undefined,
      date: undefined,
      lang: undefined,
      originalFilename: filename,
      confidence,
    };
  }

  // Fallback
  return {
    distro: "unknown",
    version: "unknown",
    arch: "unknown",
    originalFilename: filename,
    confidence: 0,
  };
}
