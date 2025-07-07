"use server";

import config from "@/config/gIndex.config";
import { type ActionResponseSchema } from "@/types";
import { type z } from "zod";

import { Schema_File, Schema_File_Shortcut } from "@/types/schema";

import { encryptionService, gdrive } from "@/lib/utils.server";

import { ValidatePaths } from "./paths";

interface DriveFile {
  mimeType?: string;
  size?: string | number;
  fileExtension?: string;
  name?: string;
}

/**
 * List files in a folder
 * @param {object} options
 * @param {string} options.id (optional) - Folder ID to fetch, default is root folder
 * @param {string} options.pageToken (optional) - Page token to fetch next page
 */
export async function ListFiles({
  id,
  pageToken,
}: { id?: string; pageToken?: string } = {}): Promise<
  ActionResponseSchema<{
    files: z.infer<typeof Schema_File>[];
    nextPageToken?: string | null;
  }>
> {
  const isSharedDrive = !!(
    config.apiConfig.isTeamDrive && config.apiConfig.sharedDrive
  );
  const decryptedId = await encryptionService.decrypt(
    id ?? config.apiConfig.rootFolder
  );
  const decryptedSharedDrive = isSharedDrive
    ? await encryptionService.decrypt(config.apiConfig.sharedDrive!)
    : undefined;

  const filterName = config.apiConfig.hiddenFiles
    .map((item) => `not name = '${item}'`)
    .join(" and ");
  const filterQuery: string = [
    ...config.apiConfig.defaultQuery,
    `'${decryptedId}' in parents`,
    filterName,
  ].join(" and ");

  const { data } = await gdrive.files.list({
    q: filterQuery,
    fields: `files(${config.apiConfig.defaultField}), nextPageToken`,
    orderBy: config.apiConfig.defaultOrder,
    pageSize: config.apiConfig.itemsPerPage,
    pageToken,
    ...(decryptedSharedDrive && {
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      driveId: decryptedSharedDrive,
      corpora: "drive",
    }),
  });
  if (!data.files?.length)
    return {
      success: true,
      message: "No files found",
      data: {
        files: [],
        nextPageToken: data.nextPageToken,
      },
    };

  const files: z.infer<typeof Schema_File>[] = [];
  for (const file of data.files) {
    files.push({
      encryptedId: await encryptionService.encrypt(file.id!),
      encryptedWebContentLink: file.webContentLink
        ? await encryptionService.encrypt(file.webContentLink)
        : undefined,
      name: file.name!,
      mimeType: file.mimeType!,
      trashed: file.trashed ?? false,
      modifiedTime: new Date(file.modifiedTime!).toLocaleDateString(),
      fileExtension: file.fileExtension ?? undefined,
      size: file.size ? Number(file.size) : undefined,
      thumbnailLink: file.thumbnailLink ?? undefined,
      imageMediaMetadata: file.imageMediaMetadata
        ? {
            width: Number(file.imageMediaMetadata.width),
            height: Number(file.imageMediaMetadata.height),
            rotation: Number(file.imageMediaMetadata.rotation ?? 0),
          }
        : undefined,
      videoMediaMetadata: file.videoMediaMetadata
        ? {
            durationMillis: Number(file.videoMediaMetadata.durationMillis),
            height: Number(file.videoMediaMetadata.height),
            width: Number(file.videoMediaMetadata.width),
          }
        : undefined,
    });
  }

  const parsed = Schema_File.array().safeParse(files);
  if (!parsed.success)
    return {
      success: false,
      message: "Failed to parse files",
      error: parsed.error.message,
    };

  return {
    success: true,
    message: "Files found",
    data: {
      files: parsed.data,
      nextPageToken: data.nextPageToken,
    },
  };
}

/**
 * Get file details
 * @param id - File ID to fetch
 */
export async function GetFile(
  id: string
): Promise<ActionResponseSchema<z.infer<typeof Schema_File> | null>> {
  const decryptedId = await encryptionService.decrypt(
    id ?? config.apiConfig.rootFolder
  );

  const { data } = await gdrive.files.get({
    fileId: decryptedId,
    fields: config.apiConfig.defaultField,
    supportsAllDrives: config.apiConfig.isTeamDrive,
  });
  if (!data.id)
    return {
      success: false,
      message: "File not found",
      error: "NotFound",
    };

  const file: z.infer<typeof Schema_File> = {
    encryptedId: await encryptionService.encrypt(data.id),
    encryptedWebContentLink: data.webContentLink
      ? await encryptionService.encrypt(data.webContentLink)
      : undefined,
    name: data.name!,
    mimeType: data.mimeType!,
    trashed: data.trashed ?? false,
    modifiedTime: new Date(data.modifiedTime!).toLocaleDateString(),
    fileExtension: data.fileExtension ?? undefined,
    size: data.size ? Number(data.size) : undefined,
    thumbnailLink: data.thumbnailLink ?? undefined,
    imageMediaMetadata: data.imageMediaMetadata
      ? {
          width: Number(data.imageMediaMetadata.width),
          height: Number(data.imageMediaMetadata.height),
          rotation: Number(data.imageMediaMetadata.rotation ?? 0),
        }
      : undefined,
    videoMediaMetadata: data.videoMediaMetadata
      ? {
          durationMillis: Number(data.videoMediaMetadata.durationMillis),
          height: Number(data.videoMediaMetadata.height),
          width: Number(data.videoMediaMetadata.width),
        }
      : undefined,
  };

  const parsed = Schema_File.safeParse(file);
  if (!parsed.success)
    return {
      success: false,
      message: "Failed to parse file",
      error: parsed.error.message,
    };

  return {
    success: true,
    message: "File found",
    data: parsed.data,
  };
}

/**
 * Get readme file inside a folder
 * @param id - Folder ID to fetch, default is root folder
 */
export async function GetReadme(id: string | null = null): Promise<
  ActionResponseSchema<{
    type: "markdown" | "txt";
    content: string;
  } | null>
> {
  const isSharedDrive = !!(
    config.apiConfig.isTeamDrive && config.apiConfig.sharedDrive
  );
  const decryptedId = await encryptionService.decrypt(
    id ?? config.apiConfig.rootFolder
  );
  const decryptedSharedDrive = isSharedDrive
    ? await encryptionService.decrypt(config.apiConfig.sharedDrive!)
    : undefined;

  const filterQuery: string = [
    "trashed = false",
    "(not mimeType contains 'folder')",
    `name = '${config.apiConfig.specialFile.readme}'`,
    `'${decryptedId}' in parents`,
  ].join(" and ");

  const { data } = await gdrive.files.list({
    q: filterQuery,
    fields: `files(${config.apiConfig.defaultField}, parents), nextPageToken`,
    orderBy: config.apiConfig.defaultOrder,
    pageSize: config.apiConfig.itemsPerPage,
    pageToken: undefined,
    ...(decryptedSharedDrive && {
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      driveId: decryptedSharedDrive,
      corpora: "drive",
    }),
  });

  if (!data.files?.length)
    return {
      success: true,
      message: "No README found",
      data: null,
    };

  let file;
  if (data.files.length === 1) {
    file = data.files[0];
  } else {
    file = data.files.find((file) => file.mimeType === "text/markdown");
    file ??= data.files.find(
      (file) => file.mimeType === "application/vnd.google-apps.shortcut"
    );
  }

  if (!file)
    return {
      success: true,
      message: "No README found",
      data: null,
    };

  switch (file.mimeType) {
    case "application/vnd.google-apps.shortcut":
      const { data: shortcutData } = await gdrive.files.get({
        fileId: file.id!,
        alt: "media",
        supportsAllDrives: config.apiConfig.isTeamDrive,
      });
      const parsedData = Schema_File_Shortcut.safeParse(shortcutData);
      if (!parsedData.success)
        return {
          success: false,
          message: "Failed to parse shortcut data",
          error: parsedData.error.message,
        };

      if (
        !parsedData.data.shortcutDetails.targetId ||
        (parsedData.data.shortcutDetails.targetMimeType !== "text/markdown" &&
          parsedData.data.shortcutDetails.targetMimeType !== "text/plain")
      )
        return {
          success: true,
          message: "Shortcut target is not a markdown file or plain text",
          data: null,
        };

      const { data: shortcutContent } = await gdrive.files.get(
        {
          fileId: parsedData.data.shortcutDetails.targetId,
          alt: "media",
          supportsAllDrives: config.apiConfig.isTeamDrive,
        },
        {
          responseType: "text",
        }
      );

      return {
        success: true,
        message: "README found",
        data: {
          type:
            parsedData.data.shortcutDetails.targetMimeType === "text/markdown"
              ? "markdown"
              : "txt",
          content: shortcutContent as string,
        },
      };
    case "text/markdown":
    case "text/plain":
      const { data: content } = await gdrive.files.get(
        {
          fileId: file.id!,
          alt: "media",
          supportsAllDrives: config.apiConfig.isTeamDrive,
        },
        {
          responseType: "text",
        }
      );
      return {
        success: true,
        message: "README found",
        data: {
          type: file.mimeType === "text/markdown" ? "markdown" : "txt",
          content: content as string,
        },
      };
    default:
      return {
        success: true,
        message: "No README found",
        data: null,
      };
  }
}

/**
 * Get banner file inside a folder
 * @param id - Folder ID to fetch, default is root folder
 */
export async function GetBanner(
  id: string | null = null
): Promise<ActionResponseSchema<string | null>> {
  const isSharedDrive = !!(
    config.apiConfig.isTeamDrive && config.apiConfig.sharedDrive
  );
  const decryptedId = await encryptionService.decrypt(
    id ?? config.apiConfig.rootFolder
  );
  const decryptedSharedDrive = isSharedDrive
    ? await encryptionService.decrypt(config.apiConfig.sharedDrive!)
    : undefined;

  const filterQuery: string = [
    ...config.apiConfig.defaultQuery,
    `name contains '${config.apiConfig.specialFile.banner}'`,
    `'${decryptedId}' in parents`,
  ].join(" and ");

  const { data } = await gdrive.files.list({
    q: filterQuery,
    fields: `files(${config.apiConfig.defaultField},parents)`,
    orderBy: config.apiConfig.defaultOrder,
    pageSize: config.apiConfig.itemsPerPage,
    pageToken: undefined,
    ...(decryptedSharedDrive && {
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      driveId: decryptedSharedDrive,
      corpora: "drive",
    }),
  });
  if (!data.files?.length)
    return {
      success: true,
      message: "No banner found",
      data: null,
    };

  const encryptedId = await encryptionService.encrypt(data.files[0]?.id ?? "");
  return {
    success: true,
    message: "Banner found",
    data: encryptedId,
  };
}

/**
 * Get content of text file
 * @param id - File ID to fetch
 */
export async function GetContent(
  id: string
): Promise<ActionResponseSchema<string>> {
  const decryptedId = await encryptionService.decrypt(id);

  const { data, status, statusText } = await gdrive.files.get(
    {
      fileId: decryptedId,
      alt: "media",
      supportsAllDrives: config.apiConfig.isTeamDrive,
    },
    {
      responseType: "text",
    }
  );
  if (status !== 200)
    return {
      success: false,
      message: "Failed to fetch content",
      error: statusText,
    };

  return {
    success: true,
    message: "Content found",
    data: data as string,
  };
}

/**
 * Get siblings media files from the same parent folder
 * @param paths - Paths to check
 */
export async function GetSiblingsMedia(
  paths: string[]
): Promise<ActionResponseSchema<z.infer<typeof Schema_File>[]>> {
  const pathIds = await ValidatePaths(paths);
  if (!pathIds.success)
    return {
      success: false,
      message: "Failed to validate paths",
      error: pathIds.error,
    };
  const folderPaths = pathIds.data.filter(
    (item) => item.mimeType === "application/vnd.google-apps.folder"
  );

  const parentId =
    folderPaths[folderPaths.length - 1]?.id ?? config.apiConfig.rootFolder;
  const isSharedDrive = !!(
    config.apiConfig.isTeamDrive && config.apiConfig.sharedDrive
  );
  const decryptedParentId = await encryptionService.decrypt(parentId);
  const decryptedSharedDrive = isSharedDrive
    ? await encryptionService.decrypt(config.apiConfig.sharedDrive!)
    : undefined;

  const filterName = config.apiConfig.hiddenFiles
    .map((item) => `not name = '${item}'`)
    .join(" and ");
  const filterQuery: string = [
    ...config.apiConfig.defaultQuery,
    `'${decryptedParentId}' in parents`,
    filterName,
    "(mimeType contains 'video' or mimeType contains 'audio')",
  ].join(" and ");

  const { data } = await gdrive.files.list({
    q: filterQuery,
    fields: `files(${config.apiConfig.defaultField})`,
    orderBy: config.apiConfig.defaultOrder,
    pageSize: 100,
    ...(decryptedSharedDrive && {
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      driveId: decryptedSharedDrive,
      corpora: "drive",
    }),
  });
  if (!data.files?.length)
    return { success: true, message: "No siblings media found", data: [] };

  const files: z.infer<typeof Schema_File>[] = [];
  for (const file of data.files) {
    files.push({
      encryptedId: await encryptionService.encrypt(file.id!),
      encryptedWebContentLink: file.webContentLink
        ? await encryptionService.encrypt(file.webContentLink)
        : undefined,
      name: file.name!,
      mimeType: file.mimeType!,
      trashed: file.trashed ?? false,
      modifiedTime: new Date(file.modifiedTime!).toLocaleDateString(),
      fileExtension: file.fileExtension ?? undefined,
      size: file.size ? Number(file.size) : undefined,
      thumbnailLink: file.thumbnailLink ?? undefined,
      imageMediaMetadata: file.imageMediaMetadata
        ? {
            width: Number(file.imageMediaMetadata.width),
            height: Number(file.imageMediaMetadata.height),
            rotation: Number(file.imageMediaMetadata.rotation ?? 0),
          }
        : undefined,
      videoMediaMetadata: file.videoMediaMetadata
        ? {
            durationMillis: Number(file.videoMediaMetadata.durationMillis),
            height: Number(file.videoMediaMetadata.height),
            width: Number(file.videoMediaMetadata.width),
          }
        : undefined,
    });
  }

  const parsed = Schema_File.array().safeParse(files);
  if (!parsed.success)
    return {
      success: false,
      message: "Failed to parse siblings media",
      error: parsed.error.message,
    };

  return {
    success: true,
    message: "Siblings media fetched",
    data: parsed.data,
  };
}

/**
 * Get storage information from Google Drive (Shared Drive)
 */
export async function GetStorageInfo(): Promise<
  ActionResponseSchema<{
    storageUsed: number;
    storageLimit: number;
    storageUsedInDrive: number;
    storageUsedInTrash: number;
    totalFiles: number;
    totalFolders: number;
    fileTypeStats: { [key: string]: { count: number; size: number } };
    driveInfo?: {
      name: string;
      id: string;
      capabilities: unknown;
    };
  }>
> {
  try {
    const isSharedDrive = !!(
      config.apiConfig.isTeamDrive && config.apiConfig.sharedDrive
    );

    console.info("[GetStorageInfo] isSharedDrive:", isSharedDrive);
    console.info(
      "[GetStorageInfo] config.apiConfig.isTeamDrive:",
      config.apiConfig.isTeamDrive
    );
    console.info(
      "[GetStorageInfo] config.apiConfig.sharedDrive:",
      config.apiConfig.sharedDrive
    );

    if (isSharedDrive) {
      // For shared drives, get drive info and calculate usage from files
      const decryptedSharedDrive = await encryptionService.decrypt(
        config.apiConfig.sharedDrive!
      );

      // Get shared drive information
      const { data: driveData } = await gdrive.drives.get({
        driveId: decryptedSharedDrive,
        fields: "id, name, capabilities",
      });

      // Calculate comprehensive storage and file statistics
      let totalSize = 0;
      let totalFiles = 0;
      let totalFolders = 0;
      const fileTypeStats: { [key: string]: { count: number; size: number } } =
        {};
      let pageToken: string | null | undefined = null;

      console.info(
        "[GetStorageInfo] Starting comprehensive scan of shared drive..."
      );

      do {
        const response: unknown = await gdrive.files.list({
          q: "trashed = false",
          fields: "files(id,name,size,mimeType,fileExtension), nextPageToken",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          driveId: decryptedSharedDrive,
          corpora: "drive",
          pageSize: 1000,
          pageToken: pageToken || undefined,
        });

        if (
          response &&
          (response as { data: { files: unknown[]; nextPageToken?: string } })
            .data.files
        ) {
          for (const file of (response as { data: { files: unknown[] } }).data
            .files) {
            const f = file as DriveFile;
            if (f.mimeType === "application/vnd.google-apps.folder") {
              totalFolders++;
            } else {
              totalFiles++;
              if (f.size) {
                const fileSize = Number(f.size);
                totalSize += fileSize;

                // Categorize by file type
                const extension = f.fileExtension || "no-extension";
                const mimeType = f.mimeType || "unknown";

                let category = "other";
                if (mimeType.startsWith("image/")) category = "images";
                else if (mimeType.startsWith("video/")) category = "videos";
                else if (mimeType.startsWith("audio/")) category = "audio";
                else if (mimeType.includes("pdf")) category = "documents";
                else if (
                  mimeType.includes("text") ||
                  mimeType.includes("document")
                )
                  category = "documents";
                else if (extension === "iso") category = "iso";
                else if (
                  extension === "zip" ||
                  extension === "rar" ||
                  extension === "7z"
                )
                  category = "archives";

                if (!fileTypeStats[category]) {
                  fileTypeStats[category] = { count: 0, size: 0 };
                }
                fileTypeStats[category].count++;
                fileTypeStats[category].size += fileSize;
              }
            }
          }
        }

        pageToken = (response as { data: { nextPageToken?: string } }).data
          .nextPageToken;
        console.info(
          `[GetStorageInfo] Processed page, total files so far: ${totalFiles}, folders: ${totalFolders}, size: ${(totalSize / 1024 ** 4).toFixed(2)} TB`
        );
      } while (pageToken);

      console.info("[GetStorageInfo] Final stats:", {
        totalFiles,
        totalFolders,
        totalSize,
        totalSizeTB: (totalSize / 1024 ** 4).toFixed(2),
        fileTypeStats,
      });

      // Set the actual org limit: 100TB
      const orgLimit = 100 * 1024 * 1024 * 1024 * 1024; // 100TB in bytes

      return {
        success: true,
        message: "Shared drive storage information retrieved",
        data: {
          storageUsed: totalSize,
          storageLimit: orgLimit,
          storageUsedInDrive: totalSize,
          storageUsedInTrash: 0, // Shared drives don't have individual trash tracking
          totalFiles,
          totalFolders,
          fileTypeStats,
          driveInfo: {
            name: driveData.name || "Unknown",
            id: driveData.id || "",
            capabilities: driveData.capabilities,
          },
        },
      };
    } else {
      // Personal drive storage (original logic)
      const { data } = await gdrive.about.get({
        fields: "storageQuota",
      });

      if (!data.storageQuota) {
        return {
          success: false,
          message: "Storage quota information not available",
          error: "NoQuotaInfo",
        };
      }

      const storageQuota = data.storageQuota;

      return {
        success: true,
        message: "Storage information retrieved",
        data: {
          storageUsed: Number(storageQuota.usage || 0),
          storageLimit: Number(storageQuota.limit || 0),
          storageUsedInDrive: Number(storageQuota.usageInDrive || 0),
          storageUsedInTrash: Number(storageQuota.usageInDriveTrash || 0),
          totalFiles: 0, // Personal drive stats not implemented
          totalFolders: 0,
          fileTypeStats: {},
        },
      };
    }
  } catch (error) {
    const e = error as Error;
    console.error(`[GetStorageInfo] ${e.message}`);
    return {
      success: false,
      message: "Failed to get storage information",
      error: e.message,
    };
  }
}
