import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "wert.web.id - Kirim file, langsung cetak",
  description: "Buka halaman tugasmu dan tunjukkan ke tukang fotokopi. Tanpa chat WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${bricolage.variable} h-full antialiased light`}
      style={{ colorScheme: "light" }}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-[#F4FBF7] text-[#10241B]"
        style={{ backgroundColor: "#F4FBF7", color: "#10241B", colorScheme: "light" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
