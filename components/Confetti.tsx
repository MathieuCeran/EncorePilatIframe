"use client";

import React, { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  animationDuration: number;
  animationDelay: number;
}

const Confetti = () => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // Créer des confettis aléatoires
    const colors = [
      "#FF6B6B", // Rouge
      "#4ECDC4", // Turquoise
      "#45B7D1", // Bleu
      "#96CEB4", // Vert
      "#FFEAA7", // Jaune
      "#DDA0DD", // Violet
      "#FFB347", // Orange
      "#87CEEB", // Bleu ciel
    ];

    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        animationDuration: Math.random() * 3 + 2,
        animationDelay: Math.random() * 2,
      });
    }
    setConfetti(pieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `fall ${piece.animationDuration}s ${piece.animationDelay}s infinite linear`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
