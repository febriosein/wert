import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/cron/reconcile: Orphan Storage Reconciliation (PRD 7.9)
 * Compares files in Supabase Storage with DB records and purges orphaned objects.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = req.nextUrl.searchParams.get("secret");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 1. Fetch all active storage keys from DB
    const { data: dbFiles, error: dbError } = await supabaseAdmin
      .from("files")
      .select("storage_key, pdf_key, docx_key, preview_key");

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const activeDbKeys = new Set<string>();
    for (const file of dbFiles || []) {
      if (file.storage_key) activeDbKeys.add(file.storage_key);
      if (file.pdf_key) activeDbKeys.add(file.pdf_key);
      if (file.docx_key) activeDbKeys.add(file.docx_key);
      if (file.preview_key) activeDbKeys.add(file.preview_key);
    }

    let purgedCount = 0;
    const buckets = ["uploads", "derived"];

    for (const bucketName of buckets) {
      // List folders (users) in bucket
      const { data: rootItems } = await supabaseAdmin.storage
        .from(bucketName)
        .list("", { limit: 100 });

      for (const item of rootItems || []) {
        if (!item.id) {
          // It's a folder (userId)
          const folderName = item.name;
          const { data: filesInFolder } = await supabaseAdmin.storage
            .from(bucketName)
            .list(folderName, { limit: 200 });

          const orphanKeysInFolder: string[] = [];

          for (const fileObj of filesInFolder || []) {
            const fullKey = `${folderName}/${fileObj.name}`;
            if (!activeDbKeys.has(fullKey)) {
              // Orphaned file found!
              orphanKeysInFolder.push(fullKey);
            }
          }

          if (orphanKeysInFolder.length > 0) {
            await supabaseAdmin.storage
              .from(bucketName)
              .remove(orphanKeysInFolder)
              .catch(() => {});
            purgedCount += orphanKeysInFolder.length;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      purgedOrphanedCount: purgedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal rekonsiliasi storage" }, { status: 500 });
  }
}
