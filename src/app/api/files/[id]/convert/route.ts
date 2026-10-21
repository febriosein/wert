import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    let targetType: string | null = null;
    let mode: "precision" | "editable" = "precision";

    try {
      const body = await req.json();
      targetType = body.type || null;
      mode = body.mode || "precision";
    } catch {
      // Empty body
    }

    const { data: file, error: fileError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
    }

    const isOfficeDoc = ["docx", "pptx", "xlsx"].includes(file.ext.toLowerCase());
    const isPdf = file.ext.toLowerCase() === "pdf";

    // 1. PDF to DOCX Conversion (PRD Section 7.8)
    if (isPdf && (targetType === "pdf_to_docx" || !file.docx_key)) {
      await supabaseAdmin.from("conversion_jobs").upsert({
        file_id: id,
        type: mode === "editable" ? "pdf_to_docx_editable" : "pdf_to_docx_precision",
        status: "running",
        started_at: new Date().toISOString(),
      });

      const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storage_key);

      if (downloadError || !pdfBlob) {
        throw new Error("Gagal mengunduh file PDF dari penyimpanan.");
      }

      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
      const { documentConverter } = await import("@/lib/converter/provider");
      const docxBuffer = await documentConverter.convertPdfToDocx(pdfBuffer, file.display_name, mode);

      const docxKey = `${file.user_id}/${file.id}.docx`;
      const { error: uploadDocxError } = await supabaseAdmin.storage
        .from("derived")
        .upload(docxKey, docxBuffer, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });

      if (uploadDocxError) {
        throw new Error(`Gagal menyimpan file DOCX hasil konversi: ${uploadDocxError.message}`);
      }

      await supabaseAdmin
        .from("files")
        .update({
          docx_key: docxKey,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      await supabaseAdmin
        .from("conversion_jobs")
        .update({
          status: "done",
          finished_at: new Date().toISOString(),
        })
        .eq("file_id", id);

      return NextResponse.json({ success: true, docxKey });
    }

    // 2. Office to PDF Conversion (DOCX, PPTX, XLSX)
    if (isOfficeDoc) {
      await supabaseAdmin
        .from("conversion_jobs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("file_id", id);

      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storage_key);

      if (downloadError || !fileBlob) {
        throw new Error(`Gagal mengunduh file asli dari Storage: ${downloadError?.message}`);
      }

      const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
      const { documentConverter } = await import("@/lib/converter/provider");
      const pdfBuffer = await documentConverter.convertOfficeToPdf(fileBuffer, file.display_name);

      const pdfKey = `${file.user_id}/${file.id}.pdf`;
      const { error: uploadPdfError } = await supabaseAdmin.storage
        .from("derived")
        .upload(pdfKey, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadPdfError) {
        throw new Error(`Gagal menyimpan PDF hasil konversi: ${uploadPdfError.message}`);
      }

      await supabaseAdmin
        .from("files")
        .update({
          status: "ready",
          pdf_key: pdfKey,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      await supabaseAdmin
        .from("conversion_jobs")
        .update({
          status: "done",
          finished_at: new Date().toISOString(),
        })
        .eq("file_id", id);

      return NextResponse.json({ success: true, pdfKey });
    }

    return NextResponse.json({ message: "File tidak memerlukan konversi." }, { status: 200 });
  } catch (err: any) {
    console.error("Conversion error:", err);

    await supabaseAdmin
      .from("conversion_jobs")
      .update({
        status: "failed",
        error: err.message,
        finished_at: new Date().toISOString(),
      })
      .eq("file_id", (await params).id);

    // Fallback: keep file accessible
    await supabaseAdmin
      .from("files")
      .update({ status: "ready" })
      .eq("id", (await params).id);

    return NextResponse.json({ error: err.message || "Gagal mengonversi file" }, { status: 500 });
  }
}
