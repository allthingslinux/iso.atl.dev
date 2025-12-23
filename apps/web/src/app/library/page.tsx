"use client";

import { Button } from "@iso/ui/components/button";
import { Input } from "@iso/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@iso/ui/components/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@iso/ui/components/command";
import { Library, RefreshCw, ChevronDown, Check, LayoutGrid, Table as TableIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { Suspense, useState } from "react";
import { useFamilies, useSearch } from "@/hooks/use-api";
import { IsoCard } from "@/components/iso-card";
import { DataTable, columns } from "@/components/iso-table";
import { cn } from "@iso/ui/lib/utils";

const ISO_TYPES = ["live", "installer", "minimal", "netinst", "full", "server", "rescue", "cloud"];
const RELEASE_STAGES = ["stable", "lts", "beta", "alpha", "rc", "snapshot", "nightly"];
const ARCHITECTURES = ["amd64", "arm64", "i386", "armhf", "riscv64", "ppc64le"];
const STATUSES = ["verified", "staging", "flagged"];
const EDITIONS = ["desktop", "server", "cloud", "workstation", "gaming", "education", "iot", "minimal"];
const SPINS = ["gnome", "kde", "xfce", "mate", "cinnamon", "budgie", "lxqt", "lxde", "i3", "sway", "hyprland"];
const INIT_SYSTEMS = ["systemd", "openrc", "runit", "s6", "dinit", "sysvinit"];
const LIBCS = ["glibc", "musl"];
const HARDWARE_TARGETS = ["generic", "nvidia", "nvidia-open", "amd", "intel", "steam-deck", "surface", "raspberry-pi"];

function FilterCombobox({ 
  value, 
  onChange, 
  options, 
  placeholder
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[]; 
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex w-full items-center justify-between gap-1 rounded-md border border-dashed border-zinc-700 bg-zinc-900/30 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200">
          <span className="truncate">
            <span className="text-zinc-500">{placeholder}:</span>{" "}
            <span className="text-zinc-300">{selected?.label || "All"}</span>
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-40" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SearchPageContent() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [family, setFamily] = useQueryState("family", { defaultValue: "" });
  const [arch, setArch] = useQueryState("arch", { defaultValue: "" });
  const [edition, setEdition] = useQueryState("edition", { defaultValue: "" });
  const [spin, setSpin] = useQueryState("spin", { defaultValue: "" });
  const [isoType, setIsoType] = useQueryState("isoType", { defaultValue: "" });
  const [releaseStage, setReleaseStage] = useQueryState("releaseStage", { defaultValue: "" });
  const [initSystem, setInitSystem] = useQueryState("initSystem", { defaultValue: "" });
  const [libc, setLibc] = useQueryState("libc", { defaultValue: "" });
  const [hardwareTarget, setHardwareTarget] = useQueryState("hardwareTarget", { defaultValue: "" });
  const [status, setStatus] = useQueryState("status", { defaultValue: "" });
  const [osType, setOsType] = useQueryState("osType", { defaultValue: "" });
  const [view, setView] = useQueryState("view", { defaultValue: "grid" });
  const [searchInput, setSearchInput] = useState(query);

  const { data: searchData, isLoading } = useSearch({
    q: query || undefined,
    family: family || undefined,
    arch: arch || undefined,
    edition: edition || undefined,
    spin: spin || undefined,
    isoType: isoType || undefined,
    releaseStage: releaseStage || undefined,
    initSystem: initSystem || undefined,
    libc: libc || undefined,
    hardwareTarget: hardwareTarget || undefined,
    status: status || undefined,
    osType: osType || undefined,
  });
  const { data: families } = useFamilies();

  const results = searchData?.results ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  const familyOptions = [{ value: "", label: "All" }, ...(families?.map(f => ({ value: f.slug, label: f.name })) || [])];
  const archOptions = [{ value: "", label: "All" }, ...ARCHITECTURES.map(a => ({ value: a, label: a }))];
  const editionOptions = [{ value: "", label: "All" }, ...EDITIONS.map(e => ({ value: e, label: e }))];
  const spinOptions = [{ value: "", label: "All" }, ...SPINS.map(s => ({ value: s, label: s }))];
  const typeOptions = [{ value: "", label: "All" }, ...ISO_TYPES.map(t => ({ value: t, label: t }))];
  const stageOptions = [{ value: "", label: "All" }, ...RELEASE_STAGES.map(s => ({ value: s, label: s }))];
  const initOptions = [{ value: "", label: "All" }, ...INIT_SYSTEMS.map(i => ({ value: i, label: i }))];
  const libcOptions = [{ value: "", label: "All" }, ...LIBCS.map(l => ({ value: l, label: l }))];
  const hardwareOptions = [{ value: "", label: "All" }, ...HARDWARE_TARGETS.map(h => ({ value: h, label: h }))];
  const statusOptions = [{ value: "", label: "All" }, ...STATUSES.map(s => ({ value: s, label: s }))];

  const activeFilters = [family, arch, edition, spin, isoType, releaseStage, initSystem, libc, hardwareTarget, status, osType].filter(Boolean);

  const clearFilters = () => {
    setFamily("");
    setArch("");
    setEdition("");
    setSpin("");
    setIsoType("");
    setReleaseStage("");
    setInitSystem("");
    setLibc("");
    setHardwareTarget("");
    setStatus("");
    setOsType("");
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-3xl text-white tracking-tight">
          ISO Archive
        </h1>
        <p className="text-sm text-zinc-400">
          Browse and download verified Linux ISOs from the community.
        </p>
      </header>

      {/* Search Bar */}
      <form className="mb-4 flex gap-2" onSubmit={handleSearch}>
        <div className="relative flex-1">
          <Input
            className="border-zinc-800 bg-zinc-900/50 pl-10 text-white"
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search ISOs..."
            value={searchInput}
          />
          <Library className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500" type="submit">
          Search
        </Button>
      </form>

      {/* Inline Filters */}
      <div className="mb-6 grid grid-cols-5 gap-2">
        <FilterCombobox value={family} onChange={setFamily} options={familyOptions} placeholder="Family" />
        <FilterCombobox value={arch} onChange={setArch} options={archOptions} placeholder="Arch" />
        <FilterCombobox value={edition} onChange={setEdition} options={editionOptions} placeholder="Edition" />
        <FilterCombobox value={spin} onChange={setSpin} options={spinOptions} placeholder="Desktop" />
        <FilterCombobox value={isoType} onChange={setIsoType} options={typeOptions} placeholder="Type" />
        <FilterCombobox value={releaseStage} onChange={setReleaseStage} options={stageOptions} placeholder="Stage" />
        <FilterCombobox value={initSystem} onChange={setInitSystem} options={initOptions} placeholder="Init" />
        <FilterCombobox value={libc} onChange={setLibc} options={libcOptions} placeholder="Libc" />
        <FilterCombobox value={hardwareTarget} onChange={setHardwareTarget} options={hardwareOptions} placeholder="Hardware" />
        <FilterCombobox value={status} onChange={setStatus} options={statusOptions} placeholder="Status" />
      </div>
      {activeFilters.length > 0 && (
        <div className="mb-4">
          <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-white">
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Count + View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-zinc-500">{searchData?.total ?? 0} results</span>
        <div className="flex items-center gap-1 rounded-md border border-zinc-800 p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "rounded p-1.5 transition-colors",
              view === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "rounded p-1.5 transition-colors",
              view === "table" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
            title="Table view"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500/50" />
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">No ISOs found</div>
      ) : view === "table" ? (
        <DataTable columns={columns} data={results} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((iso) => (
            <IsoCard key={iso.id} iso={iso} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
