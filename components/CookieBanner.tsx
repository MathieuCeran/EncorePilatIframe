"use client";

import { useState, useEffect, useCallback } from "react";
import { useGTM } from "@/hooks/useGTM";

interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  timestamp?: number;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { trackCustomEvent, getCookieConsent } = useGTM();

  // Check consent on mount
  useEffect(() => {
    try {
      const consent = getCookieConsent();
      if (!consent) {
        // Add slight delay to prevent flash on initial load
        const timer = setTimeout(() => setShowBanner(true), 100);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.warn("Failed to access localStorage for cookie consent:", error);
      // Fallback: show banner if localStorage is not available
      setShowBanner(true);
    }
  }, [getCookieConsent]);

  // Memoized consent handler
  const handleConsent = useCallback(
    async (consentType: "accept" | "reject") => {
      setIsLoading(true);

      const consent: CookieConsent = {
        analytics: consentType === "accept",
        marketing: consentType === "accept",
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem("cookie-consent", JSON.stringify(consent));

        // Track consent event with error handling
        await trackCustomEvent("cookie_consent", {
          consent_type: consentType,
          analytics: consent.analytics,
          marketing: consent.marketing,
        });
      } catch (error) {
        console.warn("Failed to save cookie consent:", error);
      } finally {
        setIsLoading(false);
        setShowBanner(false);
      }
    },
    [trackCustomEvent]
  );

  const handleAccept = () => handleConsent("accept");
  const handleReject = () => handleConsent("reject");

  // Early return for better performance
  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-marron shadow-lg animate-in slide-in-from-bottom duration-500"
      role="banner"
      aria-label="Cookie consent banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-white leading-relaxed">
              Ce site utilise des cookies pour améliorer votre expérience de
              navigation, personnaliser certaines fonctionnalités et vous
              proposer des contenus adaptés à vos centres d&apos;intérêt. En
              continuant votre visite, vous acceptez l&apos;utilisation de ces
              cookies.
            </p>
          </div>

          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 shrink-0 w-full lg:w-auto justify-center">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-transparent hover:bg-white/10 
                           border border-white rounded-xs transition-colors duration-200 
                           focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 
                           focus:ring-offset-marron disabled:opacity-50 disabled:cursor-not-allowed
                           min-w-[300px]"
              aria-label="Refuser les cookies"
            >
              {isLoading ? "..." : "Refuser"}
            </button>

            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-marron bg-white 
                           border border-white rounded-xs transition-colors duration-200 
                           focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 
                           focus:ring-offset-marron disabled:opacity-50 disabled:cursor-not-allowed
                           min-w-[300px]"
              aria-label="Accepter les cookies"
            >
              {isLoading ? "..." : "Accepter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
