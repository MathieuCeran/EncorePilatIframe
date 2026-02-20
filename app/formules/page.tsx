"use client";

import React from "react";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";
import { WellPassWidget } from "@/components/WellPassWidget";

const FormulesPage = () => {
  // Track page view
  usePageViewTracking("formules");

  return (
    <div className="min-h-screen py-10 md:ml-8 md:mr-8">
      <BackgroundWrapper>
        <section className="px-4 pb-12">
          <div className="max-w-7xl mx-auto">
            <WellPassWidget widgetId="11" height={900} />
          </div>
        </section>
      </BackgroundWrapper>
    </div>
  );
};

export default FormulesPage;
