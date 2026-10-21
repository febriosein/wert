import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/files/[id]/preview: Dedicated Inline Preview Endpoint (Same-Origin)
 * Streams PDF, Images, or styled DOCX HTML with Content-Disposition: inline
 * Supports HTTP Range requests (RFC 7233) for seamless PDF streaming in Chrome/Edge.
 */
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

    // Check expiry
    if (file.expires_at && new Date(file.expires_at) <= new Date()) {
      return NextResponse.json({ error: "File telah kedaluwarsa." }, { status: 410 });
    }

    const cleanExt = file.ext.toLowerCase();
    const isOffice = ["docx", "doc", "pptx", "xlsx"].includes(cleanExt);

    // If it's an Office document and pdf_key is not set, convert to PDF first! (PRD & User Request)
    if (isOffice && !file.pdf_key) {
      try {
        const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
          .from("uploads")
          .download(file.storage_key);

        if (!downloadError && fileBlob) {
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

          if (!uploadError) {
            await supabaseAdmin
              .from("files")
              .update({
                pdf_key: pdfKey,
                status: "ready",
                updated_at: new Date().toISOString(),
              })
              .eq("id", id);

            file.pdf_key = pdfKey;
          }
        }
      } catch (convErr: any) {
        console.error("Auto conversion to PDF during preview failed:", convErr);
      }
    }

    // 1. PDF File or Converted Document with pdf_key (Guarantees 100% exact layout as in MS Word)
    if (cleanExt === "pdf" || file.pdf_key) {
      const targetBucket = file.pdf_key ? "derived" : "uploads";
      const targetKey = file.pdf_key || file.storage_key;

      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from(targetBucket)
        .download(targetKey);

      if (downloadError || !fileBlob) {
        return NextResponse.json({ error: "Gagal mengambil file PDF dari penyimpanan." }, { status: 500 });
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const totalSize = buffer.length;

      const pdfDisplayName = cleanExt === "pdf" ? file.display_name : `${file.display_name.replace(/\.[^/.]+$/, "")}.pdf`;

      // Handle HTTP Range requests (crucial for Chrome/Edge PDF plugin)
      const rangeHeader = req.headers.get("range");
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
          const chunk = buffer.subarray(start, end + 1);

          const headers = new Headers();
          headers.set("Content-Type", "application/pdf");
          headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
          headers.set("Accept-Ranges", "bytes");
          headers.set("Content-Length", String(chunk.length));
          headers.set("Content-Disposition", `inline; filename="${pdfDisplayName}"`);
          headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");

          return new NextResponse(chunk, { status: 206, headers });
        }
      }

      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Length", String(totalSize));
      headers.set("Content-Disposition", `inline; filename="${pdfDisplayName}"`);
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");

      return new NextResponse(buffer, { status: 200, headers });
    }

    // 2. Direct Image Preview (JPG, PNG, WebP)
    if (["jpg", "jpeg", "png", "webp"].includes(cleanExt)) {
      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storage_key);

      if (downloadError || !fileBlob) {
        return NextResponse.json({ error: "Gagal mengambil file gambar." }, { status: 500 });
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const headers = new Headers();
      headers.set("Content-Type", file.mime || "image/jpeg");
      headers.set("Content-Length", String(buffer.length));
      headers.set("Content-Disposition", `inline; filename="${file.display_name}"`);
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");

      return new NextResponse(buffer, { status: 200, headers });
    }

    // 3. Word DOCX Fallback Preview (when Gotenberg is offline)
    if (["docx", "doc"].includes(cleanExt)) {
      const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storage_key);

      if (downloadError || !fileBlob) {
        return NextResponse.json({ error: "Gagal mengambil dokumen Word." }, { status: 500 });
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mammoth = (await import("mammoth")).default;
      const { value: htmlContent } = await mammoth.convertToHtml({ buffer });

      const styledHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${file.display_name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .document-page {
      background: #fff;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      box-sizing: border-box;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    img { max-width: 100%; height: auto; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td, th { border: 1px solid #cbd5e1; padding: 6px 10px; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.2em; margin-bottom: 0.5em; }
    @media print {
      body { background: transparent; padding: 0; }
      .document-page { box-shadow: none; border-radius: 0; width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="document-page">
    ${htmlContent}
  </div>
</body>
</html>`;

      const headers = new Headers();
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Content-Disposition", `inline; filename="${file.display_name}.html"`);
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");

      return new NextResponse(styledHtml, { status: 200, headers });
    }

    return NextResponse.json({ error: "Format file tidak mendukung pratinjau inline." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memuat pratinjau" }, { status: 500 });
  }
}
