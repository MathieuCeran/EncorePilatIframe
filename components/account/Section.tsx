"use client";

import React, { useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  leftMenu?: Array<{ key: string; label: string; onClick: () => void }>;
};

export default function Section({ title, children, leftMenu }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {leftMenu && leftMenu.length > 0 && (
            <button
              aria-label="Ouvrir le menu"
              onClick={() => setOpen((v) => !v)}
              className="rounded-full border border-gray-300 w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <span className="rotate-180">➜</span>
            </button>
          )}
          <h3 className="font-chillax text-gray-800 text-lg">{title}</h3>
        </div>
        {/* right placeholder for future controls */}
      </div>
      {open && leftMenu && (
        <div className="flex gap-2 mb-3">
          {leftMenu.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
