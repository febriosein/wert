import { supabaseAdmin } from "@/lib/supabase/admin";

export interface PurgeOptions {
  userId?: string;
  limit?: number;
}

export interface PurgeResult {
  deletedFilesCount: number;
  cleanedSessionsCount?: number;
  cleanedTokensCount?: number;
  cleanedInactiveUsers?: number;
  timestamp: string;
}

/**
 * Purges expired files from both Supabase Storage buckets ('uploads' and 'derived')
 * and the database 'files' table.
 * If userId is passed, only purges expired files belonging to that user.
 */
export async function purgeExpiredFiles(options?: PurgeOptions): Promise<PurgeResult> {
  const now = new Date().toISOString();
  const limit = options?.limit || 100;

  let query = supabaseAdmin
    .from("files")
    .select("id, storage_key, pdf_key, docx_key, preview_key")
    .not("expires_at", "is", null)
    .lte("expires_at", now);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { data: expiredFiles, error: fetchError } = await query.limit(limit);

  if (fetchError) {
    console.error("[Purge] Failed to fetch expired files:", fetchError);
    return { deletedFilesCount: 0, timestamp: now };
  }

  let deletedFilesCount = 0;

  if (expiredFiles && expiredFiles.length > 0) {
    const uploadKeys: string[] = [];
    const derivedKeys: string[] = [];
    const fileIds: string[] = [];

    for (const f of expiredFiles) {
      fileIds.push(f.id);
      if (f.storage_key) uploadKeys.push(f.storage_key);
      if (f.pdf_key) derivedKeys.push(f.pdf_key);
      if (f.docx_key) derivedKeys.push(f.docx_key);
      if (f.preview_key) derivedKeys.push(f.preview_key);
    }

    // 1. Remove from Supabase Storage
    if (uploadKeys.length > 0) {
      await supabaseAdmin.storage
        .from("uploads")
        .remove(uploadKeys)
        .catch((err) => console.error("[Purge] Error removing uploads:", err));
    }

    if (derivedKeys.length > 0) {
      await supabaseAdmin.storage
        .from("derived")
        .remove(derivedKeys)
        .catch((err) => console.error("[Purge] Error removing derived:", err));
    }

    // 2. Delete rows from database
    const { error: deleteError } = await supabaseAdmin
      .from("files")
      .delete()
      .in("id", fileIds);

    if (deleteError) {
      console.error("[Purge] Error deleting DB records:", deleteError);
    } else {
      deletedFilesCount = fileIds.length;
    }
  }

  return {
    deletedFilesCount,
    timestamp: now,
  };
}

/**
 * Full maintenance cleanup (expired files, sessions, tokens, and inactive users).
 * Used by cron jobs.
 */
export async function runFullMaintenancePurge(): Promise<PurgeResult> {
  const result = await purgeExpiredFiles({ limit: 500 });
  const now = new Date().toISOString();

  // Clean expired sessions
  try {
    await supabaseAdmin.from("sessions").delete().lte("expires_at", now);
  } catch (err) {
    console.error("[Purge] Error cleaning sessions:", err);
  }

  // Clean expired upload tokens
  try {
    await supabaseAdmin.from("upload_tokens").delete().lte("expires_at", now);
  } catch (err) {
    console.error("[Purge] Error cleaning upload tokens:", err);
  }

  // Clean inactive users
  let cleanedInactiveUsers = 0;
  try {
    const { data: rpcCount } = await supabaseAdmin.rpc("cleanup_inactive_users");
    if (typeof rpcCount === "number") {
      cleanedInactiveUsers = rpcCount;
    }
  } catch {
    // Ignore if RPC is not loaded
  }

  result.cleanedInactiveUsers = cleanedInactiveUsers;
  return result;
}
