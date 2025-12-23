"use client";

import { Button } from "@iso/ui/components/button";
import { Input } from "@iso/ui/components/input";
import { Label } from "@iso/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@iso/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@iso/ui/components/dialog";
import { Separator } from "@iso/ui/components/separator";
import { ArrowLeft, Download, FileText, HardDrive, Pencil, Flag, Trash2, Shield } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useIso } from "@/hooks/use-api";
import { useAuth } from "@/lib/dev-auth";

const ISO_TYPES = ["live", "installer", "minimal", "netinst", "full", "server", "rescue", "cloud"];
const RELEASE_STAGES = ["stable", "lts", "beta", "alpha", "rc", "snapshot", "nightly"];
const ARCHITECTURES = ["amd64", "arm64", "i386", "armhf", "riscv64", "ppc64le"];
const EDITIONS = ["desktop", "server", "cloud", "workstation", "gaming", "education", "iot", "minimal"];
const SPINS = ["gnome", "kde", "xfce", "mate", "cinnamon", "budgie", "lxqt", "lxde", "i3", "sway", "hyprland", "openbox", "fluxbox"];
const LIBCS = ["glibc", "musl"];
const INIT_SYSTEMS = ["systemd", "openrc", "runit", "s6", "dinit", "sysvinit"];
const HARDWARE_TARGETS = ["generic", "nvidia", "nvidia-open", "amd", "intel", "steam-deck", "surface", "asus", "raspberry-pi", "pinebook"];

export default function IsoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: iso, isLoading } = useIso(Number(id));
  const { canEdit, canModerate, canAdmin } = useAuth();
  const [edits, setEdits] = useState<Record<string, string>>({});

  if (isLoading) return <div className="p-8 text-zinc-400">Loading...</div>;
  if (!iso) return <div className="p-8 text-zinc-400">ISO not found</div>;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const getValue = (field: string) => edits[field] ?? (iso[field as keyof typeof iso] as string) ?? "";
  const setValue = (field: string, value: string) => setEdits((prev) => ({ ...prev, [field]: value }));
  const hasChanges = Object.keys(edits).length > 0;
  const resetEdits = () => setEdits({});

  return (
    <div className="p-8">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white" href="/">
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          {/* Status badges - above title */}
          <div className="mb-4 flex items-center gap-3">
            <span className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              iso.status === "verified" ? "bg-green-600 text-white" :
              iso.status === "pending" ? "bg-yellow-600 text-white" :
              iso.status === "flagged" ? "bg-red-600 text-white" :
              "bg-zinc-700 text-white"
            }`}>
              {iso.status?.toUpperCase()}
            </span>
            {iso.confidenceScore != null && (
              <span className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                iso.confidenceScore >= 80 ? "bg-green-600 text-white" :
                iso.confidenceScore >= 50 ? "bg-yellow-600 text-white" :
                "bg-red-600 text-white"
              }`}>
                {iso.confidenceScore}% CONFIDENCE
              </span>
            )}
          </div>

          <div className="mb-2 flex items-center gap-3">
            <span className="text-indigo-400 text-sm">{iso.familyName}</span>
            {iso.distroSlug && (
              <Link className="text-sm text-zinc-500 hover:text-zinc-300" href={`/distro/${iso.distroSlug}`}>
                → {iso.distroName}
              </Link>
            )}
          </div>
          <h1 className="mb-2 font-bold text-3xl text-white">
            {iso.distroName} {iso.version}
          </h1>
          <p className="font-mono text-sm text-zinc-500">{iso.filename}</p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-zinc-700">
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit ISO Metadata</DialogTitle>
                  <DialogDescription>
                    Make changes to the ISO metadata. Changes will be submitted for review.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400">Version & Release</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="Version" value={getValue("version")} onChange={(v) => setValue("version", v)} />
                      <FormSelect label="Release Stage" value={getValue("releaseStage")} onChange={(v) => setValue("releaseStage", v)} options={RELEASE_STAGES} />
                      <FormField label="Release Date" value={getValue("releaseDate")} onChange={(v) => setValue("releaseDate", v)} type="date" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400">Classification</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormSelect label="Edition" value={getValue("edition")} onChange={(v) => setValue("edition", v)} options={EDITIONS} />
                      <FormSelect label="Desktop Environment" value={getValue("spin")} onChange={(v) => setValue("spin", v)} options={SPINS} />
                      <FormSelect label="ISO Type" value={getValue("isoType")} onChange={(v) => setValue("isoType", v)} options={ISO_TYPES} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400">System</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormSelect label="Architecture" value={getValue("arch")} onChange={(v) => setValue("arch", v)} options={ARCHITECTURES} />
                      <FormSelect label="Libc" value={getValue("libc")} onChange={(v) => setValue("libc", v)} options={LIBCS} />
                      <FormSelect label="Init System" value={getValue("initSystem")} onChange={(v) => setValue("initSystem", v)} options={INIT_SYSTEMS} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormSelect label="Hardware Target" value={getValue("hardwareTarget")} onChange={(v) => setValue("hardwareTarget", v)} options={HARDWARE_TARGETS} />
                      <FormField label="Kernel Version" value={getValue("kernelVersion")} onChange={(v) => setValue("kernelVersion", v)} />
                      <FormField label="Language" value={getValue("language")} onChange={(v) => setValue("language", v)} />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={resetEdits}>Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button disabled={!hasChanges} onClick={() => { console.log("Submit:", edits); resetEdits(); }}>
                      Submit Changes
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" className="border-zinc-700">
              <Flag className="mr-1 h-3 w-3" />
              Flag
            </Button>
            {canModerate && (
              <Button size="sm" variant="outline" className="border-yellow-700 text-yellow-500">
                <Shield className="mr-1 h-3 w-3" />
                Verify
              </Button>
            )}
            {canAdmin && (
              <Button size="sm" variant="outline" className="border-red-700 text-red-500">
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {/* Classification */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Classification</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Edition" value={iso.edition} />
            <Row label="Desktop" value={iso.spin} />
            <Row label="Type" value={iso.isoType} />
            <Row label="Stage" value={iso.releaseStage} />
          </dl>
        </div>

        {/* System */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">System</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Arch" value={iso.arch} />
            <Row label="Libc" value={iso.libc} />
            <Row label="Init" value={iso.initSystem} />
            <Row label="Kernel" value={iso.kernelVersion} />
            <Row label="Hardware" value={iso.hardwareTarget} />
          </dl>
        </div>

        {/* Release */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Release</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Date" value={iso.releaseDate} />
            <Row label="Language" value={iso.language} />
            <Row label="Size" value={formatSize(iso.size)} />
          </dl>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
        <h2 className="mb-4 font-semibold text-white">Checksums</h2>
        <dl className="space-y-2 font-mono text-xs">
          <ChecksumRow label="MD5" value={iso.checksumMd5} />
          <ChecksumRow label="SHA1" value={iso.checksumSha1} />
          <ChecksumRow label="SHA256" value={iso.checksumSha256} />
        </dl>
      </div>

      <div className="flex gap-3">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-500">
          <a href={`/api/v1/downloads/direct/${id}`} rel="noreferrer" target="_blank">
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
        <Button asChild className="border-zinc-700" variant="outline">
          <a href={`/api/v1/downloads/torrent/${id}`} rel="noreferrer" target="_blank">
            <FileText className="mr-2 h-4 w-4" />
            Torrent
          </a>
        </Button>
        <Button asChild className="border-zinc-700" variant="outline">
          <a href={`/api/v1/downloads/magnet/${id}`} rel="noreferrer" target="_blank">
            <HardDrive className="mr-2 h-4 w-4" />
            Magnet
          </a>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-300">{value || "—"}</dd>
    </div>
  );
}

function ChecksumRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="mb-1 text-zinc-500">{label}</dt>
      <dd className="break-all text-zinc-400">{value}</dd>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">—</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
