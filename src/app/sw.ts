import {
  Serwist,
  NetworkFirst,
  NavigationRoute,
  PrecacheFallbackPlugin,
  CacheableResponsePlugin,
} from "serwist";

declare const self: any;

// ── Sync helpers inline (usan self.indexedDB, seguro en SW) ──────────
const DB_NAME = "finty_offline_db";
const TX_STORE = "offline_transactions";
const CAT_STORE = "offline_categories";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = self.indexedDB;
    if (!idb) { resolve(null as any); return; }
    const req = idb.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TX_STORE)) db.createObjectStore(TX_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(CAT_STORE)) db.createObjectStore(CAT_STORE, { keyPath: "id" });
    };
  });
}

function getAllFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || []);
    } catch { resolve([]); }
  });
}

function markSyncedInStore(db: IDBDatabase, storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result;
        if (!item) { resolve(); return; }
        item.is_offline_sync = true;
        store.put(item);
        resolve();
      };
      req.onerror = () => reject(req.error);
    } catch { resolve(); }
  });
}

async function swSyncTransactions(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  const txs = await getAllFromStore(db, TX_STORE);
  for (const t of txs.filter((x: any) => !x.is_offline_sync)) {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: t.type, amount_usd: t.amount_usd, amount_bs: t.amount_bs,
          currency_primary: t.currency_primary, category_id: t.category_id,
          description: t.description || "", receipt_url: t.receipt_url || "",
          transaction_date: t.transaction_date, receipt_type: t.receipt_type,
          provider_name: t.provider_name, tax_id: t.tax_id,
          document_type: t.document_type, transfer_provider: t.transfer_provider,
          transfer_operation: t.transfer_operation,
          original_image_url: t.original_image_url, processed_at: t.processed_at,
        }),
      });
      if (res.ok) await markSyncedInStore(db, TX_STORE, t.id);
    } catch { /* retry en próximo sync */ }
  }
}

async function swSyncCategories(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  const cats = await getAllFromStore(db, CAT_STORE);
  for (const c of cats.filter((x: any) => !x.is_offline_sync)) {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: c.name, type: c.type }),
      });
      if (res.ok) await markSyncedInStore(db, CAT_STORE, c.id);
    } catch { /* retry en próximo sync */ }
  }
}

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



const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST || []),
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
  // skipWaiting: activa el nuevo SW inmediatamente sin esperar a que
  // los clientes existentes lo liberen.
  // El caché de páginas se llena automáticamente vía NavigationRoute
  // la primera vez que el usuario visita cada ruta (con conexión).
  // El warm-up agresivo de 4 rutas en paralelo saturaba Turso y
  // causaba que /api/auth/me tardara >5s, disparando el bucle de recarga.
  self.skipWaiting();
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(
      (async () => {
        await swSyncTransactions();
        await swSyncCategories();
      })()
    );
  }
});

self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SYNC_TRANSACTIONS") {
    event.waitUntil(
      (async () => {
        await swSyncTransactions();
        await swSyncCategories();
      })()
    );
  }
});
