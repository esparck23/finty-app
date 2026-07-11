import { Serwist, NetworkFirst } from "serwist";

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
