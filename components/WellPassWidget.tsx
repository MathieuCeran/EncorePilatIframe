"use client";

import { useEffect, useRef } from "react";

const WELLPASS_BASE_URL =
  process.env.NEXT_PUBLIC_WELLPASS_URL ||
  "https://testing-pulse.wellpass-corp.com";

interface WellPassWidgetProps {
  widgetId?: string;
  height?: number;
  className?: string;
}

export const WellPassWidget: React.FC<WellPassWidgetProps> = ({
  widgetId = "11",
  height = 900,
  className = "",
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== WELLPASS_BASE_URL) return;
      if (typeof e.data !== "object" || e.data === null) return;

      if (e.data.type === "wellpass-resize" && iframeRef.current) {
        iframeRef.current.style.height = e.data.height + "px";
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <iframe
        ref={iframeRef}
        src={`${WELLPASS_BASE_URL}/users/api/generateWidget?widgetId=${widgetId}`}
        width="100%"
        height={height}
        style={{ border: "none", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        title="WellPass Calendar Widget"
        allow="payment"
      />
    </div>
  );
};
