/**
 * Magic Bytes & File Integrity Validator
 * Prevents disguised files (e.g. executable renamed to .pdf or .docx)
 */

export function validateMagicBytes(bytes: Uint8Array, ext: string): { valid: boolean; reason?: string } {
  const cleanExt = ext.toLowerCase().replace(".", "");

  if (bytes.length < 8) {
    return { valid: false, reason: "Ukuran file terlalu kecil atau file korup." };
  }

  // PDF: %PDF-
  if (cleanExt === "pdf") {
    const isPdf =
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d;   // -
    if (!isPdf) {
      return { valid: false, reason: "Isi file bukan dokumen PDF yang valid." };
    }
    return { valid: true };
  }

  // ZIP, DOCX, XLSX, PPTX: PK\x03\x04
  if (["docx", "xlsx", "pptx", "zip"].includes(cleanExt)) {
    const isZip =
      bytes[0] === 0x50 && // P
      bytes[1] === 0x4b && // K
      (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
      (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
    if (!isZip) {
      return { valid: false, reason: `Isi file bukan dokumen ${cleanExt.toUpperCase()} yang valid.` };
    }
    return { valid: true };
  }

  // JPEG / JPG: \xFF\xD8\xFF
  if (["jpg", "jpeg"].includes(cleanExt)) {
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!isJpg) {
      return { valid: false, reason: "Isi file bukan gambar JPEG yang valid." };
    }
    return { valid: true };
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (cleanExt === "png") {
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 && // P
      bytes[2] === 0x4e && // N
      bytes[3] === 0x47 && // G
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
    if (!isPng) {
      return { valid: false, reason: "Isi file bukan gambar PNG yang valid." };
    }
    return { valid: true };
  }

  // HEIC: offset 4 ftyp (66 74 79 70)
  if (cleanExt === "heic") {
    if (bytes.length >= 12) {
      const isFtyp =
        bytes[4] === 0x66 && // f
        bytes[5] === 0x74 && // t
        bytes[6] === 0x79 && // y
        bytes[7] === 0x70;   // p
      if (!isFtyp) {
        return { valid: false, reason: "Isi file bukan gambar HEIC yang valid." };
      }
    }
    return { valid: true };
  }

  return { valid: true };
}
