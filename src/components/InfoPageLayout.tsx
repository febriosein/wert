"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ChevronLeft, ShieldCheck, FileText, HelpCircle, ArrowRight } from "lucide-react";
import React from "react";

interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}

const TABS = [
  { href: "/privacy", label: "Kebijakan Privasi", icon: ShieldCheck },
  { href: "/terms", label: "Syarat & Ketentuan", icon: FileText },
  { href: "/bantuan", label: "Pusat Bantuan", icon: HelpCircle },
];

export function InfoPageLayout({ title, subtitle, badge = "Informasi & Panduan", children }: InfoPageLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-[#10241B] selection:bg-[#E3F8EC] selection:text-[#087443]">
      <Navbar showActions={false} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#D5EADF] text-xs sm:text-sm font-semibold text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition-all btn-tactile shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 text-[#087443]" />
            <span>Kembali ke Beranda</span>
          </Link>

          <span className="text-[11px] font-mono text-[#587063]">wert.web.id</span>
        </div>

        {/* Page Hero Header */}
        <header className="flex flex-col gap-2 text-left">
          <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] text-xs font-bold border border-[#D5EADF]">
            <span>{badge}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#10241B] tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-[#587063] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </header>

        {/* Unified Sub-Navigation Tabs */}
        <nav
          aria-label="Navigasi Halaman Informasi"
          className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#D5EADF] shadow-xs overflow-x-auto scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === "/bantuan" && pathname === "/help");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#087443] text-white shadow-xs font-bold"
                    : "text-[#587063] hover:text-[#10241B] hover:bg-[#F4FBF7]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#587063]"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <div className="w-full">{children}</div>
      </main>

      {/* Consistent Footer */}
      <footer className="w-full border-t border-[#D5EADF] py-8 text-center text-xs text-[#587063] bg-white/50 backdrop-blur-xs mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[#10241B]">wert.web.id</span>
            <span>•</span>
            <span>Cetak tugas cepat tanpa WhatsApp</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/privacy" className="hover:text-[#087443] transition">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-[#087443] transition">
              Syarat & Ketentuan
            </Link>
            <Link href="/bantuan" className="hover:text-[#087443] transition">
              Bantuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
