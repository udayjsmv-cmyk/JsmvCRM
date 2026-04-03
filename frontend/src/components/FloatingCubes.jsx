// src/components/FloatingCubes.jsx
import React from "react";

const NUM_CUBES = 20;

const FloatingCubes = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ perspective: 800, zIndex: 0 }}
    >
      {[...Array(NUM_CUBES)].map((_, i) => {
        // Random position, size, and animation delay
        const top = 20 + Math.random() * 60 + "%";
        const left = 20 + Math.random() * 60 + "%";
        const size = 20 + Math.random() * 40;
        const delay = i * 0.3;

        return (
          <div
            key={i}
            className="rounded-lg opacity-25 shadow-[0_0_10px_rgba(255,0,255,0.7)]"
            style={{
              position: "absolute",
              top,
              left,
              width: size,
              height: size,
              background: "linear-gradient(135deg, #7F00FF, #00DBDE, #FC00FF, #00C9FF)", // purple to blue-pink gradient
              transformStyle: "preserve-3d",
              animation: `floatRotate 10s linear infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingCubes;
