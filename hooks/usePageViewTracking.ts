// hooks/usePageViewTracking.ts
import { useEffect } from "react";
import { useGTM } from "./useGTM";

export const usePageViewTracking = (name: string) => {
  const { trackPageView } = useGTM();

  useEffect(() => {
    trackPageView(name);
  }, [trackPageView, name]);
};
