/**
 * Safe ZIP Central Directory Reader
 * Inspects ZIP archive contents (file names & uncompressed sizes)
 * strictly without extracting any files to disk or memory (PRD Section 7.5 & 12).
 */

export interface ZipEntry {
  name: string;
  sizeBytes: number;
  compressedSizeBytes: number;
  isDirectory: boolean;
}

export function readZipCentralDirectory(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  const minEOCDSize = 22;
  if (buffer.length < minEOCDSize) return entries;

  // Find End of Central Directory Record (EOCD signature: 0x06054b50 -> PK\x05\x06)
  let eocdOffset = -1;
  const maxSearchRange = Math.min(buffer.length, 65535 + minEOCDSize);
  for (let i = buffer.length - minEOCDSize; i >= buffer.length - maxSearchRange; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return entries;

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let currentOffset = cdOffset;
  const maxEntriesLimit = 500; // DoS protection: limit to 500 entries (PRD 12)

  for (let i = 0; i < totalEntries && i < maxEntriesLimit; i++) {
    if (currentOffset + 46 > buffer.length) break;

    // Central Directory file header signature: 0x02014b50 -> PK\x01\x02
    if (buffer.readUInt32LE(currentOffset) !== 0x02014b50) break;

    const compressedSize = buffer.readUInt32LE(currentOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(currentOffset + 24);
    const fileNameLength = buffer.readUInt16LE(currentOffset + 28);
    const extraFieldLength = buffer.readUInt16LE(currentOffset + 30);
    const fileCommentLength = buffer.readUInt16LE(currentOffset + 32);

    const nameOffset = currentOffset + 46;
    if (nameOffset + fileNameLength > buffer.length) break;

    const fileName = buffer.toString("utf8", nameOffset, nameOffset + fileNameLength);
    const isDirectory = fileName.endsWith("/");

    entries.push({
      name: fileName,
      sizeBytes: uncompressedSize,
      compressedSizeBytes: compressedSize,
      isDirectory,
    });

    currentOffset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}
