"use client";

import { useState, useEffect, useCallback } from "react";
import { X, RefreshCw, Smartphone, Copy, Check, Camera, Image, ArrowRight } from "lucide-react";

export interface CachedQrSession {
  qrDataUrl: string;
  targetUrl: string;
  expiresAt: Date;
}

// Module-level in-memory cache shared across modal openings and page mounts
export let cachedQrSession: CachedQrSession | null = null;

export function setCachedQrSession(session: CachedQrSession | null) {
  cachedQrSession = session;
}

export function getCachedQrSession(): CachedQrSession | null {
  if (cachedQrSession && cachedQrSession.expiresAt.getTime() > Date.now() + 30000) {
    return cachedQrSession;
  }
  return null;
}

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function QrModal({ isOpen, onClose, username }: QrModalProps) {
  const activeCache = getCachedQrSession();
  const [loading, setLoading] = useState(!activeCache);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(activeCache?.qrDataUrl || null);
  const [targetUrl, setTargetUrl] = useState<string | null>(activeCache?.targetUrl || null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(activeCache?.expiresAt || null);
  const [remainingMinutes, setRemainingMinutes] = useState(10);
  const [copied, setCopied] = useState(false);

  const fetchQrToken = useCallback(async (forceRefresh = false) => {
    const validCache = getCachedQrSession();
    if (!forceRefresh && validCache) {
      setQrDataUrl(validCache.qrDataUrl);
      setTargetUrl(validCache.targetUrl);
      setExpiresAt(validCache.expiresAt);
      setLoading(false);
      return;
    }

    if (!validCache) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/upload-sessions", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        const expDate = new Date(data.expiresAt);
        const newSession: CachedQrSession = {
          qrDataUrl: data.qrDataUrl,
          targetUrl: data.url,
          expiresAt: expDate,
        };
        setCachedQrSession(newSession);
        setQrDataUrl(data.qrDataUrl);
        setTargetUrl(data.url);
        setExpiresAt(expDate);
        setRemainingMinutes(10);
      }
    } catch (err) {
      console.error("Gagal mengambil token QR:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const valid = getCachedQrSession();
      if (valid) {
        setQrDataUrl(valid.qrDataUrl);
        setTargetUrl(valid.targetUrl);
        setExpiresAt(valid.expiresAt);
        setLoading(false);
      } else {
        fetchQrToken(false);
      }
    }
  }, [isOpen, fetchQrToken]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const calculateDiff = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setRemainingMinutes(0);
      } else {
        setRemainingMinutes(Math.ceil(diff / (1000 * 60)));
      }
    };
    calculateDiff();
    const interval = setInterval(calculateDiff, 10000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10241B]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-[#D5EADF] flex flex-col text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title & Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center border border-[#D5EADF] shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#10241B]">
              Upload dari Smartphone
            </h3>
            <p className="text-xs text-[#587063] mt-0.5">
              Unggah langsung ke <b className="text-[#087443]">@{username}</b> tanpa login
            </p>
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Left: Sticker QR Box */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative w-48 h-48 border-2 border-[#10241B] rounded-[20px] p-2 bg-white flex items-center justify-center shadow-sticker overflow-hidden">
              {loading && !qrDataUrl ? (
                <div className="w-full h-full rounded-xl bg-[#F4FBF7] animate-pulse flex flex-col items-center justify-center gap-2 text-[#587063]">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#087443]" />
                  <span className="text-xs font-medium">Menyiapkan QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scan QR untuk upload dari smartphone"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <span className="text-xs text-[#D92D3A] font-medium">Gagal memuat QR.</span>
              )}
            </div>

            <div className="flex items-center justify-between w-full mt-3 px-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#19C37D] animate-ping" />
                <span className={`font-semibold ${remainingMinutes <= 2 ? "text-[#D92D3A]" : "text-[#087443]"}`}>
                  {remainingMinutes > 0 ? `Berlaku ${remainingMinutes} mnt` : "Kedaluwarsa"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => fetchQrToken(true)}
                disabled={loading}
                className="inline-flex items-center gap-1 font-bold text-[#087443] hover:underline transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                <span>Perbarui</span>
              </button>
            </div>
          </div>

          {/* Right: 3 Steps Guide & Link */}
          <div className="sm:col-span-7 flex flex-col gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F4FBF7] border border-[#D5EADF]">
                <div className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] font-display font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#10241B]">Buka kamera HP</span>
                  <p className="text-[#587063] mt-0.5">Buka aplikasi kamera standar atau pemindai QR bawaan HP.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F4FBF7] border border-[#D5EADF]">
                <div className="w-7 h-7 rounded-lg bg-[#E4EEFF] text-[#1D4ED8] font-display font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#10241B]">Arahkan ke kode QR</span>
                  <p className="text-[#587063] mt-0.5">Ketuk tautan notifikasi yang muncul di layar ponsel.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F4FBF7] border border-[#D5EADF]">
                <div className="w-7 h-7 rounded-lg bg-[#FFF4B8] text-[#10241B] font-display font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#10241B]">Pilih file atau foto</span>
                  <p className="text-[#587063] mt-0.5">File otomatis masuk ke layar komputer dalam sekejap.</p>
                </div>
              </div>
            </div>

            {/* Fallback Copy Link */}
            {targetUrl && (
              <div className="pt-2 border-t border-[#D5EADF] flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={targetUrl}
                  className="flex-1 bg-[#F4FBF7] border border-[#D5EADF] rounded-xl px-3 py-2 text-xs text-[#587063] truncate select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin!" : "Salin Link"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
