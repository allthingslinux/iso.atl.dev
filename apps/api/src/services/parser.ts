import type { ISOMetadata } from "@iso/validators";

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
