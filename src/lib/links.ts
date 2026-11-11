/**
 * Link utilities for Wert: URL validation, platform detection, and branding styles.
 */

export type LinkPlatform =
  | "gdrive"
  | "gdocs"
  | "gsheets"
  | "gslides"
  | "canva"
  | "figma"
  | "notion"
  | "dropbox"
  | "onedrive"
  | "web";

export interface LinkPlatformInfo {
  platform: LinkPlatform;
  label: string;
  domain: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
}

/**
 * Validates whether a string is a valid web URL with http or https protocol.
 */
export function isValidWebUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim();
  if (trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes URL string, adding https:// if protocol was omitted.
 */
export function normalizeUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }
  return trimmed;
}

/**
 * Detects the platform/service of a given URL for smart branding & icons.
 */
export function getLinkPlatformInfo(urlStr: string): LinkPlatformInfo {
  let hostname = "web";
  let pathname = "";

  try {
    const parsed = new URL(normalizeUrl(urlStr));
    hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    pathname = parsed.pathname.toLowerCase();
  } catch {
    // fallback
  }

  // 1. Google Docs / Sheets / Slides / Drive
  if (hostname.includes("docs.google.com")) {
    if (pathname.includes("/presentation")) {
      return {
        platform: "gslides",
        label: "Google Slides",
        domain: hostname,
        badgeBg: "bg-[#FEF7E0]",
        badgeText: "text-[#B06000]",
        borderColor: "border-[#F4B400]",
        accentColor: "#F4B400",
      };
    }
    if (pathname.includes("/spreadsheets")) {
      return {
        platform: "gsheets",
        label: "Google Sheets",
        domain: hostname,
        badgeBg: "bg-[#E6F4EA]",
        badgeText: "text-[#137333]",
        borderColor: "border-[#0F9D58]",
        accentColor: "#0F9D58",
      };
    }
    return {
      platform: "gdocs",
      label: "Google Docs",
      domain: hostname,
      badgeBg: "bg-[#E8F0FE]",
      badgeText: "text-[#1A73E8]",
      borderColor: "border-[#4285F4]",
      accentColor: "#4285F4",
    };
  }

  if (hostname.includes("drive.google.com")) {
    return {
      platform: "gdrive",
      label: "Google Drive",
      domain: hostname,
      badgeBg: "bg-[#E8F0FE]",
      badgeText: "text-[#1967D2]",
      borderColor: "border-[#4285F4]",
      accentColor: "#4285F4",
    };
  }

  // 2. Canva
  if (hostname.includes("canva.com")) {
    return {
      platform: "canva",
      label: "Canva",
      domain: hostname,
      badgeBg: "bg-[#F3E8FF]",
      badgeText: "text-[#6B21A8]",
      borderColor: "border-[#A855F7]",
      accentColor: "#7D2AE8",
    };
  }

  // 3. Figma
  if (hostname.includes("figma.com")) {
    return {
      platform: "figma",
      label: "Figma",
      domain: hostname,
      badgeBg: "bg-[#FEE2E2]",
      badgeText: "text-[#991B1B]",
      borderColor: "border-[#F87171]",
      accentColor: "#F24E1E",
    };
  }

  // 4. Notion
  if (hostname.includes("notion.so") || hostname.includes("notion.site")) {
    return {
      platform: "notion",
      label: "Notion",
      domain: hostname,
      badgeBg: "bg-[#F4FBF7]",
      badgeText: "text-[#10241B]",
      borderColor: "border-[#10241B]",
      accentColor: "#10241B",
    };
  }

  // 5. Dropbox
  if (hostname.includes("dropbox.com")) {
    return {
      platform: "dropbox",
      label: "Dropbox",
      domain: hostname,
      badgeBg: "bg-[#EFF6FF]",
      badgeText: "text-[#1E40AF]",
      borderColor: "border-[#60A5FA]",
      accentColor: "#0061FE",
    };
  }

  // 6. OneDrive / SharePoint
  if (hostname.includes("onedrive.live.com") || hostname.includes("1drv.ms") || hostname.includes("sharepoint.com")) {
    return {
      platform: "onedrive",
      label: "OneDrive",
      domain: hostname,
      badgeBg: "bg-[#EFF6FF]",
      badgeText: "text-[#1E40AF]",
      borderColor: "border-[#60A5FA]",
      accentColor: "#0078D4",
    };
  }

  // Default Web link
  return {
    platform: "web",
    label: hostname || "Tautan Web",
    domain: hostname,
    badgeBg: "bg-[#E3F8EC]",
    badgeText: "text-[#087443]",
    borderColor: "border-[#19C37D]",
    accentColor: "#087443",
  };
}

/**
 * Extracts a friendly default title from a URL if none provided.
 */
export function getDefaultLinkTitle(urlStr: string): string {
  try {
    const parsed = new URL(normalizeUrl(urlStr));
    const info = getLinkPlatformInfo(urlStr);

    if (info.platform === "gdrive") return "Tautan Google Drive";
    if (info.platform === "gdocs") return "Dokumen Google Docs";
    if (info.platform === "gsheets") return "Lembar Kerja Google Sheets";
    if (info.platform === "gslides") return "Presentasi Google Slides";
    if (info.platform === "canva") return "Desain Canva";
    if (info.platform === "figma") return "Desain Figma";
    if (info.platform === "notion") return "Catatan Notion";

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      const last = pathSegments[pathSegments.length - 1];
      const cleaned = decodeURIComponent(last).replace(/[-_]/g, " ");
      if (cleaned.length > 2 && cleaned.length < 50) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Tautan Tugas";
  }
}
