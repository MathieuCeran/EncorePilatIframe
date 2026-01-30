"use client";

import CardVertical from "@/components/ui/cardVertical";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

export default function ResetPasswordPage() {
  // track page view
  usePageViewTracking("reset-password");

  return (
    <BackgroundWrapper className="flex flex-col justify-center items-center p-4">
      <CardVertical title="Mot de passe oublié">
        <div className="flex flex-col h-full">
          <ResetPasswordForm />
        </div>
      </CardVertical>
    </BackgroundWrapper>
  );
}
