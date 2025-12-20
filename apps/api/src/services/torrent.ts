// Note: In a Worker environment, we might need a pure JS implementation
// 'parse-torrent' is usually fine, but generating .torrent files might require 'create-torrent'
// For now, we stub the generation logic.

export function createTorrentMetadata(
  _file: { name: string; size: number },
  _announceList: string[] = []
): Promise<Buffer> {
  // Stub: In real implementation, we would use 'create-torrent' package
  // But dealing with Node Buffers in Cloudflare Workers can be tricky.
  // For MVP, we pretend to return a .torrent buffer.

  const mockContent = `d8:announce${_announceList[0] || "http://tracker.opentrackr.org:1337/announce"}...fake_torrent_data...e`;
  return Buffer.from(mockContent);
}

export function getMagnetLink(infoHash: string, name: string): string {
  return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}`;
}
