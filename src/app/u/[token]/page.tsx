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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Header */}
      <header className="p-4 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Printer className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            wert<span className="text-emerald-600">.web.id</span>
          </span>
        </div>

        {sessionData && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            @{sessionData.username}
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Menghubungkan ke sesi komputer...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sesi QR Tidak Aktif</h2>
            <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400">
              Buka kembali layar komputer fotokopian Anda dan scan kode QR terbaru.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Unggah File ke Komputer
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tujuan: <b>wert.web.id/{sessionData?.username}</b>
              </p>
            </div>

            {/* Dropzone with camera & document file picking */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-lg">
              <Dropzone
                token={token}
                onUploadSuccess={() => {
                  setUploadedCount((prev) => prev + 1);
                }}
              />
            </div>

            {/* Live Notification Indicator */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Sinkronisasi Realtime</span>
                <span className="text-[11px] text-emerald-700">
                  File yang berhasil diunggah langsung muncul otomatis di layar komputer fotokopian.
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/50">
        wert.web.id • Upload Cepat & Aman
      </footer>
    </div>
  );
}
