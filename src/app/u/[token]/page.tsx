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
    <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-mint selection:text-brand-deep">
      {/* Mobile Header */}
      <header className="p-4 border-b border-line bg-surface/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-deep flex items-center justify-center text-white font-bold border-2 border-ink shadow-sticker-sm">
            <Printer className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-ink">
            wert<span className="text-brand-deep">.web.id</span>
          </span>
        </div>

        {sessionData && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-mint text-brand-deep border border-line">
            @{sessionData.username}
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-deep" />
            <span className="text-sm font-medium">Menghubungkan ke sesi komputer...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-[28px] bg-surface border border-line shadow-soft text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mb-3 border border-danger/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-ink">Sesi QR Tidak Aktif</h2>
            <p className="text-xs text-muted mt-2 mb-4 leading-relaxed">{error}</p>
            <p className="text-[11px] text-muted">
              Buka kembali layar komputer fotokopian Anda dan scan kode QR terbaru.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-mint text-brand-deep flex items-center justify-center mx-auto mb-2 border border-line shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                Unggah File ke Komputer
              </h1>
              <p className="text-xs text-muted mt-1">
                Tujuan: <b className="text-brand-deep">wert.web.id/{sessionData?.username}</b>
              </p>
            </div>

            {/* Dropzone with camera & document file picking */}
            <div className="bg-surface p-4 rounded-[28px] border border-line shadow-soft">
              <Dropzone
                token={token}
                onUploadSuccess={() => {
                  setUploadedCount((prev) => prev + 1);
                }}
              />
            </div>

            {/* Live Notification Indicator */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-mint border border-line text-ink">
              <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center shrink-0 text-brand-deep shadow-sm">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-brand-deep">Sinkronisasi Realtime</span>
                <span className="text-[11px] text-muted mt-0.5">
                  File yang berhasil diunggah langsung muncul otomatis di layar komputer fotokopian.
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted border-t border-line">
        wert.web.id • Cetak tugas tanpa WhatsApp
      </footer>
    </div>
  );
}
