import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { readZipCentralDirectory } from "@/lib/storage/zip-reader";

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

    const { data: file, error: fetchError } = await supabaseAdmin
      .from("files")
      .select("id, storage_key, ext, display_name")
      .eq("id", id)
      .eq("user_id", session.userId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
    }

    if (file.ext.toLowerCase() !== "zip") {
      return NextResponse.json({ error: "Bukan file arsip ZIP." }, { status: 400 });
    }

    // Download zip file from storage
    const { data: zipBlob, error: downloadError } = await supabaseAdmin.storage
      .from("uploads")
      .download(file.storage_key);

    if (downloadError || !zipBlob) {
      return NextResponse.json({ error: "Gagal mengunduh arsip dari penyimpanan." }, { status: 500 });
    }

    const arrayBuffer = await zipBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read central directory safely without extracting
    const entries = readZipCentralDirectory(buffer);

    return NextResponse.json({
      success: true,
      fileName: file.display_name,
      entries,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membaca isi arsip" }, { status: 500 });
  }
}
