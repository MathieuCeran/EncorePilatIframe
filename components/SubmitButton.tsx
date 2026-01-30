interface SubmitButtonProps {
  loading: boolean;
  text?: string;
  className?: string;
}

export function SubmitButton({
  loading,
  text,
  className = "",
}: SubmitButtonProps) {
  if (text) {
    return (
      <div className="flex justify-center mb-6">
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-full bg-encoregreen shadow-lg hover:bg-encoregreen/80 transition-all duration-200 text-white text-lg font-ttdrugs disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${className}`}
          aria-label={text}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Envoi en cours...
            </div>
          ) : (
            text
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6">
      <button
        type="submit"
        disabled={loading}
        className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-encoregreen shadow-lg hover:bg-encoregreen/80 transition-all duration-200 text-white text-xl md:text-2xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        aria-label="Créer le compte"
      >
        {loading ? (
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
