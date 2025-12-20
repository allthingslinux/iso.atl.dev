export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number; // Bytes
  parents?: string[];
  md5Checksum?: string;
};

export type DriveService = {
  listFiles(folderId: string): Promise<DriveFile[]>;
  getFileStream(fileId: string): Promise<ReadableStream | null>;
};

export class MockDriveService implements DriveService {
  async listFiles(folderId: string): Promise<DriveFile[]> {
    console.log(`[MockDrive] Listing files in folder: ${folderId}`);
    // Simulate latency
    await new Promise((r) => setTimeout(r, 500));

    // Return fake ISO data
    return [
      {
        id: "file_123",
        name: "ubuntu-22.04-amd64-desktop-20231001-en.iso",
        mimeType: "application/x-iso9660-image",
        size: 4_700_000_000,
        md5Checksum: "mock_md5_hash_123",
      },
      {
        id: "file_456",
        name: "archlinux-2024.01.01-x86_64.iso",
        mimeType: "application/x-iso9660-image",
        size: 900_000_000,
        md5Checksum: "mock_md5_hash_456",
      },
      {
        id: "file_bad",
        name: "random-movie.mp4",
        mimeType: "video/mp4",
        size: 12_000_000,
      },
    ];
  }

  // biome-ignore lint/suspicious/useAwait: Mock implementation
  async getFileStream(fileId: string): Promise<ReadableStream | null> {
    console.log(`[MockDrive] Streaming file: ${fileId}`);
    return null; // TODO: Return dummy stream if needed
  }
}
