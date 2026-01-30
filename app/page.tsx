"use client";

import Carousel from "@/components/carousel";
import NoCours from "@/components/no-cours";
import About from "@/components/about";
import Faq from "@/components/faq";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/loader";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

// home page
export default function Home() {
  // track page view
  usePageViewTracking("/");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-10">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <Carousel isLoggedIn={isLoggedIn} />
      <NoCours />
      <About isLoggedIn={isLoggedIn} />
      <Faq />
    </div>
  );
}
