interface NavigationButtonsProps {
  canGoNext: boolean;
  canGoBack: boolean;
  isStepComplete: boolean;
  onNext: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function NavigationButtons({
  canGoNext,
  canGoBack,
  isStepComplete,
  onNext,
  onBack,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8 pt-2">
      {/* Back button */}
      <div className="w-20">
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 text-[#23432b] hover:text-[#18301e] transition-colors duration-200 group"
            aria-label="Retour"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Next button */}
      <div className="w-20 flex justify-end">
        {canGoNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!isStepComplete}
            className={`flex items-center space-x-2 transition-colors duration-200 group ${
              isStepComplete
                ? "text-[#23432b] hover:text-[#18301e] cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Suivant"
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 ${
                isStepComplete
                  ? "bg-gray-100 group-hover:bg-gray-200"
                  : "bg-gray-50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
