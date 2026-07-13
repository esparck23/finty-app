import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * PWA 5.4 — Generador dinámico de iconos PWA (192x192 y 512x512).
 *
 * El `manifest.webmanifest` (src/app/manifest.ts) referencia
 * `/icons/192` y `/icons/512` (PNG). Este route handler produce
 * los PNGs on-demand con `next/og`, así no se commitean binarios
 * al repo y se mantiene un único origen de verdad para el diseño
 * del icono (compartido con `icon.tsx` y `apple-icon.tsx`).
 *
 * Los navegadores cachean la respuesta por el `Cache-Control` que
 * emite Next.js en build estático, por lo que el coste en runtime
 * es despreciable.
 */
export const dynamic = "force-static";
export const revalidate = false;

const SIZES = {
  "192": 192,
  "512": 512,
} as const;

type SizeKey = keyof typeof SIZES;

function isSizeKey(value: string): value is SizeKey {
  return value in SIZES;
}

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;

  if (!isSizeKey(size)) {
    return new Response("Not Found", { status: 404 });
  }

  const px = SIZES[size];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
          fontSize: px * 0.55,
          fontWeight: 700,
          letterSpacing: -px * 0.01,
        }}
      >
        F
      </div>
    ),
    {
      width: px,
      height: px,
    },
  );
}
