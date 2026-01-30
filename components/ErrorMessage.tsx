interface ErrorMessageProps {
  error: string | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div
      className={`flex items-center justify-center text-center text-sm mb-4 mt-4 p-3 pt-2 rounded-lg font-chillax transition-all duration-200 ${
        error ? "text-red-500 bg-red-50 border border-red-200" : "invisible"
      }`}
      style={{ minHeight: 48 }}
    >
      {error || "\u00A0"}
    </div>
  );
}
