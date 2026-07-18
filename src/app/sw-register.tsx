"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const registerSw = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered successfully with scope:", registration.scope);

            // Intentar registrar sync inicial al iniciar
            if ("sync" in registration) {
              navigator.serviceWorker.ready.then((reg) => {
                (reg as any).sync.register("sync-transactions")
                  .then(() => console.log("Initial background sync registered"))
                  .catch((err: any) => console.error("Initial background sync registration failed:", err));
              });
            }
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      };

      const handleOnline = () => {
        console.log("Browser is online, requesting sync...");
        navigator.serviceWorker.ready.then((registration) => {
          if ("sync" in registration) {
            (registration as any).sync.register("sync-transactions")
              .then(() => console.log("Sync 'sync-transactions' registered on online event"))
              .catch((err: any) => console.error("Online event sync registration failed:", err));
          } else {
            // Fallback para navegadores sin soporte de Background Sync API
            navigator.serviceWorker.controller?.postMessage({ type: "SYNC_TRANSACTIONS" });
          }
        });
      };

      window.addEventListener("online", handleOnline);

      if (document.readyState === "complete") {
        registerSw();
      } else {
        window.addEventListener("load", registerSw);
        return () => {
          window.removeEventListener("load", registerSw);
          window.removeEventListener("online", handleOnline);
        };
      }

      return () => {
        window.removeEventListener("online", handleOnline);
      };
    }
  }, []);

  return null;
}
