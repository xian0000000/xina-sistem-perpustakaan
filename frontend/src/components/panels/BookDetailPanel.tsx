"use client";

import { useState, useEffect } from "react";
import { useBook } from "@/hooks/useBooks";
import { getBookSchedule } from "@/lib/api/book";
import type { Role, BookScheduleEntry } from "@/lib/types";
import { PanelHeader, PanelFeedback, LoadingDots, ps } from "@/components/shared/ui";

interface BookDetailPanelProps {
  bookId: number;
  role: Role;
  userId?: number | null;
  onClose: () => void;
  onBook: (bookId: number) => void;
  onRead: (bookId: number) => void;
}

export function BookDetailPanel({ bookId, role, userId, onClose, onBook, onRead }: BookDetailPanelProps) {
  const { book, isLoading, error } = useBook(bookId);
  const [schedule, setSchedule] = useState<BookScheduleEntry[]>([]);

  useEffect(() => {
    getBookSchedule(bookId).then(setSchedule).catch(() => {});
  }, [bookId]);

  function fmtTime(s: string) {
    return new Date(s).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div style={ps.wrap}>
      <PanelHeader icon="🔍" title="Detail Buku" color="#5a8a6a" onClose={onClose} />

      {isLoading && <LoadingDots />}
      {error && <PanelFeedback type="error">{error}</PanelFeedback>}

      {book && !isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <div style={{ ...ps.bookCard, flexDirection: "row", gap: 18 }}>
            <div style={{ width: 80, height: 108, flexShrink: 0, borderRadius: 8, background: "var(--accent-light)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
              {book.coverUrl
                ? <img src={`http://localhost:8082${book.coverUrl}`} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                : "📖"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ ...ps.bookTitle, fontSize: 18 }}>{book.title}</div>
              <div style={ps.bookMeta}>{book.author}</div>
              {book.genre && <div style={{ ...ps.stockBadge, color: "var(--green)", borderColor: "var(--green)", background: "var(--green-l)" }}>{book.genre}</div>}

              {/* Status buku */}
              {book.status === "dibaca" && book.readBy !== userId ? (
                <div style={{ ...ps.stockBadge, color: "var(--red)", borderColor: "var(--red)", background: "var(--red-l)", fontWeight: 600 }}>
                  🔴 Sedang Dibaca
                </div>
              ) : book.status === "dibaca" && book.readBy === userId ? (
                <div style={{ ...ps.stockBadge, color: "var(--blue)", borderColor: "var(--blue)", background: "var(--blue-l)", fontWeight: 600 }}>
                  📖 Kamu Sedang Membaca
                </div>
              ) : (
                <div style={{ ...ps.stockBadge, color: "var(--green)", borderColor: "var(--green)", background: "var(--green-l)", fontWeight: 600 }}>
                  🟢 Tersedia
                </div>
              )}

              {book.description && <div style={ps.bookDesc}>{book.description}</div>}
            </div>
          </div>

          {book.chapters && book.chapters.length > 0 && (
            <div>
              <div style={ps.sectionLabel}>{book.chapters.length} Bab</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {book.chapters.map(ch => (
                  <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 14px", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ ...ps.bookMeta, width: 22, textAlign: "right", flexShrink: 0 }}>{ch.chapterNumber}</span>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ch.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role ? (
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              {book.status === "dibaca" && book.readBy !== userId && (
                <PanelFeedback type="info">⚠️ Buku ini sedang dibaca orang lain. Kamu tetap bisa booking untuk jadwal lain.</PanelFeedback>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => onBook(book.id)} style={{ ...ps.submitBtn, width: "auto", padding: "9px 22px" }}>
                  📋 Booking Buku
                </button>
                <button
                  onClick={() => onRead(book.id)}
                  disabled={book.status === "dibaca" && book.readBy !== userId}
                  style={{ ...ps.actionBtn, opacity: (book.status === "dibaca" && book.readBy !== userId) ? 0.4 : 1, cursor: (book.status === "dibaca" && book.readBy !== userId) ? "not-allowed" : "pointer" }}
                >
                  📖 Baca Sekarang
                </button>
              </div>
            </div>
          ) : (
            <PanelFeedback type="info">Login terlebih dahulu untuk booking atau membaca buku ini.</PanelFeedback>
          )}

          {/* Jadwal Booking */}
          {schedule.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={ps.sectionLabel}>📅 Jadwal Booking Buku Ini</div>
              {schedule.map(s => (
                <div key={s.id} style={{ ...ps.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>👤 {s.user.name}</div>
                    <div style={ps.bookMeta}>{fmtTime(s.bookedFrom)} → {fmtTime(s.bookedUntil)}</div>
                  </div>
                  <span style={{
                    ...ps.statusBadge,
                    color: s.status === "active" ? "var(--blue)" : "#b07820",
                    background: s.status === "active" ? "var(--blue-l)" : "#fdf3e0",
                    borderColor: s.status === "active" ? "#4a7a9b30" : "#dda84430",
                    fontWeight: 600,
                  }}>
                    {s.status === "active" ? "Sedang Dibaca" : "Terjadwal"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
