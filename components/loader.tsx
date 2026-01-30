import React from "react";

const Loader: React.FC<{ size?: number; color?: string }> = ({
  size = 48,
  color = "var(--color-encoregreen)",
}) => (
  <div className="loader-wrapper">
    <div className="spinner" />
    <style jsx>{`
      .loader-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        background: transparent;
      }
      .spinner {
        width: ${size}px;
        height: ${size}px;
        border: ${size / 8}px solid #e5e7eb;
        border-top: ${size / 8}px solid ${color};
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

export default Loader;
