interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentStep === 1
              ? "bg-[#23432b]"
              : currentStep > 1
                ? "bg-marron"
                : "bg-gray-300"
          }`}
        ></div>
        <div
          className={`w-8 h-0.5 transition-colors duration-300 ${
            currentStep > 1 ? "bg-marron" : "bg-gray-300"
          }`}
        ></div>
        <div
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentStep === 2
              ? "bg-[#23432b]"
              : currentStep > 2
                ? "bg-marron"
                : "bg-gray-300"
          }`}
        ></div>
        <div
          className={`w-8 h-0.5 transition-colors duration-300 ${
            currentStep > 2 ? "bg-marron" : "bg-gray-300"
          }`}
        ></div>
        <div
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentStep === 3 ? "bg-marron" : "bg-gray-300"
          }`}
        ></div>
      </div>
    </div>
  );
}
