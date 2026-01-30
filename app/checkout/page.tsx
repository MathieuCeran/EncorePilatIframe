"use client";

import React, { Suspense, useEffect } from "react";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import Loader from "@/components/loader";
import { CheckoutSummary, PackList } from "@/components/checkout";
import { useCheckout } from "@/hooks/useCheckout";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const CheckoutContent = () => {
  const {
    packs,
    course,
    loading,
    error,
    selectedPack,
    activeFilter,
    autoSelectedFromUserPack,
    promoCode,
    appliedPromo,
    handlePackSelection,
    handleFilterChange,
    handleSitePayment,
    applyPromo,
    clearPromo,
    updatePromoCode,
  } = useCheckout();

  // Tracker InitiateCheckout quand l'utilisateur arrive sur la page checkout
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "InitiateCheckout");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-playfair font-bold text-red-600 mb-4">
            Erreur de chargement
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundWrapper>
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
          {/* Mobile: Summary first */}
          <CheckoutSummary
            course={course}
            selectedPack={selectedPack}
            userPack={autoSelectedFromUserPack}
            onSitePayment={handleSitePayment}
            isMobile={true}
            promoCode={promoCode}
            appliedPromo={appliedPromo}
            onPromoInputChange={updatePromoCode}
            onApplyPromo={applyPromo}
            onClearPromo={clearPromo}
          />

          {/* Desktop: Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left - Packs list */}
            <PackList
              packs={packs}
              selectedPack={selectedPack}
              activeFilter={activeFilter}
              userPack={autoSelectedFromUserPack}
              onPackSelect={handlePackSelection}
              onFilterChange={handleFilterChange}
            />

            {/* Right - Summary (Desktop only) */}
            <CheckoutSummary
              course={course}
              selectedPack={selectedPack}
              userPack={autoSelectedFromUserPack}
              onSitePayment={handleSitePayment}
              isMobile={false}
              promoCode={promoCode}
              appliedPromo={appliedPromo}
              onPromoInputChange={updatePromoCode}
              onApplyPromo={applyPromo}
              onClearPromo={clearPromo}
            />
          </div>
        </div>
      </BackgroundWrapper>
    </div>
  );
};

const CheckoutPage = () => {
  return (
    <Suspense fallback={<Loader />}>
      <CheckoutContent />
    </Suspense>
  );
};

export default CheckoutPage;
