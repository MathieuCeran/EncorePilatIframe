import { ReactNode } from "react";

interface CardVerticalProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export default function CardVertical({
  children,
  className = "",
  title = "",
}: CardVerticalProps) {
  return (
    <div
      className={`w-full max-w-md min-h-[700px] rounded-2xl  p-16 flex flex-col gap-8 relative backdrop-blur-sm ${className}  `}
      style={{
        boxShadow:
          "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)",
      }}
    >
      {title && (
        <h2 className="text-2xl font-aboreto text-center  text-marron tracking-wide">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
