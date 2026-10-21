import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes to human readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format remaining time until expiration
 */
export function formatCountdown(expiresAt?: string | Date | null): {
  text: string;
  isUrgent: boolean;
  isWarning: boolean;
  isExpired: boolean;
} {
  if (!expiresAt) {
    return {
      text: "Tidak pernah dihapus",
      isUrgent: false,
      isWarning: false,
      isExpired: false,
    };
  }

  const expDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      text: "Kedaluwarsa",
      isUrgent: true,
      isWarning: true,
      isExpired: true,
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let text = "";
  if (hours > 0) {
    text = `Dihapus dalam ${hours} j ${minutes} m`;
  } else {
    text = `Dihapus dalam ${minutes} m`;
  }

  return {
    text,
    isUrgent: hours < 1,      // < 1 hour (red)
    isWarning: hours < 6,     // < 6 hours (yellow)
    isExpired: false,
  };
}

/**
 * Clean & sanitize filename for display and storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .trim();
}

/**
 * Generate a random 12-char recovery code: WERT-XXXX-XXXX
 */
export function generateRecoveryCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 without ambiguous 0/O, 1/I
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `WERT-${part1}-${part2}`;
}

/**
 * Map extension to broad kind
 */
export function getFileKind(ext: string): "document" | "image" | "archive" {
  const cleanExt = ext.toLowerCase().replace(".", "");
  if (["jpg", "jpeg", "png", "heic", "webp"].includes(cleanExt)) {
    return "image";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(cleanExt)) {
    return "archive";
  }
  return "document";
}
