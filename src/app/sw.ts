import {
  Serwist,
  NetworkFirst,
  NavigationRoute,
  PrecacheFallbackPlugin,
  CacheableResponsePlugin,
} from "serwist";
import { syncOfflineTransactions, syncOfflineCategories } from "../lib/offline/db";

declare const self: any;

/**
 * Service Worker de Finty — bloques 5.1, 5.3, 5.6 y 5.7.
 *
 * - 5.1: cachea SOLO GET /api/categories y /api/transactions con
 *   NetworkFirst en `api-cache-v1`.
 * - 5.3: background sync con tag `sync-transactions` y fallback
 *   por mensaje `SYNC_TRANSACTIONS`.
 * - 5.6: NavigationRoute para TODAS las navegaciones HTML
 *   (request.mode === "navigate") con NetworkFirst en `pages` y
 *   fallback a `/dashboard` desde el cache (warm-up en install +
 *   `setCatchHandler` para la red caída).
 * - 5.7: precache de rutas clave (`/dashboard`, `/transacciones`,
 *   `/categorias`, `/transparencia`) para carga sin red del app
 *   shell. Estas entradas se SUMAN al `__SW_MANIFEST` autogenerado
 *   por @serwist/next (que solo cubre assets estáticos de `public/`),
 *   porque las rutas de App Router son server-rendered y no aparecen
 *   en el manifest por defecto.
 *
 * NO interceptamos /api/* (deja pasar a la red), /sw.js ni assets
 * estáticos (los maneja el precache de Serwist).
 */

const PAGES_CACHE_NAME = "pages";
const OFFLINE_FALLBACK_URL = "/dashboard";
const OFFLINE_FALLBACK_URLS = [
  "/dashboard",
  "/transacciones",
  "/categorias",
  "/transparencia",
];

// 5.7 — Entradas explícitas del precache para rutas App Router que
// el `__SW_MANIFEST` de Serwist no cubre (serwist solo escanea
// `public/` y `_next/static/`). Usamos un revision estático por
// entrada: las páginas son server-rendered y el contenido se
// considera "estable" para la duración de un deploy. Si el contenido
// cambia, basta con bumpear la revision (p. ej. `finty-routes-v2`).
const PRECACHE_ROUTE_REVISION = "finty-routes-v1";
const PRECACHE_ROUTE_ENTRIES: Array<{ url: string; revision: string }> = [
  { url: "/dashboard", revision: PRECACHE_ROUTE_REVISION },
  { url: "/transacciones", revision: PRECACHE_ROUTE_REVISION },
  { url: "/categorias", revision: PRECACHE_ROUTE_REVISION },
  { url: "/transparencia", revision: PRECACHE_ROUTE_REVISION },
];

const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST || []),
    ...PRECACHE_ROUTE_ENTRIES,
  ],
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  runtimeCaching: [
    {
      matcher: ({ url, request }) => {
        return (
          request.method === "GET" &&
          (url.pathname === "/api/categories" || url.pathname === "/api/transactions")
        );
      },
      handler: new NetworkFirst({
        cacheName: "api-cache-v1",
      }),
    },
  ],
});

// Estrategia de navegación 5.6: NetworkFirst con cache dedicado "pages"
// + timeout corto (3s) para no penalizar UX online + CacheableResponse
// para no persistir respuestas erróneas.
const navigationStrategy = new NetworkFirst({
  cacheName: PAGES_CACHE_NAME,
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  ],
});

// NavigationRoute 5.6: captura request.mode === "navigate" con un
// denylist explícito para no interceptar APIs, el propio SW ni
// assets estáticos.
const navigationRoute = new NavigationRoute(navigationStrategy, {
  allowlist: [
    // Solo paths que NO sean /api, /_next, /sw.js, /icons, manifest, etc.
    /^\/(?!api\/|_next\/|sw\.js$|icons\/|sw-register|manifest\.webmanifest|.*\.(?:png|svg|ico|webp|woff2?|css|js)$).*/,
  ],
  denylist: [/\/api\//, /\/sw\.js$/, /\/sw-register/, /\/_next\/data\//],
});

// setCatchHandler del NavigationRoute: si la red falla y la URL tampoco
// está en el cache "pages" (caso primera visita offline), devolvemos
// `/dashboard` (o `/transparencia`) desde el mismo cache "pages" poblado
// en el warm-up de `install`.
navigationRoute.setCatchHandler(async ({ event }: any) => {
  if (event?.request?.method !== "GET") {
    return Response.error();
  }

  const cache = await caches.open(PAGES_CACHE_NAME);
  for (const url of OFFLINE_FALLBACK_URLS) {
    const cached = await cache.match(url);
    if (cached) {
      return cached;
    }
  }

  // Si ni siquiera el warm-up pobló nada (offline en install),
  // devolvemos un 503 claro: el navegador mostrará su página nativa
  // de error. No propagamos errores crípticos.
  return new Response(
    "<h1>Sin conexión</h1><p>Abre la app al menos una vez con conexión para usarla sin red.</p>",
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
});

serwist.registerRoute(navigationRoute);

serwist.addEventListeners();

self.addEventListener("install", (event: any) => {
  self.skipWaiting();
  // Warm-up del cache de páginas: la primera vez que el SW se instala
  // (online), hacemos fetch de /dashboard y /transparencia y las
  // guardamos en el cache "pages" para que estén disponibles offline
  // sin depender del precache (Next.js App Router no precachea rutas
  // de servidor). Best-effort: si no hay red, lo dejamos para la
  // siguiente activación.
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PAGES_CACHE_NAME);
        await Promise.all(
          OFFLINE_FALLBACK_URLS.map(async (url) => {
            try {
              const res = await fetch(url, {
                credentials: "same-origin",
                redirect: "follow",
              });
              if (res && res.ok) {
                await cache.put(url, res.clone());
              }
            } catch {
              // Sin red: se llenará en la próxima visita online.
            }
          }),
        );
      } catch {
        // El warm-up es best-effort.
      }
    })(),
  );
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(
      (async () => {
        await syncOfflineTransactions();
        await syncOfflineCategories();
      })()
    );
  }
});

self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SYNC_TRANSACTIONS") {
    event.waitUntil(
      (async () => {
        await syncOfflineTransactions();
        await syncOfflineCategories();
      })()
    );
  }
});
