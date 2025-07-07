"use client";

import React, { useCallback, useMemo, useState } from "react";

import { ListFiles } from "@/actions/files";
import { useLayout } from "@/context/layoutContext";
import { toast } from "sonner";
import { type z } from "zod";

import { type Schema_File } from "@/types/schema";

import { cn } from "@/lib/utils";

import useLoading from "@/hooks/useLoading";

import { FileItem } from "@/components/explorer";
import { PageLoader } from "@/components/layout";
import { LoadingButton } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

type Props = {
  encryptedId: string;
  files: z.infer<typeof Schema_File>[];
  nextPageToken?: string;
};

const FileExplorerLayout = React.memo(
  ({ encryptedId, files, nextPageToken }: Props) => {
    const { layout, isPending } = useLayout();
    const loading = useLoading();

    const [filesList, setFilesList] =
      useState<z.infer<typeof Schema_File>[]>(files);
    const [nextToken, setNextToken] = useState<string | undefined>(
      nextPageToken
    );
    const [isLoadingMore, setLoadingMore] = useState<boolean>(false);

    const onLoadMore = useCallback(async () => {
      if (isLoadingMore || !nextToken) return;

      setLoadingMore(true);
      try {
        const data = await ListFiles({ id: encryptedId, pageToken: nextToken });
        if (!data.success) throw new Error(data.error);

        const uniqueData = [...filesList, ...data.data.files].filter(
          (item, index, self) =>
            index === self.findIndex((i) => i.encryptedId === item.encryptedId)
        );

        setFilesList(uniqueData);
        setNextToken(data.data.nextPageToken ?? undefined);
      } catch (error) {
        const e = error as Error;
        console.error(`[OnLoadMore] ${e.message}`);
        toast.error(e.message);
      } finally {
        setLoadingMore(false);
      }
    }, [encryptedId, filesList, nextToken, isLoadingMore]);

    // Memoize the load more button
    const loadMoreButton = useMemo(() => {
      if (!nextToken) return null;

      return (
        <div className="mt-8 flex justify-center">
          <LoadingButton
            variant="outline"
            loading={isLoadingMore}
            onClick={onLoadMore}
          >
            Load more files
          </LoadingButton>
        </div>
      );
    }, [nextToken, isLoadingMore, onLoadMore]);

    // Determine if there is at least one file (not a directory) in the list
    const hasFiles = filesList.some((f) => !f.mimeType.includes("folder"));

    if (loading || isPending) return <PageLoader message="Loading files..." />;

    if (!filesList.length) {
      return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative rounded-full bg-muted/30 p-8 mb-6 border-2 border-dashed border-border/40">
              <div className="relative">
                <Icon
                  name="FolderOpen"
                  className="h-16 w-16 text-muted-foreground/60"
                />
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-warning/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2.5 h-2.5 bg-warning rounded-full"></div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 font-mono bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
              DIRECTORY_EMPTY
            </h3>
            <p className="text-muted-foreground text-center max-w-md font-mono text-sm">
              No files or directories found in current path.
              <br />
              <span className="text-xs mt-2 block flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-destructive rounded-full animate-pulse"></div>
                errno: ENOENT • status: 404
              </span>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* List Header */}
        {layout === "list" && (
          <div className="flex items-center gap-4 border-b border-border/40 p-3 text-sm font-medium text-muted-foreground bg-muted/10">
            {hasFiles && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon
                    name="File"
                    className="h-4 w-4"
                    style={{ color: "hsl(var(--color-primary))" }}
                  />
                </div>
                <span className="font-mono">TYPE</span>
              </div>
            )}
            <div className="flex-1 font-mono">NAME</div>
            <div className="hidden w-24 sm:block font-mono">SIZE</div>
            <div className="hidden w-32 lg:block font-mono">MODIFIED</div>
            <div className="w-8"></div>
          </div>
        )}

        {/* Files Grid/List */}
        <div
          className={cn(
            layout === "list"
              ? "flex flex-col"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          )}
        >
          {filesList.map((file) => (
            <div key={file.encryptedId}>
              <FileItem data={file} layout={layout} />
            </div>
          ))}
        </div>

        {loadMoreButton}
      </div>
    );
  }
);

FileExplorerLayout.displayName = "FileExplorerLayout";

export default FileExplorerLayout;
