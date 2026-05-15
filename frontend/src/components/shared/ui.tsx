"use client";
import { CSSProperties, ReactNode } from "react";

export function PanelHeader({
  icon, title, sub, color, onClose,
}: { icon: string; title: string; sub?: string; color: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, letterSpacing: "0.01em", color: "var(--text-primary)" }}>{title}</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      <button onClick={onClose} style={ps.closeBtn}>✕</button>
    </div>
  );
}

export function PanelFeedback({ type, children }: { type: "error" | "success" | "info"; children: ReactNode }) {
  const styles: Record<string, CSSProperties> = {
    error:   { borderColor: "var(--red)",   color: "var(--red)",   background: "var(--red-l)" },
    success: { borderColor: "var(--green)", color: "var(--green)", background: "var(--green-l)" },
    info:    { borderColor: "var(--blue)",  color: "var(--blue)",  background: "var(--blue-l)" },
  };
  const s = styles[type] ?? styles.info;
  return (
    <div style={{ border: "1px solid", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14, ...s }}>
      {type === "error" ? "⚠ " : type === "success" ? "✓ " : "ℹ "}{children}
    </div>
  );
}

export function LoadingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "24px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border-med)", display: "inline-block", animation: `bounce .9s ease-in-out ${i * 0.15}s infinite alternate` }} />
      ))}
      <style>{`@keyframes bounce { from { transform: translateY(0); opacity:.4; } to { transform: translateY(-6px); opacity:1; } }`}</style>
    </div>
  );
}

export const ps: Record<string, CSSProperties> = {
  wrap:        { padding: "28px 28px 20px" },
  toggleRow:   { display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 18 },
  toggleBtn:   { background: "transparent", border: "none", borderBottom: "2px solid transparent", padding: "6px 18px 10px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", transition: "color .2s, border-color .2s", marginBottom: -1 },
  tagline:     { fontSize: 13, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 },
  form:        { display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 },
  fieldWrap:   { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel:  { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-secondary)", textTransform: "uppercase" },
  input:       { background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%", transition: "border-color .2s" },
  submitBtn:   { marginTop: 4, padding: "10px 24px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", transition: "background .2s" },
  closeBtn:    { background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s" },
  switchHint:  { fontSize: 13, color: "var(--text-muted)", textAlign: "center" },
  switchLink:  { background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", textDecoration: "underline", textDecorationColor: "var(--accent-light)", padding: 0, fontWeight: 500 },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12 },
  bookCard:    { background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, transition: "border-color .2s" },
  bookTitle:   { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 },
  bookMeta:    { fontSize: 12, color: "var(--text-muted)" },
  bookDesc:    { fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 },
  stockBadge:  { fontSize: 11, fontWeight: 600, border: "1px solid", borderRadius: 6, padding: "2px 8px", alignSelf: "flex-start", marginTop: 2 },
  empty:       { color: "var(--text-muted)", fontStyle: "italic", fontSize: 13, textAlign: "center", padding: "24px 0" },
  card:        { background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 },
  statusBadge: { fontSize: 11, fontWeight: 600, border: "1px solid", borderRadius: 6, padding: "2px 8px" },
  logoutBtn:   { background: "var(--red-l)", border: "1px solid var(--red)", borderRadius: 8, color: "var(--red)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, padding: "9px 18px", cursor: "pointer", width: "100%", marginTop: 8 },
  sectionLabel:{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 },
  actionBtn:   { padding: "7px 16px", background: "var(--accent-light)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--accent)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background .2s" },
  dangerBtn:   { padding: "7px 16px", background: "var(--red-l)", border: "1px solid var(--red)", borderRadius: 8, color: "var(--red)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer" },
};
