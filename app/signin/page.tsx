"use client";

import CardVertical from "@/components/ui/cardVertical";
import { SignInForm } from "@/components/SignInForm";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

export default function SignInPage() {
  // track page view
  usePageViewTracking("signin");

  return (
    <BackgroundWrapper className="flex flex-col justify-center items-center p-4">
      <CardVertical title="Connexion">
        <div className="flex flex-col h-full">
          <SignInForm />
        </div>
      </CardVertical>
    </BackgroundWrapper>
  );
}
