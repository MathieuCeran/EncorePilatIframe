"use client";

import { useEffect } from "react";

export default function AdminBodyReset() {
  useEffect(() => {
    const clearPointerEvents = () => {
      const anyDialogOpen =
        document.querySelector("[data-slot='dialog-overlay']") ||
        document.querySelector(
          "[data-state='open'][data-slot='dialog-content']"
        );
      if (
        !anyDialogOpen &&
        document.body &&
        document.body.style.pointerEvents === "none"
      ) {
        document.body.style.pointerEvents = "";
      }
    };

    clearPointerEvents();

    const observer = new MutationObserver(() => clearPointerEvents());
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
