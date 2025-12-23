/**
 * ISO Filename Parser
 *
 * Parses filenames following the convention:
 * {distro}-{version}-{arch}-[{edition}]-[{spin}]-{iso_type}-{release_date}-{language}.iso
 */

export type ParsedFilename = {
  distro: string;
  version: string;
  arch: string;
  edition?: string;
  spin?: string;
  isoType?: string;
  releaseDate?: string;
  language?: string;
  libc?: string;
  initSystem?: string;
  hardwareTarget?: string;
  confidence: number;
};

// Known values for classification
const ARCHITECTURES = [
  "amd64",
  "x86_64",
  "x64",
  "arm64",
  "aarch64",
  "i386",
  "i686",
  "x86",
  "riscv64",
  "ppc64le",
];
const ISO_TYPES = [
  "live",
  "installer",
  "minimal",
  "netinst",
  "full",
  "server",
  "rescue",
  "cloud",
  "dvd",
];
const EDITIONS = [
  "desktop",
  "server",
  "cloud",
  "workstation",
  "gaming",
  "education",
  "iot",
  "minimal",
  "base",
];
const SPINS = [
  "gnome",
  "kde",
  "xfce",
  "mate",
  "cinnamon",
  "budgie",
  "lxqt",
  "lxde",
  "i3",
  "sway",
  "hyprland",
  "openbox",
  "plasma",
];
const WRAPPERS = ["glibc", "musl", "openrc", "systemd", "runit", "s6", "dinit"];
const LIBCS = ["glibc", "musl"];
const INIT_SYSTEMS = ["systemd", "openrc", "runit", "s6", "dinit", "sysvinit"];
const HARDWARE = [
  "nvidia",
  "amd",
  "intel",
  "steam-deck",
  "deck",
  "surface",
  "asus",
  "raspberry-pi",
  "pinebook",
];
const LANGUAGES = [
  "en",
  "en-us",
  "en-gb",
  "de",
  "fr",
  "es",
  "ja",
  "zh-cn",
  "zh-tw",
  "pt-br",
  "ru",
  "it",
  "ko",
  "pl",
];

// Top-level regex for performance
const EXTENSION_REGEX = /\.(iso|img|tar\.gz|tar\.xz)$/i;
const DELIMITER_REGEX = /[-_.]/;
const DATE_REGEX = /^(\d{4})[-.]?(\d{2})[-.]?(\d{2})$/;
const VERSION_REGEX = /^v?(\d+(?:\.\d+)*(?:-?\w+)?)$/i;

// Normalize architecture names
const ARCH_MAP: Record<string, string> = {
  x86_64: "amd64",
  x64: "amd64",
  aarch64: "arm64",
  i686: "i386",
  x86: "i386",
};

function normalizeArch(arch: string): string {
  return ARCH_MAP[arch.toLowerCase()] || arch.toLowerCase();
}

function findMatch(parts: string[], candidates: string[]): string | undefined {
  const lower = parts.map((p) => p.toLowerCase());
  return candidates.find((c) => lower.includes(c.toLowerCase()));
}

function findDate(parts: string[]): string | undefined {
  for (const part of parts) {
    const match = part.match(DATE_REGEX);
    if (match) {
      return `${match[1]}${match[2]}${match[3]}`;
    }
  }
  return;
}

function findVersion(parts: string[]): string | undefined {
  for (const part of parts) {
    if (part.toLowerCase() === "rolling") {
      return "rolling";
    }
    const match = part.match(VERSION_REGEX);
    if (match && !ARCHITECTURES.includes(part.toLowerCase())) {
      return match[1];
    }
  }
  return;
}

function calculateConfidence(
  arch: string,
  version: string,
  fields: {
    edition?: string;
    spin?: string;
    isoType?: string;
    releaseDate?: string;
    language?: string;
  }
): number {
  let confidence = 20; // base for distro
  if (arch !== "unknown") {
    confidence += 20;
  }
  if (version !== "unknown") {
    confidence += 20;
  }
  if (fields.edition) {
    confidence += 5;
  }
  if (fields.spin) {
    confidence += 5;
  }
  if (fields.isoType) {
    confidence += 10;
  }
  if (fields.releaseDate) {
    confidence += 10;
  }
  if (fields.language) {
    confidence += 5;
  }
  return Math.min(confidence, 100);
}

export function parseFilename(filename: string): ParsedFilename {
  const base = filename.replace(EXTENSION_REGEX, "");
  const parts = base.split(DELIMITER_REGEX).filter(Boolean);

  if (parts.length < 2) {
    return {
      distro: "unknown",
      version: "unknown",
      arch: "unknown",
      confidence: 0,
    };
  }

  const distro = parts[0].toLowerCase();
  const archPart = parts.find((p) => ARCHITECTURES.includes(p.toLowerCase()));
  const arch = archPart ? normalizeArch(archPart) : "unknown";
  const version = findVersion(parts) || "unknown";

  const edition = findMatch(parts, EDITIONS);
  const spin = findMatch(parts, SPINS);
  const isoType = findMatch(parts, ISO_TYPES);
  const libc = findMatch(parts, LIBCS);
  const initSystem = findMatch(parts, INIT_SYSTEMS);
  const hardwareTarget = findMatch(parts, HARDWARE);
  const releaseDate = findDate(parts);
  const language = findMatch(parts, LANGUAGES);

  const confidence = calculateConfidence(arch, version, {
    edition,
    spin,
    isoType,
    releaseDate,
    language,
  });

  return {
    distro,
    version,
    arch,
    edition,
    spin,
    isoType,
    releaseDate,
    language,
    libc,
    initSystem,
    hardwareTarget,
    confidence,
  };
}
