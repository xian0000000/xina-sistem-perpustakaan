// src/components/ui/Field.tsx

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-widest uppercase text-stone-500">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-400 tracking-wide">{error}</p>
      )}
    </div>
  );
}