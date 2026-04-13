import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TherapyAI",
  description: "Acompañamiento psicológico a través de inteligencia artificial con seguimiento profesional.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-surface-subtle min-h-screen text-ink">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
