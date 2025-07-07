import { NextResponse } from "next/server";

import { GetStorageInfo } from "@/actions/files";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await GetStorageInfo();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to get storage info" },
        { status: 500 }
      );
    }

    // Format the data for easier consumption
    const {
      storageUsed,
      storageLimit,
      storageUsedInDrive,
      storageUsedInTrash,
      totalFiles,
      totalFolders,
      fileTypeStats,
      driveInfo,
    } = result.data;

    // Convert bytes to TB for display
    const formatBytes = (bytes: number) => ({
      bytes,
      tb: Number((bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)),
      gb: Number((bytes / (1024 * 1024 * 1024)).toFixed(2)),
    });

    return NextResponse.json({
      usage: formatBytes(storageUsed),
      limit: formatBytes(storageLimit),
      drive: formatBytes(storageUsedInDrive),
      trash: formatBytes(storageUsedInTrash),
      percentage:
        storageLimit > 0
          ? Number(((storageUsed / storageLimit) * 100).toFixed(1))
          : 0,
      totalFiles,
      totalFolders,
      fileTypeStats: Object.entries(fileTypeStats)
        .map(([type, stats]) => ({
          type,
          count: stats.count,
          size: formatBytes(stats.size),
          percentage:
            storageUsed > 0
              ? Number(((stats.size / storageUsed) * 100).toFixed(1))
              : 0,
        }))
        .sort((a, b) => b.size.bytes - a.size.bytes),
      driveInfo: driveInfo || null,
      isSharedDrive: !!driveInfo,
    });
  } catch (error) {
    console.error("[Storage API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
