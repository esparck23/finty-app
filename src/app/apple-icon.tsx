import { ImageResponse } from "next/og";

/**
 * PWA 5.4 — Apple touch icon (iOS "Añadir a pantalla de inicio").
 *
 * Next.js detecta `src/app/apple-icon.tsx` y sirve el PNG en
 * `/apple-icon`. Auto-inyecta:
 *   <link rel="apple-touch-icon" href="/apple-icon?<hash>">
 *
 * iOS necesita 180x180 (sin canal alfa, fondo opaco) para evitar
 * aplicar su redondeo automático. Se usa fondo verde sólido para
 * que el icono se vea consistente en Springboard.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
