"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Smartphone, Copy, Check, ExternalLink } from "lucide-react";
import Image from "next/image";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function QrModal({ isOpen, onClose, username }: QrModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState(10);
  const [copied, setCopied] = useState(false);

  const fetchQrToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/upload-sessions", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setQrDataUrl(data.qrDataUrl);
        setTargetUrl(data.url);
        setExpiresAt(new Date(data.expiresAt));
        setRemainingMinutes(10);
      }
    } catch (err) {
      console.error("Gagal mengambil token QR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQrToken();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setRemainingMinutes(0);
        clearInterval(interval);
      } else {
        setRemainingMinutes(Math.ceil(diff / (1000 * 60)));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopyLink = () => {
    if (targetUrl) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Upload dari Smartphone</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Scan dengan kamera HP untuk mengunggah file langsung ke akun @{username} tanpa login.
        </p>

        {/* QR Code Container */}
        <div className="relative w-64 h-64 border-2 border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center shadow-inner">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-xs">Membuat QR Code...</span>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR untuk upload dari smartphone"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <span className="text-xs text-rose-500">Gagal memuat QR.</span>
          )}
        </div>

        {/* Expiry info & actions */}
        <div className="w-full flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>
            {remainingMinutes > 0 ? (
              <>Berlaku selama <b>{remainingMinutes} menit</b></>
            ) : (
              <span className="text-rose-500 font-semibold">QR Kedaluwarsa</span>
            )}
          </span>

          <button
            type="button"
            onClick={fetchQrToken}
            disabled={loading}
            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Perbarui QR</span>
          </button>
        </div>

        {/* Copy Link fallback */}
        {targetUrl && (
          <div className="w-full mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Tersalin!" : "Salin Link HP"}</span>
            </button>

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              title="Buka tab baru untuk tes"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
