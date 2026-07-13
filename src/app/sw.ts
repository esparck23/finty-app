import { Serwist, NetworkFirst } from "serwist";
import { syncOfflineTransactions } from "../lib/offline/db";

declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
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

serwist.addEventListeners();

self.addEventListener("install", (event: any) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(syncOfflineTransactions());
  }
});

self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SYNC_TRANSACTIONS") {
    event.waitUntil(syncOfflineTransactions());
  }
});
