"use client";

import { useState, FormEvent } from "react";
import type { AuthUser } from "@/lib/types";
import { PanelHeader, PanelFeedback, ps } from "@/components/shared/ui";

interface AuthPanelProps {
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

type Mode = "login" | "register";

export function AuthPanel({ onClose, onLogin, login, register }: AuthPanelProps) {
  const [mode, setMode]           = useState<Mode>("login");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function switchMode(m: Mode) { setMode(m); setName(""); setEmail(""); setPassword(""); setError(""); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={ps.wrap}>
      <PanelHeader icon="🚪" title="Masuk / Daftar" color="#c07840" onClose={onClose} />

      <div style={ps.toggleRow}>
        {(["login", "register"] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button key={m} onClick={() => switchMode(m)}
              style={{ ...ps.toggleBtn, color: active ? "var(--text-primary)" : "var(--text-muted)", borderBottomColor: active ? "var(--accent)" : "transparent", fontWeight: active ? 600 : 400 }}>
              {m === "login" ? "Masuk" : "Daftar"}
            </button>
          );
        })}
      </div>

      <p style={ps.tagline}>{mode === "login" ? "Selamat datang kembali! Masukkan data akunmu." : "Buat akun baru dan mulai jelajahi koleksi."}</p>

      {error && <PanelFeedback type="error">{error}</PanelFeedback>}

      <form onSubmit={handleSubmit} style={ps.form}>
        {mode === "register" && (
          <div style={ps.fieldWrap}>
            <label style={ps.fieldLabel}>Nama Lengkap</label>
            <input type="text" placeholder="nama kamu" value={name} onChange={e => setName(e.target.value)} style={ps.input} />
          </div>
        )}
        <div style={ps.fieldWrap}>
          <label style={ps.fieldLabel}>Email</label>
          <input type="email" placeholder="email@contoh.com" value={email} onChange={e => setEmail(e.target.value)} style={ps.input} />
        </div>
        <div style={ps.fieldWrap}>
          <label style={ps.fieldLabel}>Kata Sandi</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={ps.input} />
        </div>
        <button type="submit" disabled={isLoading} style={{ ...ps.submitBtn, opacity: isLoading ? 0.65 : 1 }}>
          {isLoading ? "···" : mode === "login" ? "Masuk" : "Daftar Sekarang"}
        </button>
      </form>

      <p style={ps.switchHint}>
        {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
        <button onClick={() => switchMode(mode === "login" ? "register" : "login")} style={ps.switchLink}>
          {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
        </button>
      </p>
    </div>
  );
}
