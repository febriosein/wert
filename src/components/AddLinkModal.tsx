"use client";

import { useState, useEffect } from "react";
import {
  X,
  Link2,
  ExternalLink,
  Clipboard,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  isValidWebUrl,
  normalizeUrl,
  getLinkPlatformInfo,
  getDefaultLinkTitle,
  LinkPlatformInfo,
} from "@/lib/links";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUrl?: string;
}

export function AddLinkModal({
  isOpen,
  onClose,
  onSuccess,
  initialUrl = "",
}: AddLinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformInfo, setPlatformInfo] = useState<LinkPlatformInfo | null>(null);
  const [pasted, setPasted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setTitle("");
      setError(null);
      if (initialUrl && isValidWebUrl(normalizeUrl(initialUrl))) {
        setPlatformInfo(getLinkPlatformInfo(initialUrl));
      } else {
        setPlatformInfo(null);
      }
    }
  }, [isOpen, initialUrl]);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError(null);
    if (!val.trim()) {
      setPlatformInfo(null);
      return;
    }
    const normalized = normalizeUrl(val);
    if (isValidWebUrl(normalized)) {
      const info = getLinkPlatformInfo(normalized);
      setPlatformInfo(info);
      if (!title) {
        // Suggested placeholder
      }
    } else {
      setPlatformInfo(null);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text.trim());
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch {
      // Clipboard permission denied
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Silakan masukkan URL tautan tugas.");
      return;
    }

    const normalized = normalizeUrl(url);
    if (!isValidWebUrl(normalized)) {
      setError("URL tidak valid. Pastikan format tautan benar (contoh: https://drive.google.com/...)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/files/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalized,
          title: title.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Gagal menyimpan tautan.");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10241B]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-[#D5EADF] flex flex-col text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] flex items-center justify-center text-[#087443] border border-[#D5EADF] shadow-sm shrink-0">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#10241B]">
              Tambah Tautan Tugas
            </h2>
            <p className="text-xs text-[#587063] mt-0.5">
              Bagikan link Google Drive, Canva, Docs, atau link web lainnya untuk dibuka di fotokopi.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Input URL with Paste Button */}
          <div>
            <label className="block text-xs font-bold text-[#10241B] mb-1.5">
              URL / Tautan Dokumen <span className="text-[#D92D3A]">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://drive.google.com/... atau https://canva.com/..."
                autoFocus
                className="w-full px-4 py-3 pr-24 rounded-2xl bg-[#F4FBF7] border-2 border-[#D5EADF] focus:border-[#087443] focus:bg-white text-sm text-[#10241B] placeholder-[#8AA095] outline-none transition"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-2.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#D5EADF] hover:bg-[#E3F8EC] text-xs font-semibold text-[#087443] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Tempel dari papan klip"
              >
                {pasted ? <Check className="w-3.5 h-3.5 text-[#087443]" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{pasted ? "Tertempel" : "Tempel"}</span>
              </button>
            </div>

            {/* Platform Detection Live Pill */}
            {platformInfo && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-[#587063] font-medium">Terdeteksi:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${platformInfo.badgeBg} ${platformInfo.badgeText} border ${platformInfo.borderColor}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{platformInfo.label}</span>
                </span>
                <span className="text-[11px] text-[#8AA095] font-mono">({platformInfo.domain})</span>
              </div>
            )}
          </div>

          {/* Input Title (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#10241B]">
                Judul / Keterangan Tautan <span className="text-xs font-normal text-[#587063]">(Opsional)</span>
              </label>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={url ? getDefaultLinkTitle(url) : "Misal: Desain Banner Acara Kampus"}
              maxLength={100}
              className="w-full px-4 py-3 rounded-2xl bg-[#F4FBF7] border-2 border-[#D5EADF] focus:border-[#087443] focus:bg-white text-sm text-[#10241B] placeholder-[#8AA095] outline-none transition"
            />
          </div>

          {/* Tips Box */}
          <div className="p-3.5 rounded-2xl bg-[#E3F8EC]/60 border border-[#D5EADF] flex items-start gap-2.5 text-xs text-[#10241B]/80 leading-relaxed">
            <span className="text-base select-none">💡</span>
            <p>
              <b>Tips Fotokopi:</b> Untuk link Google Drive atau Google Docs, pastikan akses berbagi diatur ke{" "}
              <b className="text-[#087443]">"Siapa saja yang memiliki link dapat melihat"</b> agar operator fotokopi dapat langsung membuka dan mencetak tanpa meminta izin akses.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-[#FFEAEC] text-[#D92D3A] text-xs flex items-center gap-2 border border-[#D92D3A]/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-[#D5EADF] text-xs font-bold text-[#587063] hover:text-[#10241B] hover:bg-[#F4FBF7] transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm btn-tactile"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Simpan Tautan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
