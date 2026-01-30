"use client";

import { useRouter } from "next/navigation";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "filled" | "outlined";
  bgColor?: string; // e.g., 'bg-pink-200'
  textColor?: string; // e.g., 'text-white'
  borderColor?: string; // e.g., 'border-white'
  shadow?: boolean;
  size?: "sm" | "md" | "lg";
  hoverBgColor?: string; // e.g., 'hover:bg-pink-300'
  hoverTextColor?: string; // e.g., 'hover:text-black'
  href?: string;
  disabled?: boolean;
  border?: boolean;
}

const sizeMap = {
  sm: "px-5 py-1.5 text-base",
  md: "px-8 py-2 text-lg",
  lg: "px-10 py-3 text-xl",
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "filled",
  bgColor = "bg-pink-200",
  textColor = "text-white",
  borderColor = "border-white",
  shadow = true,
  size = "md",
  type = "button",
  hoverBgColor,
  hoverTextColor,
  onClick,
  href,
  disabled = false,
  border = false,
  ...rest
}) => {
  const router = useRouter();
  const base = `rounded-full font-medium transition ${sizeMap[size]} hover:cursor-pointer font-chillax text-[13px] ${
    shadow ? "shadow-[4px_4px_16px_0_rgba(0,0,0,0.08)]" : ""
  }`;
  let variantClass = "";
  let hoverClass = "";

  if (variant === "filled") {
    variantClass = `${bgColor} ${textColor}`;
    hoverClass = hoverBgColor || "hover:bg-[var(--color-usebeige)]";
  } else if (variant === "outlined") {
    variantClass = `bg-white/20 backdrop-blur-[7.9px] border ${borderColor} ${textColor}`;
    hoverClass = hoverBgColor || "hover:bg-white/30";
  }
  if (hoverTextColor) {
    hoverClass += ` ${hoverTextColor}`;
  }

  return (
    <button
      className={`${base} ${variantClass} ${hoverClass} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${border ? "border-1" : ""}`.trim()}
      type={type}
      {...rest}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
        if (!e.defaultPrevented && href) {
          router.push(href);
        }
      }}
    >
      {children}
    </button>
  );
};

export default Button;
