// src/components/ui/Feedback.tsx

interface FeedbackProps {
  type: "error" | "success" | "info";
  children: React.ReactNode;
}

const styles = {
  error:   "bg-red-900/20 border-red-800/40 text-red-400",
  success: "bg-emerald-900/20 border-emerald-800/40 text-emerald-400",
  info:    "bg-sky-900/20 border-sky-800/40 text-sky-400",
};

const icons = {
  error:   "✕",
  success: "✓",
  info:    "i",
};

export function Feedback({ type, children }: FeedbackProps) {
  return (
    <div className={`
      flex items-start gap-3 px-4 py-3
      border rounded-sm text-xs tracking-wide
      ${styles[type]}
    `}>
      <span className="font-bold mt-0.5">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}