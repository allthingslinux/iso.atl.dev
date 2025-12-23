import type { DbClient } from "./index";
import { distros, families, isos } from "./schema";

const FAMILIES_SEED = [
  { slug: "debian", name: "Debian", description: "APT/dpkg-based, .deb packages" },
  { slug: "rhel", name: "Red Hat", description: "RPM/dnf-based, .rpm packages" },
  { slug: "arch", name: "Arch Linux", description: "Pacman-based, rolling release" },
  { slug: "suse", name: "SUSE", description: "Zypper/RPM-based" },
  { slug: "gentoo", name: "Gentoo", description: "Portage-based, source compilation" },
  { slug: "slackware", name: "Slackware", description: "One of the oldest, .tgz packages" },
  { slug: "void", name: "Void Linux", description: "XBPS-based, independent" },
  { slug: "nixos", name: "NixOS", description: "Nix package manager, declarative" },
  { slug: "alpine", name: "Alpine", description: "APK-based, musl libc" },
  { slug: "bsd", name: "BSD", description: "BSD-derived systems" },
  { slug: "independent", name: "Independent", description: "No parent lineage" },
] as const;

const DEMO_DISTROS = [
  { slug: "ubuntu", name: "Ubuntu", osType: "linux" as const, familySlug: "debian", website: "https://ubuntu.com", description: "Popular Debian-based distro by Canonical" },
  { slug: "debian", name: "Debian", osType: "linux" as const, familySlug: "debian", website: "https://debian.org", description: "The universal operating system" },
  { slug: "fedora", name: "Fedora", osType: "linux" as const, familySlug: "rhel", website: "https://fedoraproject.org", description: "Community-driven Red Hat sponsored distro" },
  { slug: "arch", name: "Arch Linux", osType: "linux" as const, familySlug: "arch", website: "https://archlinux.org", description: "Simple, lightweight rolling release" },
  { slug: "manjaro", name: "Manjaro", osType: "linux" as const, familySlug: "arch", website: "https://manjaro.org", description: "User-friendly Arch-based distro", parentSlug: "arch" },
  { slug: "endeavouros", name: "EndeavourOS", osType: "linux" as const, familySlug: "arch", website: "https://endeavouros.com", description: "Terminal-centric Arch-based distro", parentSlug: "arch" },
  { slug: "linux-mint", name: "Linux Mint", osType: "linux" as const, familySlug: "debian", website: "https://linuxmint.com", description: "Elegant Ubuntu-based distro", parentSlug: "ubuntu" },
  { slug: "pop-os", name: "Pop!_OS", osType: "linux" as const, familySlug: "debian", website: "https://pop.system76.com", description: "System76's Ubuntu-based distro", parentSlug: "ubuntu" },
  { slug: "opensuse", name: "openSUSE", osType: "linux" as const, familySlug: "suse", website: "https://opensuse.org", description: "Community SUSE distribution" },
  { slug: "freebsd", name: "FreeBSD", osType: "bsd" as const, familySlug: "bsd", website: "https://freebsd.org", description: "Advanced BSD operating system" },
  { slug: "void", name: "Void Linux", osType: "linux" as const, familySlug: "void", website: "https://voidlinux.org", description: "Independent rolling release with runit" },
  { slug: "alpine", name: "Alpine Linux", osType: "linux" as const, familySlug: "alpine", website: "https://alpinelinux.org", description: "Security-oriented, lightweight distro" },
  { slug: "artix", name: "Artix Linux", osType: "linux" as const, familySlug: "arch", website: "https://artixlinux.org", description: "Arch-based without systemd", parentSlug: "arch" },
  { slug: "nixos", name: "NixOS", osType: "linux" as const, familySlug: "nixos", website: "https://nixos.org", description: "Declarative, reproducible Linux distro" },
  { slug: "gentoo", name: "Gentoo", osType: "linux" as const, familySlug: "gentoo", website: "https://gentoo.org", description: "Source-based, highly customizable" },
];

type IsoSeed = {
  distroSlug: string;
  filename: string;
  version: string;
  arch: string;
  edition?: string;
  spin?: string;
  isoType: "live" | "installer" | "minimal" | "netinst" | "full" | "server" | "rescue" | "cloud";
  releaseStage: "stable" | "lts" | "beta" | "alpha" | "rc" | "snapshot" | "nightly";
  libc?: string;
  initSystem?: string;
  hardwareTarget?: string;
  size: number;
  status: "verified" | "pending" | "staging" | "flagged";
  confidence: number;
};

const DEMO_ISOS: IsoSeed[] = [
  // Ubuntu - various editions
  { distroSlug: "ubuntu", filename: "ubuntu-24.04-amd64-desktop-gnome-live-20240425-en.iso", version: "24.04", arch: "amd64", edition: "desktop", spin: "gnome", isoType: "live", releaseStage: "lts", initSystem: "systemd", size: 5_200_000_000, status: "verified", confidence: 100 },
  { distroSlug: "ubuntu", filename: "ubuntu-24.04-amd64-server-installer-20240425-en.iso", version: "24.04", arch: "amd64", edition: "server", isoType: "installer", releaseStage: "lts", initSystem: "systemd", size: 2_600_000_000, status: "verified", confidence: 95 },
  { distroSlug: "ubuntu", filename: "ubuntu-24.04-arm64-desktop-gnome-live-20240425-en.iso", version: "24.04", arch: "arm64", edition: "desktop", spin: "gnome", isoType: "live", releaseStage: "lts", initSystem: "systemd", size: 4_800_000_000, status: "verified", confidence: 92 },
  { distroSlug: "ubuntu", filename: "ubuntu-24.10-amd64-desktop-gnome-live-20241010-en.iso", version: "24.10", arch: "amd64", edition: "desktop", spin: "gnome", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 5_400_000_000, status: "pending", confidence: 78 },
  
  // Debian
  { distroSlug: "debian", filename: "debian-12.4.0-amd64-netinst-20231210-en.iso", version: "12.4.0", arch: "amd64", isoType: "netinst", releaseStage: "stable", initSystem: "systemd", size: 628_000_000, status: "verified", confidence: 100 },
  { distroSlug: "debian", filename: "debian-12.4.0-amd64-dvd-20231210-en.iso", version: "12.4.0", arch: "amd64", isoType: "full", releaseStage: "stable", initSystem: "systemd", size: 3_700_000_000, status: "verified", confidence: 98 },
  { distroSlug: "debian", filename: "debian-13-amd64-netinst-20241201-en.iso", version: "13", arch: "amd64", isoType: "netinst", releaseStage: "beta", initSystem: "systemd", size: 650_000_000, status: "staging", confidence: 65 },
  
  // Fedora - workstation and spins
  { distroSlug: "fedora", filename: "fedora-41-amd64-workstation-gnome-live-20241029-en.iso", version: "41", arch: "amd64", edition: "workstation", spin: "gnome", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_100_000_000, status: "verified", confidence: 100 },
  { distroSlug: "fedora", filename: "fedora-41-amd64-kde-live-20241029-en.iso", version: "41", arch: "amd64", spin: "kde", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_300_000_000, status: "verified", confidence: 95 },
  { distroSlug: "fedora", filename: "fedora-41-amd64-xfce-live-20241029-en.iso", version: "41", arch: "amd64", spin: "xfce", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 1_800_000_000, status: "pending", confidence: 72 },
  { distroSlug: "fedora", filename: "fedora-41-amd64-server-dvd-20241029-en.iso", version: "41", arch: "amd64", edition: "server", isoType: "installer", releaseStage: "stable", initSystem: "systemd", size: 2_400_000_000, status: "verified", confidence: 92 },
  
  // Arch
  { distroSlug: "arch", filename: "archlinux-2024.12.01-x86_64.iso", version: "2024.12.01", arch: "amd64", isoType: "installer", releaseStage: "stable", initSystem: "systemd", size: 850_000_000, status: "verified", confidence: 100 },
  
  // Manjaro
  { distroSlug: "manjaro", filename: "manjaro-24.2-amd64-kde-live-20241201-en.iso", version: "24.2", arch: "amd64", spin: "kde", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 3_800_000_000, status: "verified", confidence: 88 },
  { distroSlug: "manjaro", filename: "manjaro-24.2-amd64-gnome-live-20241201-en.iso", version: "24.2", arch: "amd64", spin: "gnome", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 3_600_000_000, status: "verified", confidence: 85 },
  { distroSlug: "manjaro", filename: "manjaro-24.2-amd64-xfce-live-20241201-en.iso", version: "24.2", arch: "amd64", spin: "xfce", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 3_200_000_000, status: "pending", confidence: 70 },
  
  // EndeavourOS
  { distroSlug: "endeavouros", filename: "endeavouros-galileo-2024.09.22-x86_64.iso", version: "Galileo", arch: "amd64", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_100_000_000, status: "verified", confidence: 90 },
  
  // Linux Mint
  { distroSlug: "linux-mint", filename: "linuxmint-22-amd64-cinnamon-live-20240701-en.iso", version: "22", arch: "amd64", spin: "cinnamon", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_800_000_000, status: "verified", confidence: 100 },
  { distroSlug: "linux-mint", filename: "linuxmint-22-amd64-mate-live-20240701-en.iso", version: "22", arch: "amd64", spin: "mate", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_600_000_000, status: "verified", confidence: 95 },
  { distroSlug: "linux-mint", filename: "linuxmint-22-amd64-xfce-live-20240701-en.iso", version: "22", arch: "amd64", spin: "xfce", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_500_000_000, status: "verified", confidence: 92 },
  
  // Pop!_OS - with hardware targets
  { distroSlug: "pop-os", filename: "pop-os-22.04-amd64-intel-live-20240601-en.iso", version: "22.04", arch: "amd64", hardwareTarget: "intel", isoType: "live", releaseStage: "lts", initSystem: "systemd", size: 2_700_000_000, status: "verified", confidence: 100 },
  { distroSlug: "pop-os", filename: "pop-os-22.04-amd64-nvidia-live-20240601-en.iso", version: "22.04", arch: "amd64", hardwareTarget: "nvidia", isoType: "live", releaseStage: "lts", initSystem: "systemd", size: 2_900_000_000, status: "verified", confidence: 98 },
  { distroSlug: "pop-os", filename: "pop-os-24.04-amd64-nvidia-live-20241115-en.iso", version: "24.04", arch: "amd64", hardwareTarget: "nvidia", isoType: "live", releaseStage: "beta", initSystem: "systemd", size: 3_100_000_000, status: "staging", confidence: 55 },
  
  // openSUSE
  { distroSlug: "opensuse", filename: "opensuse-tumbleweed-amd64-kde-live-20241220-en.iso", version: "Tumbleweed", arch: "amd64", spin: "kde", isoType: "live", releaseStage: "snapshot", initSystem: "systemd", size: 4_700_000_000, status: "verified", confidence: 85 },
  { distroSlug: "opensuse", filename: "opensuse-leap-15.6-amd64-dvd-20241101-en.iso", version: "15.6", arch: "amd64", isoType: "full", releaseStage: "stable", initSystem: "systemd", size: 4_200_000_000, status: "verified", confidence: 95 },
  
  // FreeBSD
  { distroSlug: "freebsd", filename: "freebsd-14.1-amd64-release-disc1-20240601-en.iso", version: "14.1", arch: "amd64", isoType: "installer", releaseStage: "stable", size: 1_100_000_000, status: "verified", confidence: 100 },
  { distroSlug: "freebsd", filename: "freebsd-14.1-arm64-release-disc1-20240601-en.iso", version: "14.1", arch: "arm64", isoType: "installer", releaseStage: "stable", size: 980_000_000, status: "verified", confidence: 95 },
  
  // Void Linux - musl and glibc variants with different init
  { distroSlug: "void", filename: "void-live-x86_64-20240314-xfce-glibc.iso", version: "20240314", arch: "amd64", spin: "xfce", isoType: "live", releaseStage: "stable", libc: "glibc", initSystem: "runit", size: 1_200_000_000, status: "verified", confidence: 100 },
  { distroSlug: "void", filename: "void-live-x86_64-20240314-xfce-musl.iso", version: "20240314", arch: "amd64", spin: "xfce", isoType: "live", releaseStage: "stable", libc: "musl", initSystem: "runit", size: 1_100_000_000, status: "verified", confidence: 100 },
  { distroSlug: "void", filename: "void-live-x86_64-20240314-base-glibc.iso", version: "20240314", arch: "amd64", edition: "minimal", isoType: "live", releaseStage: "stable", libc: "glibc", initSystem: "runit", size: 600_000_000, status: "verified", confidence: 95 },
  { distroSlug: "void", filename: "void-live-x86_64-20240314-base-musl.iso", version: "20240314", arch: "amd64", edition: "minimal", isoType: "live", releaseStage: "stable", libc: "musl", initSystem: "runit", size: 550_000_000, status: "pending", confidence: 88 },
  
  // Alpine - musl based
  { distroSlug: "alpine", filename: "alpine-standard-3.20.0-x86_64.iso", version: "3.20.0", arch: "amd64", isoType: "installer", releaseStage: "stable", libc: "musl", initSystem: "openrc", size: 200_000_000, status: "verified", confidence: 100 },
  { distroSlug: "alpine", filename: "alpine-extended-3.20.0-x86_64.iso", version: "3.20.0", arch: "amd64", isoType: "full", releaseStage: "stable", libc: "musl", initSystem: "openrc", size: 900_000_000, status: "verified", confidence: 98 },
  { distroSlug: "alpine", filename: "alpine-virt-3.20.0-x86_64.iso", version: "3.20.0", arch: "amd64", edition: "cloud", isoType: "minimal", releaseStage: "stable", libc: "musl", initSystem: "openrc", size: 60_000_000, status: "verified", confidence: 95 },
  
  // Artix - Arch without systemd
  { distroSlug: "artix", filename: "artix-base-openrc-20240823-x86_64.iso", version: "20240823", arch: "amd64", edition: "minimal", isoType: "live", releaseStage: "stable", initSystem: "openrc", size: 800_000_000, status: "verified", confidence: 92 },
  { distroSlug: "artix", filename: "artix-plasma-runit-20240823-x86_64.iso", version: "20240823", arch: "amd64", spin: "kde", isoType: "live", releaseStage: "stable", initSystem: "runit", size: 2_400_000_000, status: "verified", confidence: 88 },
  { distroSlug: "artix", filename: "artix-xfce-s6-20240823-x86_64.iso", version: "20240823", arch: "amd64", spin: "xfce", isoType: "live", releaseStage: "stable", initSystem: "s6", size: 1_800_000_000, status: "pending", confidence: 75 },
  
  // NixOS
  { distroSlug: "nixos", filename: "nixos-24.05-x86_64-gnome.iso", version: "24.05", arch: "amd64", spin: "gnome", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 2_800_000_000, status: "verified", confidence: 95 },
  { distroSlug: "nixos", filename: "nixos-24.05-x86_64-plasma6.iso", version: "24.05", arch: "amd64", spin: "kde", isoType: "live", releaseStage: "stable", initSystem: "systemd", size: 3_200_000_000, status: "verified", confidence: 92 },
  { distroSlug: "nixos", filename: "nixos-24.05-x86_64-minimal.iso", version: "24.05", arch: "amd64", edition: "minimal", isoType: "minimal", releaseStage: "stable", initSystem: "systemd", size: 900_000_000, status: "verified", confidence: 100 },
  { distroSlug: "nixos", filename: "nixos-unstable-x86_64-gnome.iso", version: "unstable", arch: "amd64", spin: "gnome", isoType: "live", releaseStage: "nightly", initSystem: "systemd", size: 2_900_000_000, status: "staging", confidence: 60 },
  
  // Gentoo
  { distroSlug: "gentoo", filename: "gentoo-install-amd64-minimal-20241215.iso", version: "20241215", arch: "amd64", edition: "minimal", isoType: "minimal", releaseStage: "stable", libc: "glibc", initSystem: "openrc", size: 500_000_000, status: "verified", confidence: 100 },
  { distroSlug: "gentoo", filename: "gentoo-livegui-amd64-20241215.iso", version: "20241215", arch: "amd64", isoType: "live", releaseStage: "stable", libc: "glibc", initSystem: "openrc", size: 5_500_000_000, status: "pending", confidence: 70 },
];

function randomHash(len: number) {
  const chars = "0123456789abcdef";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

export async function seedFamilies(db: DbClient) {
  await db.insert(families).values([...FAMILIES_SEED]).onConflictDoNothing();
  return FAMILIES_SEED.length;
}

export async function seedDemo(db: DbClient) {
  // Seed families first
  await seedFamilies(db);

  // Get family IDs
  const familyRows = await db.select().from(families);
  const familyMap = Object.fromEntries(familyRows.map((f) => [f.slug, f.id]));

  // Insert distros (parents first)
  const distroMap: Record<string, number> = {};
  for (const d of DEMO_DISTROS.filter((x) => !x.parentSlug)) {
    const [row] = await db
      .insert(distros)
      .values({ slug: d.slug, name: d.name, osType: d.osType, familyId: familyMap[d.familySlug], website: d.website, description: d.description })
      .onConflictDoNothing()
      .returning({ id: distros.id });
    if (row) distroMap[d.slug] = row.id;
  }
  // Then children
  for (const d of DEMO_DISTROS.filter((x) => x.parentSlug)) {
    const [row] = await db
      .insert(distros)
      .values({ slug: d.slug, name: d.name, osType: d.osType, familyId: familyMap[d.familySlug], parentId: distroMap[d.parentSlug!], website: d.website, description: d.description })
      .onConflictDoNothing()
      .returning({ id: distros.id });
    if (row) distroMap[d.slug] = row.id;
  }

  // Refetch distro IDs in case some existed
  const distroRows = await db.select().from(distros);
  for (const dr of distroRows) distroMap[dr.slug] = dr.id;

  // Insert ISOs
  for (const iso of DEMO_ISOS) {
    await db
      .insert(isos)
      .values({
        distroId: distroMap[iso.distroSlug],
        filename: iso.filename,
        driveId: `demo_${randomHash(16)}`,
        version: iso.version,
        arch: iso.arch,
        edition: iso.edition,
        spin: iso.spin,
        isoType: iso.isoType,
        releaseStage: iso.releaseStage,
        libc: iso.libc,
        initSystem: iso.initSystem,
        hardwareTarget: iso.hardwareTarget,
        size: iso.size,
        checksumSha256: randomHash(64),
        status: iso.status,
        confidenceScore: iso.confidence,
      })
      .onConflictDoNothing();
  }

  return { families: FAMILIES_SEED.length, distros: DEMO_DISTROS.length, isos: DEMO_ISOS.length };
}

export { FAMILIES_SEED };
