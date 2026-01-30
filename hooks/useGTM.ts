import { useCallback } from "react";
import { sendGTMEvent } from "@next/third-parties/google";

export const useGTM = () => {
  const getCookieConsent = useCallback(() => {
    try {
      const consent = localStorage.getItem("cookie-consent");
      return consent ? JSON.parse(consent) : null;
    } catch (error) {
      console.warn("Erreur lors de la lecture du consentement:", error);
      return null;
    }
  }, []);

  const trackPageView = useCallback(
    (name: string) => {
      const consent = getCookieConsent();
      if (consent) {
        sendGTMEvent({
          event: "page_view",
          page_name: name,
        });
      }
    },
    [getCookieConsent]
  );

  const trackCustomEvent = useCallback(
    (eventName: string, parameters: Record<string, unknown> = {}) => {
      const consent = getCookieConsent();
      if (consent) {
        sendGTMEvent({
          event: eventName,
          ...parameters,
        });
      }
    },
    [getCookieConsent]
  );

  return {
    getCookieConsent,
    trackPageView,
    trackCustomEvent,
  };
};
