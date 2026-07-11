"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSw = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered successfully with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        registerSw();
      } else {
        window.addEventListener("load", registerSw);
        return () => window.removeEventListener("load", registerSw);
      }
    }
  }, []);

  return null;
}
