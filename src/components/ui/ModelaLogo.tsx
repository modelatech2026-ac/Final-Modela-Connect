/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface ModelaLogoProps {
  className?: string;
  size?: number | string;
  variant?: "brand" | "white" | "adaptive";
}

export const ModelaLogo: React.FC<ModelaLogoProps> = ({
  className = "w-8 h-8",
  size,
  variant = "adaptive",
}) => {
  const isWhite = variant === "white";
  const leftColor = isWhite ? "fill-white" : "fill-[#38BDF8]";
  const diagonalColor = isWhite ? "fill-white/90" : "fill-[#0284C7]";
  const pillarColor = isWhite ? "fill-white/80" : "fill-[#1D4ED8]";

  const style = size
    ? { width: typeof size === "number" ? `${size}px` : size, height: typeof size === "number" ? `${size}px` : size }
    : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={`${className} shrink-0`}
      style={style}
      aria-label="Modela Connect Logo"
      role="img"
    >
      {/* Shape 1: Left Chevron (Bright Cyan/Sky Blue) */}
      <polygon
        points="18,38 108,110 44,182 18,160"
        className={`${leftColor} transition-colors duration-200`}
      />
      {/* Shape 2: Diagonal Upper-Right Bar (Electric Cobalt/Blue) */}
      <polygon
        points="96,92 180,10 180,54 115,116"
        className={`${diagonalColor} transition-colors duration-200`}
      />
      {/* Shape 3: Lower-Right Vertical Pillar (Deep Royal Blue) */}
      <polygon
        points="138,102 180,64 180,182 138,182"
        className={`${pillarColor} transition-colors duration-200`}
      />
    </svg>
  );
};

export default ModelaLogo;
