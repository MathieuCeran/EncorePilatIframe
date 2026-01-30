import React from "react";

interface BackgroundWrapperProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
}

export default function BackgroundWrapper({
  children,
  className = "",
  minHeight = "min-h-screen",
}: BackgroundWrapperProps) {
  return (
    <div className={`relative ${minHeight} ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
