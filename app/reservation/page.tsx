"use client";

import React from "react";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";
import { WellPassWidget } from "@/components/WellPassWidget";

const ReservationPage: React.FC = () => {
  // Track page view
  usePageViewTracking("reservation");

  return (
    <BackgroundWrapper>
      <div className="min-h-screen pt-10 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <WellPassWidget widgetId="11" height={900} />
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default ReservationPage;
