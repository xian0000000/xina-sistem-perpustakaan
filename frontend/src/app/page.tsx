"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LibraryScene } from "@/components/scene/LibraryScene";
import { AuthPanel } from "@/components/panels/AuthPanel";
import { BookshelfPanel } from "@/components/panels/BookshelfPanel";
import { BookDetailPanel } from "@/components/panels/BookDetailPanel";
import { BookingPanel } from "@/components/panels/BookingPanel";
import { ReadingPanel } from "@/components/panels/ReadingPanel";
import { AdminPanel } from "@/components/panels/AdminPanel";
import type { PanelId, Book } from "@/lib/types";

export default function Page() {
  const { user, role, isLoading, isAdmin, isMember, login, register, logout } = useAuth();

  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readingBookId, setReadingBookId] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Tutup panel admin otomatis kalau user logout atau role berubah
  useEffect(() => {
    if (activePanel === "admin" && !isAdmin) closePanel();
    if ((activePanel === "booking" || activePanel === "reading") && !user) closePanel();
  }, [user, isAdmin, activePanel]);

  useEffect(() => {
    if (activePanel) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    }
  }, [activePanel]);

  function openPanel(id: PanelId) {
    setActivePanel((prev) => (prev === id ? null : id));
  }

  function closePanel() {
    setActivePanel(null);
    setSelectedBook(null);
    setReadingBookId(null);
  }

  function handleSelectBook(book: Book) {
    setSelectedBook(book);
    setActivePanel("book-detail");
  }

  function handleBookFromDetail(bookId: number) { setActivePanel("booking"); }
  function handleReadFromDetail(bookId: number) { setReadingBookId(bookId); setActivePanel("reading"); }

  function renderPanel() {
    switch (activePanel) {
      case "auth":
        return <AuthPanel onClose={closePanel} onLogin={() => closePanel()} login={login} register={register} />;

      case "bookshelf":
        return <BookshelfPanel onClose={closePanel} onSelectBook={handleSelectBook} />;

      case "book-detail":
        return selectedBook ? (
          <BookDetailPanel bookId={selectedBook.id} role={role} userId={user?.id ?? null} onClose={closePanel} onBook={handleBookFromDetail} onRead={handleReadFromDetail} />
        ) : null;

      case "booking":
        // Guard: harus login
        if (!user || !selectedBook) { closePanel(); return null; }
        return <BookingPanel onClose={closePanel} bookId={selectedBook.id} bookTitle={selectedBook.title} userName={user.name} />;

      case "reading":
        if (!user || !readingBookId) { closePanel(); return null; }
        return <ReadingPanel bookId={readingBookId} bookTitle={selectedBook?.title} userId={user.id} onClose={closePanel} />;

      case "admin":
        // Guard: harus admin atau librarian
        if (!isAdmin) { closePanel(); return null; }
        return <AdminPanel onClose={closePanel} />;

      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: 22, height: 22, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 64px" }}>

        {/* header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
            Sistem Digital
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,5vw,38px)", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.04em", marginBottom: 12 }}>
            Perpustakaan Xina
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ height: 1, width: 40, background: "var(--border-med)" }} />
            <span style={{ color: "var(--accent)", fontSize: 12 }}>✦</span>
            <span style={{ height: 1, width: 40, background: "var(--border-med)" }} />
          </div>
        </div>

        {/* session bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 24 }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                {isAdmin ? "⚙️" : "👤"} {user.name}
              </span>
              <span style={{ color: "var(--border-med)" }}>·</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
                {role}
              </span>
              <span style={{ color: "var(--border-med)" }}>·</span>
              <button
                onClick={async () => { await logout(); closePanel(); }}
                style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                Keluar
              </button>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Klik ikon untuk mulai</span>
          )}
        </div>

        {/* scene */}
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(120,80,40,0.10)" }}>
          <LibraryScene role={role} activeId={activePanel} onHotspotClick={openPanel} />
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          {[{ icon: "", label: "Gunakanlah" }, { icon: "", label: "Buku" }, { icon: "", label: "Dengan Bijak" }].map(l => (
            <span key={l.label} style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              {l.icon} <span>{l.label}</span>
            </span>
          ))}
        </div>

        {/* panel area */}
        <div
          ref={panelRef}
          style={{
            marginTop: 20,
            background: "var(--bg-card)",
            border: activePanel ? "1px solid var(--border)" : "none",
            borderRadius: 12,
            boxShadow: activePanel ? "0 4px 32px rgba(120,80,40,0.08)" : "none",
            overflow: "hidden",
            transition: "max-height .4s cubic-bezier(.4,0,.2,1), opacity .3s ease",
            maxHeight: activePanel ? "960px" : "0px",
            opacity: activePanel ? 1 : 0,
          }}
        >
          {renderPanel()}
        </div>

      </div>
    </main>
  );
}
