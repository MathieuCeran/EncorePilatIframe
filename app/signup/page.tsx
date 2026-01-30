"use client";

import { useRouter } from "next/navigation";
import CardVertical from "@/components/ui/cardVertical";
import { SignUpForm } from "../../components/SignUpForm";
import { StepIndicator } from "../../components/StepIndicator";
import { NavigationButtons } from "../../components/NavigationButtons";
import { useSignUpForm } from "../../hooks/useSignUpForm";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

export default function SignUpPage() {
  const router = useRouter();
  const {
    formData,
    step,
    loading,
    error,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
  } = useSignUpForm(router);

  // track page view
  usePageViewTracking("signup");

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <title>Créer un compte</title>
        <CardVertical title="Inscription">
          <div className="flex flex-col h-full relative justify-center">
            <NavigationButtons
              canGoNext={step < 3}
              canGoBack={step > 1}
              isStepComplete={
                !!(
                  step === 1 &&
                  formData.firstName.trim() &&
                  formData.lastName.trim()
                ) ||
                !!(step === 2 && formData.email.trim() && formData.phone.trim())
              }
              onNext={handleNext}
              onBack={handleBack}
            />

            <StepIndicator currentStep={step} />

            <SignUpForm
              step={step}
              formData={formData}
              loading={loading}
              error={error}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </div>
        </CardVertical>
      </div>
    </BackgroundWrapper>
  );
}
