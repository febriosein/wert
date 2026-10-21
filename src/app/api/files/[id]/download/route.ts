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
    const { searchParams } = new URL(req.url);
    const variant = searchParams.get("variant") || "original"; // 'original' | 'pdf' | 'docx'

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

    let targetBucket = "uploads";
    let targetKey = file.storage_key;
    let downloadFilename = file.display_name;

    if (variant === "pdf") {
      if (file.ext === "pdf") {
        targetBucket = "uploads";
        targetKey = file.storage_key;
        downloadFilename = file.display_name;
      } else {
        // Just-in-time conversion if not yet converted
        if (!file.pdf_key) {
          try {
            const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
              .from("uploads")
              .download(file.storage_key);

            if (downloadError || !fileBlob) {
              return NextResponse.json({ error: "Gagal mengunduh file asli dari penyimpanan." }, { status: 500 });
            }

            const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
            const { documentConverter } = await import("@/lib/converter/provider");
            const pdfBuffer = await documentConverter.convertOfficeToPdf(fileBuffer, file.display_name);

            const pdfKey = `${file.user_id}/${file.id}.pdf`;
            const { error: uploadError } = await supabaseAdmin.storage
              .from("derived")
              .upload(pdfKey, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true,
              });

            if (uploadError) {
              return NextResponse.json({ error: "Gagal menyimpan PDF hasil konversi." }, { status: 500 });
            }

            await supabaseAdmin
              .from("files")
              .update({
                pdf_key: pdfKey,
                status: "ready",
                updated_at: new Date().toISOString(),
              })
              .eq("id", id);

            file.pdf_key = pdfKey;
          } catch (convErr: any) {
            console.error("On-demand download conversion error:", convErr);
            return NextResponse.json({
              error: `Gagal memproses konversi ke PDF: ${convErr.message || convErr}`,
            }, { status: 500 });
          }
        }

        targetBucket = "derived";
        targetKey = file.pdf_key;
        const nameWithoutExt = file.display_name.replace(/\.[^/.]+$/, "");
        downloadFilename = `${nameWithoutExt}.pdf`;
      }
    } else if (variant === "docx") {
      if (!file.docx_key) {
        if (file.ext === "pdf") {
          try {
            const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
              .from("uploads")
              .download(file.storage_key);

            if (downloadError || !fileBlob) {
              return NextResponse.json({ error: "Gagal mengunduh file PDF asli." }, { status: 500 });
            }

            const pdfBuffer = Buffer.from(await fileBlob.arrayBuffer());
            const { documentConverter } = await import("@/lib/converter/provider");
            const docxBuffer = await documentConverter.convertPdfToDocx(pdfBuffer, file.display_name, "precision");

            const docxKey = `${file.user_id}/${file.id}.docx`;
            await supabaseAdmin.storage.from("derived").upload(docxKey, docxBuffer, {
              contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              upsert: true,
            });

            await supabaseAdmin
              .from("files")
              .update({ docx_key: docxKey, updated_at: new Date().toISOString() })
              .eq("id", id);

            file.docx_key = docxKey;
          } catch (convErr: any) {
            return NextResponse.json({
              error: `Gagal memproses konversi ke Word: ${convErr.message || convErr}`,
            }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: "Versi Word belum selesai diproses." }, { status: 400 });
        }
      }
      targetBucket = "derived";
      targetKey = file.docx_key;
      const nameWithoutExt = file.display_name.replace(/\.[^/.]+$/, "");
      downloadFilename = `${nameWithoutExt}.docx`;
    }

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
