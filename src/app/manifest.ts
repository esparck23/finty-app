import type { MetadataRoute } from "next";

/**
 * PWA 5.4 — Web App Manifest para Finty.
 *
 * Next.js detecta este archivo en `src/app/manifest.ts` y, en build,
 * genera automáticamente:
 *   - el endpoint estático `/manifest.webmanifest`
 *   - el `<link rel="manifest" href="/manifest.webmanifest">` en el `<head>`
 *
 * No se modifica `layout.tsx`: la convención de App Router basta para
 * cumplir los criterios de instalabilidad PWA (Chrome / Edge / Samsung /
 * "Añadir a pantalla de inicio" de iOS Safari).
 *
 * Campos mínimos exigidos por los navegadores para mostrar el prompt
 * de instalación:
 *   - name / short_name
 *   - start_url
 *   - display
 *   - icons[] con al menos un PNG >= 192x192 y uno >= 512x512
 *     (uno de ellos con `purpose: "maskable"` para Android adaptativo)
 *
 * Los iconos son servidos por `src/app/icons/[size]/route.tsx` (PNG
 * generados on-demand con `next/og`), por lo que no hay binarios
 * versionados en el repo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finty — Gestión de Fondos Humanitarios",
    short_name: "Finty",
    description:
      "Registro transparente de ingresos y egresos para ayuda humanitaria en Venezuela.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait",
    background_color: "#020617", // slate-950 (alineado con globals.css)
    theme_color: "#10b981", // emerald-500 (color primario de la app)
    lang: "es",
    dir: "ltr",
    categories: ["finance", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
