import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const { id } = await params;

    const { data: file, error } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (error || !file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
    }

    // Check if expired
    if (file.expires_at && new Date(file.expires_at) <= new Date()) {
      return NextResponse.json({ error: "File telah kedaluwarsa dan tidak dapat diakses." }, { status: 410 });
    }

    const targetBucket = "uploads";
    const targetKey = file.storage_key;
    const downloadFilename = file.display_name;

    // Generate signed download URL (60 seconds expiry)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(targetBucket)
      .createSignedUrl(targetKey, 60, {
        download: downloadFilename,
      });

    if (signError || !signedData?.signedUrl) {
      // Fallback: download binary directly and stream with Content-Disposition
      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from(targetBucket)
        .download(targetKey);

      if (downloadError || !fileBlob) {
        return NextResponse.json({ error: "Gagal mengambil file dari penyimpanan." }, { status: 500 });
      }

      const headers = new Headers();
      headers.set("Content-Disposition", `attachment; filename="${downloadFilename}"`);
      headers.set("Content-Type", fileBlob.type || "application/octet-stream");
      headers.set("Cache-Control", "private, no-store");

      return new NextResponse(fileBlob, { status: 200, headers });
    }

    return NextResponse.redirect(signedData.signedUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengunduh file" }, { status: 500 });
  }
}
