"use client";

import { use, useState, useEffect } from "react";
import { Dropzone } from "@/components/Dropzone";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  Link2,
  FileUp,
  Clipboard,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  isValidWebUrl,
  normalizeUrl,
  getLinkPlatformInfo,
  getDefaultLinkTitle,
  LinkPlatformInfo,
} from "@/lib/links";

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

  // Mobile Tabs: 'files' | 'link'
  const [activeTab, setActiveTab] = useState<"files" | "link">("files");

  // Mobile Link Form state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<LinkPlatformInfo | null>(null);
  const [pasted, setPasted] = useState(false);

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

  const handleLinkChange = (val: string) => {
    setLinkUrl(val);
    setLinkError(null);
    setLinkSuccess(false);

    if (!val.trim()) {
      setPlatformInfo(null);
      return;
    }

    const normalized = normalizeUrl(val);
    if (isValidWebUrl(normalized)) {
      setPlatformInfo(getLinkPlatformInfo(normalized));
    } else {
      setPlatformInfo(null);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleLinkChange(text.trim());
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch {
      // Clipboard denied
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSuccess(false);

    if (!linkUrl.trim()) {
      setLinkError("Silakan masukkan URL tautan.");
      return;
    }

    const normalized = normalizeUrl(linkUrl);
    if (!isValidWebUrl(normalized)) {
      setLinkError("URL tidak valid. Pastikan diawali dengan http:// atau https://");
      return;
    }

    setLinkLoading(true);
    try {
      const res = await fetch(`/api/u/${token}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalized,
          title: linkTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLinkError(data.error || "Gagal mengirim tautan.");
        return;
      }

      setLinkSuccess(true);
      setLinkUrl("");
      setLinkTitle("");
      setPlatformInfo(null);
      setUploadedCount((prev) => prev + 1);
    } catch (err: any) {
      setLinkError(err.message || "Gagal mengirim tautan ke komputer.");
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-[#10241B] overflow-x-hidden selection:bg-[#E3F8EC] selection:text-[#087443]">
      {/* Mobile Header */}
      <header className="p-4 border-b border-[#D5EADF] bg-white/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold border-2 border-[#10241B] shadow-sticker-sm overflow-hidden p-0.5">
            <img
              src="/logo-transparent.png"
              alt="Logo wert.web.id"
              className="w-full h-full object-contain"
            />
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
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
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
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center mx-auto mb-2 border border-[#D5EADF] shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#10241B]">
                Kirim ke Komputer Fotokopi
              </h1>
              <p className="text-xs text-[#587063] mt-1">
                Tujuan: <b className="text-[#087443]">wert.web.id/{sessionData?.username}</b>
              </p>
            </div>

            {/* Mobile Tab Selector: Upload Berkas vs Kirim Tautan */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#E3F8EC] border border-[#D5EADF] gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("files")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === "files"
                    ? "bg-white text-[#087443] shadow-sm border border-[#D5EADF]"
                    : "text-[#587063] hover:text-[#10241B]"
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>Upload Berkas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === "link"
                    ? "bg-white text-[#087443] shadow-sm border border-[#D5EADF]"
                    : "text-[#587063] hover:text-[#10241B]"
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Kirim Link</span>
              </button>
            </div>

            {/* TAB 1: DROPZONE UNTUK UPLOAD DOKUMEN / FOTO */}
            {activeTab === "files" && (
              <div className="bg-white p-4 rounded-[28px] border border-[#D5EADF] shadow-soft animate-in fade-in">
                <Dropzone
                  token={token}
                  onUploadSuccess={() => {
                    setUploadedCount((prev) => prev + 1);
                  }}
                />
              </div>
            )}

            {/* TAB 2: FORM KIRIM LINK DARI HP */}
            {activeTab === "link" && (
              <div className="bg-white p-5 rounded-[28px] border border-[#D5EADF] shadow-soft flex flex-col gap-4 animate-in fade-in text-left">
                {linkSuccess && (
                  <div className="p-3.5 rounded-2xl bg-[#E3F8EC] border border-[#19C37D]/30 flex items-start gap-2.5 text-xs text-[#087443]">
                    <CheckCircle className="w-4 h-4 shrink-0 text-[#087443] mt-0.5" />
                    <div>
                      <p className="font-bold">Tautan berhasil dikirim!</p>
                      <p className="text-[11px] text-[#587063] mt-0.5">
                        Tautan sudah muncul di layar komputer fotokopi secara otomatis.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendLink} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#10241B] mb-1.5">
                      URL Tautan <span className="text-[#D92D3A]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={linkUrl}
                        onChange={(e) => handleLinkChange(e.target.value)}
                        placeholder="https://drive.google.com/... atau Canva"
                        className="w-full px-3.5 py-3 pr-24 rounded-2xl bg-[#F4FBF7] border-2 border-[#D5EADF] focus:border-[#087443] focus:bg-white text-xs sm:text-sm text-[#10241B] placeholder-[#8AA095] outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="absolute right-2 px-2.5 py-1.5 rounded-xl bg-white border border-[#D5EADF] hover:bg-[#E3F8EC] text-[11px] font-semibold text-[#087443] flex items-center gap-1 transition cursor-pointer"
                      >
                        {pasted ? <Check className="w-3 h-3 text-[#087443]" /> : <Clipboard className="w-3 h-3" />}
                        <span>{pasted ? "Tertempel" : "Tempel"}</span>
                      </button>
                    </div>

                    {/* Detected Platform Pill */}
                    {platformInfo && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#587063] font-medium">Platform:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${platformInfo.badgeBg} ${platformInfo.badgeText} border ${platformInfo.borderColor}`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{platformInfo.label}</span>
                        </span>
                        <span className="text-[10px] text-[#8AA095] font-mono">({platformInfo.domain})</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10241B] mb-1.5">
                      Judul Tugas <span className="text-[11px] font-normal text-[#587063]">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder={linkUrl ? getDefaultLinkTitle(linkUrl) : "Misal: Desain Spanduk"}
                      maxLength={100}
                      className="w-full px-3.5 py-3 rounded-2xl bg-[#F4FBF7] border-2 border-[#D5EADF] focus:border-[#087443] focus:bg-white text-xs sm:text-sm text-[#10241B] placeholder-[#8AA095] outline-none transition"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] text-[11px] text-[#587063] leading-relaxed">
                    💡 <b>Info:</b> Untuk Google Drive / Docs, pastikan akses berbagi diatur agar siapa saja yang punya link bisa melihat.
                  </div>

                  {linkError && (
                    <div className="p-3 rounded-xl bg-[#FFEAEC] text-[#D92D3A] text-xs flex items-center gap-2 border border-[#D92D3A]/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{linkError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={linkLoading || !linkUrl.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm btn-tactile mt-1"
                  >
                    {linkLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengirim ke Komputer...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Kirim Link ke Komputer</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Live Notification Indicator */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#E3F8EC] border border-[#D5EADF] text-[#10241B]">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#D5EADF] flex items-center justify-center shrink-0 text-[#087443] shadow-sm">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#087443]">Sinkronisasi Realtime</span>
                <span className="text-[11px] text-[#587063] mt-0.5">
                  File dan link yang dikirim langsung muncul otomatis di layar komputer fotokopian.
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
