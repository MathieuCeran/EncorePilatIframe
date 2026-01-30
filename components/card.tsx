import React from "react";

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  padding?: string;
  title?: string;
  scrollable?: boolean;
  maxHeight?: string;
  fixedHeader?: boolean;
  shadow?: boolean;
  bgColor?: string;
}

export default function Card({
  children,
  className = "",
  padding = "",
  title,
  scrollable = false,
  maxHeight,
  fixedHeader = false,
  shadow = true,
  bgColor = "bg-white/30",
}: CardProps) {
  return (
    <div
      className={`${bgColor} rounded-3xl ${padding} ${className} ${
        shadow ? "shadow-[4px_4px_16px_0_rgba(0,0,0,0.08)]" : ""
      } ${scrollable ? "flex flex-col" : ""}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {title && (
        <div className={`mb-8 ${fixedHeader ? "flex-shrink-0" : ""}`}>
          <h2 className="text-2xl text-blackmb-8 font-aboreto">{title}</h2>
        </div>
      )}
      <div className={scrollable ? "flex-1 overflow-y-auto min-h-0" : ""}>
        {children}
      </div>
    </div>
  );
}
