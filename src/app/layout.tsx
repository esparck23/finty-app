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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-300 pb-10">
        {children}
        <footer className="fixed bottom-0 left-0 right-0 py-2 text-center text-xs text-slate-600 border-t border-white/5 bg-slate-950 z-30">
          <p>Finty &mdash; Gestión de Fondos Humanitarios</p>
        </footer>
      </body>
    </html>
  );
}
