import { useEffect } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const useMetaPixel = () => {
  useEffect(() => {
    // Le script Meta Pixel sera chargé via le layout, ici on s'assure qu'il est disponible
    if (typeof window !== 'undefined' && !window.fbq) {
      console.warn('Meta Pixel not loaded yet');
    }
  }, []);

  // Fonction pour tracker les événements
  const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', eventName, parameters);
        console.log(`✅ Meta Pixel: ${eventName} tracked`, parameters);
      } catch (error) {
        console.error('❌ Meta Pixel tracking error:', error);
      }
    } else {
      console.warn('❌ Meta Pixel not available');
    }
  };

  // Fonction spécifique pour tracker les achats
  const trackPurchase = (value: number, currency: string = 'MAD', orderId?: string) => {
    trackEvent('Purchase', {
      value,
      currency,
      content_ids: orderId ? [orderId] : undefined,
    });
  };

  // Fonction pour tracker l'ajout au panier
  const trackAddToCart = (value: number, currency: string = 'MAD', contentName?: string) => {
    trackEvent('AddToCart', {
      value,
      currency,
      content_name: contentName,
    });
  };

  // Fonction pour tracker le début du checkout
  const trackInitiateCheckout = (value: number, currency: string = 'MAD') => {
    trackEvent('InitiateCheckout', {
      value,
      currency,
    });
  };

  // Fonction pour tracker les leads
  const trackLead = (value?: number, currency: string = 'MAD') => {
    trackEvent('Lead', {
      value,
      currency,
    });
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackInitiateCheckout,
    trackLead,
  };
};

export default useMetaPixel;
