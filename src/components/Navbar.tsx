"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode, Settings, LogOut, Printer } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  username?: string;
  onOpenQr?: () => void;
  showActions?: boolean;
}

export function Navbar({ username, onOpenQr, showActions = true }: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href={username ? `/${username}` : "/"} prefetch={true} className="flex items-center gap-3 group">
          {/* Logo Kotak Hijau 40x40 bergaya stiker */}
          <div className="w-10 h-10 rounded-xl bg-brand-deep flex items-center justify-center text-white border-2 border-ink shadow-sticker-sm flex-shrink-0 transition-transform group-hover:-translate-y-0.5">
            <Printer className="w-5 h-5" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[22px] tracking-tight text-ink">
                wert<span className="text-brand-deep">.web.id</span>
              </span>
            </div>
            <span className="hidden sm:inline text-xs font-medium text-muted mt-0.5">
              Cetak tugas tanpa WhatsApp
            </span>
          </div>
        </Link>

        {/* User Context & Actions */}
        {username && showActions && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Chip @nama */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-mint text-brand-deep border border-line">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
              @{username}
            </span>

            {/* Tombol Upload dari HP */}
            {onOpenQr && (
              <button
                type="button"
                onClick={onOpenQr}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-xs font-bold bg-surface border border-line text-ink hover:bg-mint hover:border-brand-deep/30 shadow-sm transition-all cursor-pointer"
                title="Buka QR Code untuk upload dari smartphone"
              >
                <QrCode className="w-4 h-4 text-brand-deep" />
                <span className="hidden md:inline">Upload dari HP</span>
              </button>
            )}

            {/* Ikon Pengaturan */}
            <Link
              href={`/${username}/settings`}
              prefetch={true}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-mint transition"
              title="Pengaturan akun & PIN"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Tombol Keluar */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-danger hover:bg-danger-soft transition"
              title="Keluar dari sesi ini"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
