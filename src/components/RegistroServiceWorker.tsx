// src/components/RegistroServiceWorker.tsx
"use client";

import { useEffect } from "react";

/** Registra /sw.js una vez. En desarrollo no hace nada, para no guardar versiones viejas mientras se programa. */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
