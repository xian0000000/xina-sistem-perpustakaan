"use client";

import { useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import type { Booking } from "@/lib/types";
import { PanelHeader, PanelFeedback, LoadingDots, ps } from "@/components/shared/ui";

interface BookingPanelProps {
  onClose: () => void;
  bookId: number;
  bookTitle?: string;
  userName?: string;
}

function statusStyle(status: Booking["status"]) {
  const map = {
    waiting:   { color: "#b07820",       borderColor: "#dda84430", background: "#fdf3e0" },
    active:    { color: "var(--blue)",   borderColor: "#4a7a9b30", background: "var(--blue-l)" },
    done:      { color: "var(--green)",  borderColor: "#5a8a6a30", background: "var(--green-l)" },
    cancelled: { color: "var(--red)",    borderColor: "#c05a4a30", background: "var(--red-l)" },
  } as const;
  return map[status] ?? map.waiting;
}

function statusLabel(s: Booking["status"]) {
  return ({ waiting: "Menunggu", active: "Sedang Dibaca", done: "Selesai", cancelled: "Dibatalkan" })[s] ?? s;
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function diffHours(from: string, until: string): number {
  return (new Date(until).getTime() - new Date(from).getTime()) / (1000 * 60 * 60);
}

function nowDateTimeLocal(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

export function BookingPanel({ onClose, bookId, bookTitle, userName }: BookingPanelProps) {
  const { bookings, isLoading, error, actionError, book, start, finish, cancel } = useBookings();

  const [from, setFrom]               = useState("");
  const [until, setUntil]             = useState("");
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting]   = useState(false);

  function handleFromChange(val: string) {
    setFrom(val);
    if (val) {
      const d = new Date(val);
      d.setHours(d.getHours() + 1);
      setUntil(d.toISOString().slice(0, 16));
    }
    setFormError("");
  }

  async function handleSubmit() {
    setFormError(""); setFormSuccess("");
    if (!from || !until) { setFormError("Jam mulai dan jam selesai wajib diisi."); return; }
    const fromDate  = new Date(from);
    const untilDate = new Date(until);
    const now       = new Date();
    if (fromDate < now)        { setFormError("Jam mulai tidak boleh di masa lalu."); return; }
    if (untilDate <= fromDate) { setFormError("Jam selesai harus setelah jam mulai."); return; }
    const hours = diffHours(from, until);
    if (hours > 3)             { setFormError("Durasi booking maksimal 3 jam."); return; }
    if (hours < 0.25)          { setFormError("Durasi booking minimal 15 menit."); return; }

    setSubmitting(true);
    try {
      await book(bookId, {
        bookedFrom:  fromDate.toISOString(),
        bookedUntil: untilDate.toISOString(),
        userName:    userName,
      });
      setFormSuccess("Booking berhasil dibuat!");
      setFrom(""); setUntil("");
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={ps.wrap}>
      <PanelHeader icon="📋" title="Booking Buku" color="#4a7a9b" onClose={onClose} />
      <p style={ps.tagline}>Reservasi waktu membaca bukumu.</p>

      <div style={{ ...ps.card, marginBottom: 22 }}>
        <div style={ps.sectionLabel}>Buat Booking Baru</div>
        <div style={{ padding: "10px 14px", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Buku: </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {bookTitle ?? `Buku #${bookId}`}
          </span>
        </div>

        {formError   && <PanelFeedback type="error">{formError}</PanelFeedback>}
        {formSuccess && <PanelFeedback type="success">{formSuccess}</PanelFeedback>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={ps.fieldWrap}>
            <label style={ps.fieldLabel}>Mulai</label>
            <input type="datetime-local" value={from} min={nowDateTimeLocal()}
              onChange={e => handleFromChange(e.target.value)} style={ps.input} />
          </div>
          <div style={ps.fieldWrap}>
            <label style={ps.fieldLabel}>Selesai</label>
            <input type="datetime-local" value={until} min={from || nowDateTimeLocal()}
              onChange={e => { setUntil(e.target.value); setFormError(""); }} style={ps.input} />
          </div>
        </div>

        {from && until && new Date(until) > new Date(from) && (
          <div style={{ fontSize: 12, color: diffHours(from, until) > 3 ? "var(--red)" : "var(--green)", marginBottom: 12, fontWeight: 500 }}>
            ⏱ Durasi: {Math.round(diffHours(from, until) * 60)} menit
            {diffHours(from, until) > 3 && " (melebihi batas 3 jam)"}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ ...ps.submitBtn, background: "var(--blue)", opacity: submitting ? 0.65 : 1 }}>
          {submitting ? "···" : "Buat Booking"}
        </button>
      </div>

      <div style={ps.sectionLabel}>Riwayat Booking Saya</div>
      {actionError && <PanelFeedback type="error">{actionError}</PanelFeedback>}
      {isLoading && <LoadingDots />}
      {error && <PanelFeedback type="error">{error}</PanelFeedback>}
      {!isLoading && !error && (
        <>
          {bookings.length === 0 && <p style={ps.empty}>Belum ada booking.</p>}
          {bookings.map(b => (
            <div key={b.id} style={ps.card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={ps.bookTitle}>{b.book ? b.book.title : `Buku #${b.bookId}`}</div>
                <span style={{ ...ps.statusBadge, ...statusStyle(b.status) }}>{statusLabel(b.status)}</span>
              </div>
              <div style={{ ...ps.bookMeta, marginTop: 6 }}>
                📅 {fmtDateTime(b.bookedFrom)} → {fmtDateTime(b.bookedUntil)}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {b.status === "waiting" && (
                  <>
                    <button onClick={() => start(b.id)} style={ps.actionBtn}>Mulai Baca</button>
                    <button onClick={() => cancel(b.id)} style={ps.dangerBtn}>Batalkan</button>
                  </>
                )}
                {b.status === "active" && (
                  <button onClick={() => finish(b.id)} style={{ ...ps.actionBtn, background: "var(--green-l)", borderColor: "var(--green)", color: "var(--green)" }}>
                    Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
