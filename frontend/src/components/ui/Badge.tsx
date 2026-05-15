// src/components/ui/Badge.tsx

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variants = {
  default: "bg-stone-800/60 text-stone-400 border-stone-700/40",
  success: "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",
  warning: "bg-amber-900/30 text-amber-400 border-amber-800/40",
  danger:  "bg-red-900/30 text-red-400 border-red-800/40",
  info:    "bg-sky-900/30 text-sky-400 border-sky-800/40",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5
      text-[10px] tracking-widest uppercase
      border rounded-sm font-medium
      ${variants[variant]}
    `}>
      {children}
    </span>
  );
}