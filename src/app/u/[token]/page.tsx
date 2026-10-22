"use client";

import { use, useState, useEffect } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Printer, CheckCircle, AlertCircle, RefreshCw, Smartphone, Monitor } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function MobileUploadPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    valid: boolean;
    username: string;
    filesUploaded: number;
    maxFiles: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const checkToken = async () => {
    try {
      const res = await fetch(`/api/u/${token}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || "QR Code telah kedaluwarsa. Silakan scan ulang dari layar komputer.");
      } else {
        setSessionData(data);
        setUploadedCount(data.filesUploaded);
      }
    } catch {
      setError("Gagal memeriksa sesi QR.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-[#10241B] selection:bg-[#E3F8EC] selection:text-[#087443]">
      {/* Mobile Header */}
      <header className="p-4 border-b border-[#D5EADF] bg-white/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#087443] flex items-center justify-center text-white font-bold border-2 border-[#10241B] shadow-sticker-sm">
            <Printer className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-[#10241B]">
            wert<span className="text-[#087443]">.web.id</span>
          </span>
        </div>

        {sessionData && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] border border-[#D5EADF]">
            @{sessionData.username}
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-[#587063] gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#087443]" />
            <span className="text-sm font-medium">Menghubungkan ke sesi komputer...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-[28px] bg-white border border-[#D5EADF] shadow-soft text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEAEC] text-[#D92D3A] flex items-center justify-center mb-3 border border-[#D92D3A]/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#10241B]">Sesi QR Tidak Aktif</h2>
            <p className="text-xs text-[#587063] mt-2 mb-4 leading-relaxed">{error}</p>
            <p className="text-[11px] text-[#587063]">
              Buka kembali layar komputer fotokopian Anda dan scan kode QR terbaru.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center mx-auto mb-2 border border-[#D5EADF] shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#10241B]">
                Unggah File ke Komputer
              </h1>
              <p className="text-xs text-[#587063] mt-1">
                Tujuan: <b className="text-[#087443]">wert.web.id/{sessionData?.username}</b>
              </p>
            </div>

            {/* Dropzone with camera & document file picking */}
            <div className="bg-white p-4 rounded-[28px] border border-[#D5EADF] shadow-soft">
              <Dropzone
                token={token}
                onUploadSuccess={() => {
                  setUploadedCount((prev) => prev + 1);
                }}
              />
            </div>

            {/* Live Notification Indicator */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#E3F8EC] border border-[#D5EADF] text-[#10241B]">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#D5EADF] flex items-center justify-center shrink-0 text-[#087443] shadow-sm">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#087443]">Sinkronisasi Realtime</span>
                <span className="text-[11px] text-[#587063] mt-0.5">
                  File yang berhasil diunggah langsung muncul otomatis di layar komputer fotokopian.
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-[#587063] border-t border-[#D5EADF]">
        wert.web.id • Cetak tugas tanpa WhatsApp
      </footer>
    </div>
  );
}
