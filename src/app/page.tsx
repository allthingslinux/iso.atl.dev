"use client";

import { Suspense, useEffect, useState } from "react";

import { GetReadme, ListFiles } from "@/actions/files";
import config from "@/config/gIndex.config";

import { cn } from "@/lib/utils";

import {
  FileActions,
  FileBreadcrumb,
  FileExplorerLayout,
  FileReadme,
} from "@/components/explorer";
import { Error as ErrorComponent } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { type Schema_File } from "@/types/schema";
import { type z } from "zod";

type StorageInfo = {
  usage: { bytes: number; tb: number; gb: number };
  limit: { bytes: number; tb: number; gb: number };
  percentage: number;
  totalFiles: number;
  totalFolders: number;
  fileTypeStats: Array<{
    type: string;
    count: number;
    size: { bytes: number; tb: number; gb: number };
    percentage: number;
  }>;
  driveInfo?: {
    name: string;
    id: string;
    capabilities: unknown;
  } | null;
  isSharedDrive: boolean;
};

// Define the expected type for data objects
interface FileData {
  data: {
    files: unknown[];
    nextPageToken?: string;
  };
}
interface ReadmeData {
  data: {
    content: string;
    type: string;
  };
}

// Fallback components for Suspense
const FileActionsFallback = () => (
  <div className="flex items-center gap-2">
    <Skeleton className="h-10 w-16" />
    <Skeleton className="h-10 w-10" />
  </div>
);

const FileReadmeFallback = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-24" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardContent>
  </Card>
);

const SystemInfoPanel = ({ rootItemCount }: { rootItemCount: number }) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        const response = await fetch("/api/internal/storage");
        if (response.ok) {
          const data = await response.json();
          setStorageInfo(data);
        }
      } catch (error) {
        console.error("Failed to fetch storage info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageInfo();
  }, []);

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 border border-primary/20">
            <Icon
              name="Activity"
              className="h-3 w-3"
              style={{ color: "hsl(var(--color-primary))" }}
            />
          </div>
          System Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-muted-foreground font-mono text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              FILES
            </div>
            <div className="font-mono font-semibold text-lg">
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : storageInfo ? (
                <span className="text-blue-500">
                  {storageInfo.totalFiles.toLocaleString()}
                </span>
              ) : (
                <span className="text-blue-500">
                  {rootItemCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-muted-foreground font-mono text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              FOLDERS
            </div>
            <div className="font-mono font-semibold text-lg">
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : storageInfo ? (
                <span className="text-yellow-500">
                  {storageInfo.totalFolders.toLocaleString()}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Storage Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground font-mono">Storage</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : storageInfo ? (
              <span className="font-mono text-xs">
                {storageInfo.usage.tb}TB / {storageInfo.limit.tb}TB
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">
                Unavailable
              </span>
            )}
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: storageInfo ? `${storageInfo.percentage}%` : "0%",
              }}
            />
          </div>
          {storageInfo && (
            <div className="text-xs text-muted-foreground font-mono text-center">
              {storageInfo.percentage.toFixed(1)}% used
            </div>
          )}
        </div>

        {/* File Type Statistics */}
        {storageInfo && storageInfo.fileTypeStats.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-muted-foreground font-mono text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                FILE TYPES
              </div>
              <div className="space-y-1.5">
                {storageInfo.fileTypeStats.slice(0, 5).map((stat, index) => {
                  const colors = [
                    "#3b82f6", // blue-500
                    "#10b981", // emerald-500
                    "#f59e0b", // amber-500
                    "#06b6d4", // cyan-500
                    "#ec4899", // pink-500
                  ];
                  return (
                    <div
                      key={stat.type}
                      className="flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full transition-all duration-200 group-hover:scale-125"
                          style={{
                            backgroundColor: colors[index % colors.length],
                          }}
                        />
                        <span className="font-mono uppercase">{stat.type}</span>
                      </div>
                      <div className="font-mono text-muted-foreground">
                        {stat.count.toLocaleString()} ({stat.percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default function RootPage() {
  const [data, setData] = useState<unknown>(null);
  const [readme, setReadme] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filesResult, readmeResult] = await Promise.all([
          ListFiles(),
          GetReadme(),
        ]);

        if (!filesResult.success) {
          setError(new Error(filesResult.error));
          return;
        }

        if (!readmeResult.success) {
          setError(new Error(readmeResult.error));
          return;
        }

        setData(filesResult);
        setReadme(readmeResult);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load data"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) return <ErrorComponent error={error} />;
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!data || !readme)
    return <div className="p-8 text-center">No data available</div>;

  const files = (data as FileData).data?.files as z.infer<typeof Schema_File>[];

  return (
    <div className={cn("h-fit w-full", "flex flex-col gap-6")}>
      {/* Combined Navigation/Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border border-border/30 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <span>~/</span>
          </div>
          <FileBreadcrumb />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <Icon name="HardDrive" className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">
            Shared Drive • Connected
          </span>
          <div className="ml-4 text-xs font-mono text-muted-foreground">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* System Info Sidebar and README view*/}
        <div className="lg:col-span-1 space-y-4">
          <SystemInfoPanel
            rootItemCount={(data as FileData).data?.files?.length || 0}
          />
          {(readme as ReadmeData).data && (
            <Suspense fallback={<FileReadmeFallback />}>
              <FileReadme
                content={(readme as ReadmeData).data.content}
                title={`README.${(readme as ReadmeData).data.type === "markdown" ? "md" : "txt"}`}
              />
            </Suspense>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="grow font-mono">File System</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {(data as FileData).data?.files?.length || 0} items
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Suspense fallback={<FileActionsFallback />}>
                    <FileActions />
                  </Suspense>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-2 pt-0 tablet:p-4 tablet:pt-0">
              <FileExplorerLayout
                encryptedId={config.apiConfig.rootFolder}
                files={files}
                nextPageToken={
                  (data as FileData).data?.nextPageToken ?? undefined
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
