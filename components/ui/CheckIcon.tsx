import React from "react";

interface CheckIconProps {
  className?: string;
  width?: number;
  height?: number;
}

const CheckIcon: React.FC<CheckIconProps> = ({
  className = "",
  width = 15,
  height = 14,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 15 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1 7.66665L5 13L14 1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CheckIcon;
