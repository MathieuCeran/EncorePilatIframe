"use client";

import { useEffect } from "react";

interface WellPassWidgetProps {
  widgetId?: string;
  height?: number;
  className?: string;
}

export const WellPassWidget: React.FC<WellPassWidgetProps> = ({
  widgetId = "20",
  height = 900,
  className = "",
}) => {
  useEffect(() => {
    // Auto-resize iframe height based on content
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "wellpass-resize") {
        const iframe = document.querySelector(
          'iframe[src*="generateWidget"]'
        ) as HTMLIFrameElement;
        if (iframe) {
          iframe.style.height = e.data.height + "px";
        }
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
        src={`https://pro.wellpass-corp.com/users/api/generateWidget?widgetId=${widgetId}`}
        width="100%"
        height={height}
        frameBorder="0"
        style={{
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
        title="WellPass Calendar Widget"
        allow="payment"
      />
    </div>
  );
};
