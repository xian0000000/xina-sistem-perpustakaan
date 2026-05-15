"use client";

import { useState } from "react";
import type { Hotspot as HotspotType } from "@/lib/types";

const ICONS: Record<string, React.ReactNode> = {
  door: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M14 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/>
      <polyline points="10 8 6 12 10 16"/>
      <line x1="6" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  bookshelf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="3" y="3" width="4" height="18" rx="1"/>
      <rect x="9" y="7" width="4" height="14" rx="1"/>
      <rect x="15" y="5" width="4" height="16" rx="1"/>
      <line x1="3" y1="21" x2="19" y2="21"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="10.5" cy="10.5" r="6.5"/>
      <line x1="15.5" y1="15.5" x2="21" y2="21"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="8" cy="14" r="1" fill="currentColor"/>
      <circle cx="12" cy="14" r="1" fill="currentColor"/>
      <circle cx="16" cy="14" r="1" fill="currentColor"/>
      <circle cx="8" cy="18" r="1" fill="currentColor"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M2 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z"/>
      <path d="M12 6s1.5-2 5-2 5 2 5 2v14s-1.5-1-5-1-5 1-5 1V6z"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
    </svg>
  ),
};

interface HotspotProps {
  hotspot: HotspotType;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export function Hotspot({ hotspot, isActive, isLocked, onClick }: HotspotProps) {
  const [hovered, setHovered] = useState(false);
  const icon = hotspot.svgIcon ? ICONS[hotspot.svgIcon] : null;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 whitespace-nowrap text-[10px] tracking-widest uppercase border rounded-sm backdrop-blur-md pointer-events-none z-20"
          style={{
            color: isLocked ? "#57534e" : hotspot.color,
            borderColor: isLocked ? "#44403c40" : `${hotspot.color}40`,
            background: "rgba(12, 10, 9, 0.85)",
          }}
        >
          {isLocked ? "🔒 perlu login" : hotspot.label}
        </div>
      )}

      {isActive && !isLocked && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ background: hotspot.color }}
        />
      )}

      <button
        onClick={isLocked ? undefined : onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={hotspot.label}
        className={`
          relative z-10 w-11 h-11 rounded-full
          flex items-center justify-center border
          transition-all duration-300
          ${isLocked
            ? "opacity-30 cursor-not-allowed border-stone-700/40 bg-stone-950/50"
            : isActive ? "scale-110 cursor-pointer"
            : hovered ? "scale-105 cursor-pointer"
            : "scale-100 cursor-pointer"}
        `}
        style={isLocked ? {} : {
          borderColor: isActive || hovered ? hotspot.color : `${hotspot.color}50`,
          background: isActive ? `${hotspot.color}25` : hovered ? `${hotspot.color}15` : "rgba(12, 10, 9, 0.60)",
          boxShadow: isActive || hovered ? `0 0 20px ${hotspot.color}40, 0 0 0 1px ${hotspot.color}30` : "none",
          color: isActive || hovered ? hotspot.color : "rgba(255,255,255,0.75)",
        }}
      >
        {icon ?? <span className="text-lg leading-none">{hotspot.icon}</span>}
      </button>
    </div>
  );
}
