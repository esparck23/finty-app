import { ImageResponse } from "next/og";

/**
 * PWA 5.4 — Favicon de Finty.
 *
 * Next.js detecta `src/app/icon.tsx` y sirve el resultado en
 * `/icon` (más hashing en build). Auto-inyecta:
 *   <link rel="icon" href="/icon?<hash>" type="image/png" sizes="...">
 *
 * Se genera un PNG 32x32 con `next/og` para mantener consistencia
 * visual con el icono principal del manifest y el apple-touch-icon,
 * sin necesidad de commitear un binario.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: -0.5,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
