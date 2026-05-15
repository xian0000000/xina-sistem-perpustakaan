"use client";

import { useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import type { Book } from "@/lib/types";
import { PanelHeader, PanelFeedback, LoadingDots, ps } from "@/components/shared/ui";

interface BookshelfPanelProps {
  onClose: () => void;
  onSelectBook: (book: Book) => void;
}

export function BookshelfPanel({ onClose, onSelectBook }: BookshelfPanelProps) {
  const { books, isLoading, error, search } = useBooks();
  const [query, setQuery] = useState("");

  function handleSearch(val: string) { setQuery(val); search(val); }

  return (
    <div style={ps.wrap}>
      <PanelHeader icon="📚" title="Rak Buku" color="#c07840" onClose={onClose} />
      <p style={ps.tagline}>Jelajahi semua koleksi buku yang tersedia.</p>

      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          placeholder="🔍  Cari judul atau penulis…"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          style={ps.input}
        />
      </div>

      {isLoading && <LoadingDots />}
      {error && <PanelFeedback type="error">{error}</PanelFeedback>}

      {!isLoading && !error && (
        <>
          <div style={{ ...ps.bookMeta, marginBottom: 12 }}>{books.length} buku ditemukan</div>
          <div style={ps.grid}>
            {books.map(book => (
              <button key={book.id} onClick={() => onSelectBook(book)}
                style={{ ...ps.bookCard, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 44, height: 62, flexShrink: 0, borderRadius: 6, background: "var(--accent-light)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {book.coverUrl
                      ? <img src={`http://localhost:8082${book.coverUrl}`} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                      : "📖"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <div style={ps.bookTitle}>{book.title}</div>
                    <div style={ps.bookMeta}>{book.author}</div>
                    {book.genre && <div style={{ ...ps.stockBadge, color: "var(--accent)", borderColor: "var(--border)", background: "var(--accent-light)" }}>{book.genre}</div>}
                    {book.description && <div style={ps.bookDesc}>{book.description.slice(0, 70)}{book.description.length > 70 ? "…" : ""}</div>}
                  </div>
                </div>
              </button>
            ))}
            {books.length === 0 && <p style={{ ...ps.empty, gridColumn: "1/-1" }}>Tidak ada buku ditemukan.</p>}
          </div>
        </>
      )}
    </div>
  );
}
