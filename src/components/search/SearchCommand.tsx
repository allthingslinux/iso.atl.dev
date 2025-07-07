"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { GetSearchResultPath, SearchFiles } from "@/actions/search";
import { type z } from "zod";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from "@/components/ui/dialog.responsive";
import Icon from "@/components/ui/icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { type Schema_File } from "@/types/schema";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<z.infer<typeof Schema_File>[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const res = await SearchFiles(query);
      if (res.success) {
        setResults(res.data);
      }
    });
  }, [query]);

  const handleSelect = useCallback(
    (id: string) => {
      const toastId = `open-${id}`;
      toast.loading("Getting file path...", {
        description: "Might take a while for deep nested file",
        id: toastId,
      });

      startTransition(async () => {
        try {
          const paths = await GetSearchResultPath(id);
          if (!paths.success) throw new Error(paths.error);

          toast.success("Redirecting...", { id: toastId });
          router.push(`/${paths.data}`);
          setOpen(false);
        } catch (error) {
          const e = error as Error;
          console.error(`[Redirect Error] ${e.message}`);
          toast.error(e.message, { id: toastId });
        }
      });
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/40 md:w-40 lg:w-64"
      >
        <Icon name="Terminal" className="h-4 w-4" />
        <span className="hidden lg:inline-block font-mono">search --files</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="bg-background/95 backdrop-blur">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for files in the repository
          </DialogDescription>
          <div className="border-b border-border/40 pb-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
              <Icon name="Terminal" className="h-4 w-4" />
              <span>Command Palette</span>
            </div>
          </div>
          <Command>
            <CommandInput
              placeholder="$ search --files --recursive"
              value={query}
              onValueChange={setQuery}
              className="font-mono"
            />
            <CommandList>
              {query.length > 0 && (
                <>
                  {isPending && (
                    <div className="py-6 text-center text-sm font-mono text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        Searching filesystem...
                      </div>
                    </div>
                  )}
                  {!isPending && results.length === 0 && (
                    <CommandEmpty className="font-mono text-muted-foreground">
                      No matches found • errno: ENOENT
                    </CommandEmpty>
                  )}
                  {results.length > 0 && (
                    <CommandGroup heading={`${results.length} matches found`}>
                      {results.map((file) => (
                        <CommandItem
                          key={file.encryptedId}
                          value={file.name}
                          onSelect={() => handleSelect(file.encryptedId)}
                          className="font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <Icon name={file.mimeType.includes("folder") ? "Folder" : "File"} className="h-4 w-4" />
                            <span>{file.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
} 