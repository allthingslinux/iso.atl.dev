"use client";

import React, { useCallback, useMemo, useState } from "react";

import { usePathname } from "next/navigation";

import config from "@/config/gIndex.config";
import { type TLayout } from "@/context/layoutContext";
import { toast } from "sonner";
import { type z } from "zod";

import { type Schema_File } from "@/types/schema";

import { bytesToReadable, durationToReadable, formatDate } from "@/lib/utils";

import useRouter from "@/hooks/usePRouter";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon, { type IconName } from "@/components/ui/icon";

// import { GetMostRecentFileUpdate } from "@/actions/folder";

type Props = {
  data: z.infer<typeof Schema_File>;
  layout: TLayout;
};

// =================================================================================================
// MODAL FOR FILE INFO
// =================================================================================================
const FileInfoModal = ({
  file,
  isOpen,
  onClose,
}: {
  file: z.infer<typeof Schema_File>;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const pathname = usePathname();

  const fileInfo = useMemo(() => {
    const info = [
      { label: "File Name", value: file.name },
      { label: "Type", value: file.mimeType },
      {
        label: "Size",
        value: `${bytesToReadable(file.size ?? 0)} (${(
          file.size ?? 0
        ).toLocaleString()} bytes)`,
      },
      { label: "Last Modified", value: formatDate(file.modifiedTime) },
    ];
    if (file.imageMediaMetadata) {
      info.push({
        label: "Dimensions",
        value: `${file.imageMediaMetadata.width} × ${file.imageMediaMetadata.height} pixels`,
      });
    }
    if (file.videoMediaMetadata) {
      info.push({
        label: "Dimensions",
        value: `${file.videoMediaMetadata.width} × ${file.videoMediaMetadata.height} pixels`,
      });
      info.push({
        label: "Duration",
        value: durationToReadable(file.videoMediaMetadata.durationMillis),
      });
    }
    return info;
  }, [file]);

  const downloadUrl = useMemo(() => {
    const url = new URL(
      `/api/download${pathname}/${file.name}`.replace(/\/+/g, "/"),
      config.basePath
    );
    return url.toString();
  }, [pathname, file.name]);

  const handleCopyDownloadLink = useCallback(async () => {
    toast.promise(navigator.clipboard.writeText(downloadUrl), {
      loading: "Copying download link...",
      success: "Download link copied!",
      error: "Failed to copy download link.",
    });
  }, [downloadUrl]);

  const handleDownload = useCallback(() => {
    window.open(downloadUrl, "_blank");
  }, [downloadUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="line-clamp-2 pr-6 !text-xl font-semibold text-left">
            {file.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            {fileInfo.map((info) => (
              <div key={info.label} className="flex flex-col space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {info.label}
                </dt>
                <dd className="break-all text-sm">{info.value}</dd>
              </div>
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCopyDownloadLink}
              className="w-full sm:w-auto"
            >
              <Icon name="Copy" className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleDownload} className="w-full sm:w-auto">
              <Icon name="Download" className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// =================================================================================================
// ICON MAPPING & COLORS
// =================================================================================================
const getFileIcon = (isFolder: boolean, extension?: string): IconName => {
  if (isFolder) return "Folder";
  const ext = extension?.toLowerCase();
  const iconMap: Record<string, IconName> = {
    pdf: "FileText",
    doc: "FileText",
    docx: "FileText",
    txt: "FileText",
    md: "FileText",
    xls: "FileSpreadsheet",
    xlsx: "FileSpreadsheet",
    ppt: "Presentation",
    pptx: "Presentation",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    svg: "Image",
    webp: "Image",
    mp4: "Video",
    avi: "Video",
    mov: "Video",
    mkv: "Video",
    mp3: "Music",
    wav: "Music",
    flac: "Music",
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    tar: "Archive",
    gz: "Archive",
    js: "Code",
    ts: "Code",
    jsx: "Code",
    tsx: "Code",
    py: "Code",
    java: "Code",
    cpp: "Code",
    c: "Code",
    css: "Code",
    html: "Code",
    json: "Code",
    xml: "Code",
    iso: "Disc",
    img: "Disc",
    exe: "Play",
    msi: "Play",
    deb: "Package",
    rpm: "Package",
    appimage: "Package",
  };
  return iconMap[ext || ""] || "File";
};

// Enhanced color mapping for different file types
const getFileColor = (isFolder: boolean, extension?: string): string => {
  if (isFolder) return "hsl(var(--color-folder))";

  const ext = extension?.toLowerCase();
  const colorMap: Record<string, string> = {
    // Archives
    zip: "hsl(var(--color-archive))",
    rar: "hsl(var(--color-archive))",
    "7z": "hsl(var(--color-archive))",
    tar: "hsl(var(--color-archive))",
    gz: "hsl(var(--color-archive))",

    // Code files
    js: "hsl(var(--color-code))",
    ts: "hsl(var(--color-code))",
    jsx: "hsl(var(--color-code))",
    tsx: "hsl(var(--color-code))",
    py: "hsl(var(--color-code))",
    java: "hsl(var(--color-code))",
    cpp: "hsl(var(--color-code))",
    c: "hsl(var(--color-code))",
    css: "hsl(var(--color-code))",
    html: "hsl(var(--color-code))",
    json: "hsl(var(--color-code))",
    xml: "hsl(var(--color-code))",

    // Media files
    jpg: "hsl(var(--color-media))",
    jpeg: "hsl(var(--color-media))",
    png: "hsl(var(--color-media))",
    gif: "hsl(var(--color-media))",
    svg: "hsl(var(--color-media))",
    webp: "hsl(var(--color-media))",
    mp4: "hsl(var(--color-media))",
    avi: "hsl(var(--color-media))",
    mov: "hsl(var(--color-media))",
    mkv: "hsl(var(--color-media))",
    mp3: "hsl(var(--color-media))",
    wav: "hsl(var(--color-media))",
    flac: "hsl(var(--color-media))",

    // ISO and system files
    iso: "hsl(var(--color-warning))",
    img: "hsl(var(--color-warning))",
    exe: "hsl(var(--color-info))",
    msi: "hsl(var(--color-info))",
    deb: "hsl(var(--color-success))",
    rpm: "hsl(var(--color-success))",
    appimage: "hsl(var(--color-success))",
  };

  return colorMap[ext || ""] || "hsl(var(--color-muted-foreground))";
};

// =================================================================================================
// ACTION DROPDOWN
// =================================================================================================
const FileItemActions = ({
  onOpen,
  onCopyLink,
  onShowInfo,
  onDownload,
  isFolder,
}: {
  onOpen: () => void;
  onCopyLink: () => void;
  onShowInfo: () => void;
  onDownload: () => void;
  isFolder: boolean;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Icon name="MoveVertical" className="h-4 w-4" />
        <span className="sr-only">More actions</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      onClick={(e) => e.stopPropagation()}
      className="w-48"
    >
      <DropdownMenuItem onSelect={onOpen}>
        <Icon name="ArrowRight" className="mr-2 h-4 w-4" />
        <span>Open</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onCopyLink}>
        <Icon name="Link" className="mr-2 h-4 w-4" />
        <span>Copy Link</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onShowInfo}>
        <Icon name="Info" className="mr-2 h-4 w-4" />
        <span>Info</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onDownload} disabled={isFolder}>
        <Icon name="Download" className="mr-2 h-4 w-4" />
        <span>Download</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// =================================================================================================
// MAIN FILE ITEM COMPONENT
// =================================================================================================
export const FileItem = ({ data: file, layout }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);

  const isFolder = file.mimeType.includes("folder");
  const fileIcon = getFileIcon(isFolder, file.fileExtension);
  const fileColor = getFileColor(isFolder, file.fileExtension);
  const filePath = `${pathname}/${file.name}`.replace(/\/+/g, "/");

  const handleNavigation = useCallback(() => {
    router.push(filePath);
  }, [router, filePath]);

  const handleShowInfo = useCallback(() => setInfoModalOpen(true), []);

  const handleClick = useCallback(() => {
    if (isFolder) {
      handleNavigation();
    } else {
      handleShowInfo();
    }
  }, [isFolder, handleNavigation, handleShowInfo]);

  const handleCopyLink = useCallback(() => {
    const linkToCopy = new URL(filePath, config.basePath).toString();
    toast.promise(navigator.clipboard.writeText(linkToCopy), {
      loading: "Copying link...",
      success: "Link copied to clipboard!",
      error: "Failed to copy link.",
    });
  }, [filePath]);

  const handleDownload = useCallback(() => {
    if (isFolder) return;
    const downloadUrl = new URL(
      `/api/download${filePath}`,
      config.basePath
    ).toString();
    window.open(downloadUrl, "_blank");
  }, [filePath, isFolder]);

  // Common props for the action dropdown
  const actionProps = {
    onOpen: handleNavigation,
    onCopyLink: handleCopyLink,
    onShowInfo: handleShowInfo,
    onDownload: handleDownload,
    isFolder,
  };

  const renderGridItem = () => (
    <Card
      className="group relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-sm"
      onClick={handleClick}
    >
      <div className="relative flex h-32 w-full items-center justify-center bg-muted/30">
        {file.thumbnailLink && file.mimeType.includes("image") ? (
          <img
            src={`/api/thumb/${file.encryptedId}`}
            alt={file.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-xl mb-2 shadow-sm"
              style={{
                backgroundColor: `${fileColor}15`,
                border: `2px solid ${fileColor}20`,
              }}
            >
              <Icon
                name={fileIcon}
                className="h-8 w-8 transition-colors"
                style={{ color: fileColor }}
              />
            </div>
            {file.fileExtension && (
              <div
                className="mt-1 px-2 py-1 rounded text-xs font-mono border transition-colors"
                style={{
                  backgroundColor: `${fileColor}10`,
                  borderColor: `${fileColor}30`,
                  color: fileColor,
                }}
              >
                {file.fileExtension.toUpperCase()}
              </div>
            )}
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <FileItemActions {...actionProps} />
        </div>
      </div>
      <CardHeader className="p-3">
        <CardTitle className="line-clamp-2 text-sm font-medium mb-2">
          {file.name}
        </CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono flex items-center gap-1">
            {isFolder ? (
              <>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: fileColor }}
                ></div>
                <span>DIR</span>
              </>
            ) : (
              <>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: fileColor }}
                ></div>
                <span>{bytesToReadable(file.size ?? 0)}</span>
              </>
            )}
          </span>
          <span className="font-mono">
            {formatDate(file.modifiedTime).split(" ")[0]}
          </span>
        </div>
      </CardHeader>
    </Card>
  );

  const renderListItem = () => (
    <div
      className="group flex cursor-pointer items-center gap-4 border-b border-border/30 p-3 transition-all duration-150 hover:bg-muted/30"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm"
          style={{
            backgroundColor: `${fileColor}15`,
            border: `1px solid ${fileColor}20`,
          }}
        >
          <Icon
            name={fileIcon}
            className="h-4 w-4 shrink-0 transition-colors"
            style={{ color: fileColor }}
          />
        </div>
        {file.fileExtension && !isFolder && (
          <div
            className="hidden sm:block px-1.5 py-0.5 rounded text-xs font-mono border transition-colors"
            style={{
              backgroundColor: `${fileColor}10`,
              borderColor: `${fileColor}30`,
              color: fileColor,
            }}
          >
            {file.fileExtension.toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 truncate">
        <div className="font-medium text-foreground">{file.name}</div>
        {!isFolder && file.mimeType && (
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            {file.mimeType.split("/")[0]}/{file.mimeType.split("/")[1]}
          </div>
        )}
      </div>
      <div className="hidden w-24 text-sm text-muted-foreground sm:block font-mono">
        {!isFolder ? (
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: fileColor }}
            ></div>
            <span>{bytesToReadable(file.size ?? 0)}</span>
          </div>
        ) : null}
      </div>
      <div className="hidden w-32 text-sm text-muted-foreground lg:block font-mono">
        {formatDate(file.modifiedTime)}
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <FileItemActions {...actionProps} />
      </div>
    </div>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          {layout === "grid" ? renderGridItem() : renderListItem()}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onSelect={actionProps.onOpen}>
            <Icon name="ArrowRight" className="mr-2 h-4 w-4" />
            <span>Open</span>
          </ContextMenuItem>
          <ContextMenuItem onSelect={actionProps.onCopyLink}>
            <Icon name="Link" className="mr-2 h-4 w-4" />
            <span>Copy Link</span>
          </ContextMenuItem>
          <ContextMenuItem onSelect={actionProps.onShowInfo}>
            <Icon name="Info" className="mr-2 h-4 w-4" />
            <span>Info</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={actionProps.onDownload}
            disabled={actionProps.isFolder}
          >
            <Icon name="Download" className="mr-2 h-4 w-4" />
            <span>Download</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <FileInfoModal
        file={file}
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />
    </>
  );
};

export default FileItem;
