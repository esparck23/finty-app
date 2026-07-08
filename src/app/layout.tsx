import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finty — Gestión de Fondos Humanitarios",
  description: "Registro transparente de ingresos y egresos para ayuda humanitaria en Venezuela",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-300">
        <div className="flex flex-col min-h-screen">
          {children}
          <div className="mt-auto border-t border-white/5" />
          <footer className="py-4 text-center text-xs text-slate-600">
            <p>Finty &mdash; Gestión de Fondos Humanitarios</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
