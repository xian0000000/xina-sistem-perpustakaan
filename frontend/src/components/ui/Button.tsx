// src/components/ui/Button.tsx

"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center font-medium tracking-widest
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    border uppercase text-xs
  `;

  const variants = {
    primary: "bg-amber-900/30 border-amber-700/50 text-amber-200 hover:bg-amber-800/50 hover:border-amber-600",
    ghost:   "bg-transparent border-stone-700/40 text-stone-400 hover:border-stone-500 hover:text-stone-200",
    danger:  "bg-red-900/20 border-red-800/40 text-red-400 hover:bg-red-900/40 hover:border-red-700",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2",
    lg: "px-7 py-3",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          memuat…
        </span>
      ) : children}
    </button>
  );
}