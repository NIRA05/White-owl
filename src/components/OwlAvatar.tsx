import React from "react";
import owlImg from "../assets/images/white_owl_avatar_1787395434065.jpg";

interface OwlAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  className?: string;
  showGlow?: boolean;
  withRing?: boolean;
}

export const OwlAvatar: React.FC<OwlAvatarProps> = ({
  size = "md",
  className = "",
  showGlow = false,
  withRing = false,
}) => {
  const sizeMap = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-24 h-24",
    "2xl": "w-36 h-36",
    hero: "w-44 h-44 md:w-52 md:h-52",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 bg-transparent border-0 outline-none ring-0 shadow-none ${sizeMap[size]} ${
        withRing ? "border border-zinc-700/40" : ""
      } ${showGlow ? "drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]" : ""} ${className}`}
    >
      <img
        src={owlImg}
        alt="White Owl"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain pointer-events-none select-none rounded-2xl transition-all duration-300"
        style={{
          maskImage: "radial-gradient(circle at 50% 50%, black 60%, rgba(0,0,0,0.8) 75%, transparent 98%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 60%, rgba(0,0,0,0.8) 75%, transparent 98%)",
        }}
      />
    </div>
  );
};
