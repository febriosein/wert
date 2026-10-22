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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href={username ? `/${username}` : "/"} prefetch={true} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition">
            <Printer className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
              wert<span className="text-emerald-600">.web.id</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Cetak tugas tanpa WhatsApp</span>
          </div>
        </Link>

        {/* User Context & Actions */}
        {username && showActions && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              @{username}
            </span>

            {onOpenQr && (
              <button
                type="button"
                onClick={onOpenQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Buka QR Code untuk upload dari smartphone"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">Upload dari HP</span>
              </button>
            )}

            <Link
              href={`/${username}/settings`}
              prefetch={true}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Pengaturan akun & PIN"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
              title="Keluar dari sesi ini"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
