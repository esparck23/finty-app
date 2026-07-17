import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SwRegister from "./sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "Finty — Gestión de Fondos Humanitarios",
  description: "Registro transparente de ingresos y egresos para ayuda humanitaria en Venezuela",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finty",
  },
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/manifest.webmanifest" },
    ],
  },
  manifest: "/manifest.webmanifest",
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
      {/* PWA 5.8 — iOS Add-to-Home-Screen metas. Next.js 16 ya emite
          apple-mobile-web-app-status-bar-style y apple-touch-icon desde
          metadata.appleWebApp / icons.apple; esta meta faltante
          (apple-mobile-web-app-capable) debe inyectarse manualmente
          para que iOS Safari ofrezca el prompt de instalación. */}
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-300 pb-10">
        <SwRegister />
        {children}
        <footer className="fixed bottom-0 left-0 right-0 py-2 text-center text-xs text-slate-600 border-t border-white/5 bg-slate-950 z-30">
          <p>Finty &mdash; Gestión de Fondos Humanitarios</p>
        </footer>
      </body>
    </html>
  );
}
