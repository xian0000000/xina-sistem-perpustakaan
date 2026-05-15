// src/components/ui/Input.tsx

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = "", ...props }: InputProps) {
  return (
    <input
      className={`
        w-full bg-transparent
        border-b py-2 px-0
        text-sm text-stone-200 placeholder:text-stone-600
        outline-none transition-colors duration-200
        ${error
          ? "border-red-700 focus:border-red-500"
          : "border-stone-700 focus:border-amber-700"
        }
        ${className}
      `}
      {...props}
    />
  );
}