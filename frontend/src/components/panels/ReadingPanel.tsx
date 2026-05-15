"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { getChaptersByBook, getChapterById, startDirectRead, stopDirectRead, getBookById } from "@/lib/api/book";
import { getMyBookings } from "@/lib/api/book";
import type { Chapter } from "@/lib/types";
import { PanelHeader, PanelFeedback, LoadingDots, ps } from "@/components/shared/ui";

interface ReadingPanelProps {
  bookId: number;
  bookTitle?: string;
  userId: number;
  onClose: () => void;
}

// ─── Rich Content Renderer ─────────────────────────────────────────────────
// Mendukung sintaks dalam field `content` sebuah chapter:
//   Teks biasa               → paragraf (Georgia serif, line-height 1.9)
//   ![alt](url)              → gambar ditampilkan di tengah teks
//   # Judul                  → heading besar
//   ## Sub-judul             → heading kecil
//   ---                      → garis pemisah
//   **teks**                 → bold inline
//   *teks*                   → italic inline

type Segment =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "divider" };

function parseContent(raw: string): Segment[] {
  const lines = raw.split("\n");
  const segments: Segment[] = [];
  let paraBuffer: string[] = [];

  function flushPara() {
    if (paraBuffer.length > 0) {
      const text = paraBuffer.join(" ").trim();
      if (text) segments.push({ type: "paragraph", text });
      paraBuffer = [];
    }
  }

  for (const line of lines) {
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) { flushPara(); segments.push({ type: "image", alt: imgMatch[1], src: imgMatch[2] }); continue; }
    if (line.startsWith("## ")) { flushPara(); segments.push({ type: "h2", text: line.slice(3).trim() }); continue; }
    if (line.startsWith("# "))  { flushPara(); segments.push({ type: "h1", text: line.slice(2).trim() }); continue; }
    if (/^---+$/.test(line.trim())) { flushPara(); segments.push({ type: "divider" }); continue; }
    if (line.trim() === "") { flushPara(); continue; }
    paraBuffer.push(line);
  }
  flushPara();
  return segments;
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|!\[([^\]]*)\]\(([^)]+)\))/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith("**"))
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: "var(--text-primary)" }}>{m[2]}</strong>);
    else if (m[0].startsWith("*"))
      parts.push(<em key={key++}>{m[3]}</em>);
    else if (m[0].startsWith("!"))
      // eslint-disable-next-line @next/next/no-img-element
      parts.push(<img key={key++} src={m[5]} alt={m[4]} style={{ maxHeight: 160, verticalAlign: "middle", borderRadius: 6, margin: "0 4px" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichContent({ content }: { content: string }) {
  const segments = parseContent(content);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {segments.map((seg, i) => {
        if (seg.type === "image") return (
          <figure key={i} style={{ margin: "20px auto", textAlign: "center", maxWidth: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seg.src} alt={seg.alt}
              style={{ maxWidth: "100%", maxHeight: 340, borderRadius: 10, border: "1px solid var(--border)", objectFit: "contain", display: "block", margin: "0 auto", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {seg.alt && <figcaption style={{ marginTop: 7, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{seg.alt}</figcaption>}
          </figure>
        );
        if (seg.type === "h1") return <div key={i} style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "18px 0 6px", lineHeight: 1.3 }}>{renderInline(seg.text)}</div>;
        if (seg.type === "h2") return <div key={i} style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", margin: "14px 0 4px", lineHeight: 1.3 }}>{renderInline(seg.text)}</div>;
        if (seg.type === "divider") return <div key={i} style={{ height: 1, background: "var(--border)", margin: "16px 0", opacity: 0.5 }} />;
        if (!seg.text.trim()) return null;
        return <p key={i} style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9, fontFamily: "Georgia, 'Times New Roman', serif", margin: "0 0 14px 0", textIndent: "1.5em" }}>{renderInline(seg.text)}</p>;
      })}
    </div>
  );
}

// ─── PDF Viewer ────────────────────────────────────────────────────────────
function PdfViewer({ url }: { url: string }) {
  const cleanUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  return (
    <div style={{ height: "70vh", borderRadius: 10, overflow: "hidden" }}>
      <iframe
        src={cleanUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="PDF Viewer"
      />
    </div>
  );
}

// ─── Reading Panel ─────────────────────────────────────────────────────────
export function ReadingPanel({ bookId, bookTitle, userId, onClose }: ReadingPanelProps) {
  const [chapters, setChapters]                 = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter]       = useState<Chapter | null>(null);
  const [isLoadingList, setIsLoadingList]       = useState(true);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [error, setError]                       = useState("");
  const [startError, setStartError]             = useState("");
  const [kickedOut, setKickedOut]               = useState(false);
  const didStartRef = useRef(false);
  const contentRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startDirectRead(bookId)
      .then(() => { didStartRef.current = true; })
      .catch(e => setStartError(e.message));
    return () => {
      if (didStartRef.current) { stopDirectRead(bookId).catch(() => {}); didStartRef.current = false; }
    };
  }, [bookId]);

  const checkBookingStatus = useCallback(async () => {
    if (!didStartRef.current) return;
    try {
      const [book] = await Promise.all([getBookById(bookId), getMyBookings()]);
      if (book.status === "dibaca" && book.readBy !== userId) { didStartRef.current = false; setKickedOut(true); return; }
      const now = new Date();
      const activeBookingOther = await fetch(`/api/books/${bookId}/bookings`).then(r => r.json())
        .then((bookings: any[]) => bookings.find(b => b.status === "waiting" && b.userId !== userId && new Date(b.bookedFrom) <= now && new Date(b.bookedUntil) >= now))
        .catch(() => null);
      if (activeBookingOther) {
        if (didStartRef.current) { await stopDirectRead(bookId).catch(() => {}); didStartRef.current = false; }
        setKickedOut(true);
      }
    } catch { /* silent */ }
  }, [bookId, userId]);

  useEffect(() => {
    const interval = setInterval(checkBookingStatus, 15000);
    return () => clearInterval(interval);
  }, [checkBookingStatus]);

  useEffect(() => {
    setIsLoadingList(true);
    getChaptersByBook(bookId)
      .then(data => { setChapters(data); if (data.length > 0) loadChapter(data[0]); })
      .catch(e => setError(e.message))
      .finally(() => setIsLoadingList(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function loadChapter(ch: Chapter) {
    setIsLoadingChapter(true);
    try {
      const full = await getChapterById(bookId, ch.id);
      setActiveChapter(full);
      setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoadingChapter(false); }
  }

  function handleClose() {
    if (didStartRef.current) { stopDirectRead(bookId).catch(() => {}); didStartRef.current = false; }
    onClose();
  }

  const currentIndex = chapters.findIndex(c => c.id === activeChapter?.id);

  if (startError) return (
    <div style={ps.wrap}>
      <PanelHeader icon="📖" title={bookTitle ?? `Buku #${bookId}`} sub="Sedang membaca" color="#5a8a6a" onClose={onClose} />
      <PanelFeedback type="error">
        {startError === "Book is currently being read"
          ? "Buku ini sedang dibaca orang lain. Coba lagi nanti atau buat booking terlebih dahulu."
          : startError}
      </PanelFeedback>
    </div>
  );

  if (kickedOut) return (
    <div style={ps.wrap}>
      <PanelHeader icon="📖" title={bookTitle ?? `Buku #${bookId}`} sub="Sesi berakhir" color="#c05a4a" onClose={onClose} />
      <PanelFeedback type="error">⏰ Sesi bacamu telah berakhir karena ada pengguna lain yang memiliki jadwal booking aktif.</PanelFeedback>
      <div style={{ marginTop: 16 }}><button onClick={onClose} style={ps.actionBtn}>Tutup</button></div>
    </div>
  );

  return (
    <div style={ps.wrap}>
      <PanelHeader icon="📖" title={bookTitle ?? `Buku #${bookId}`} sub="Sedang membaca" color="#5a8a6a" onClose={handleClose} />
      {error && <PanelFeedback type="error">{error}</PanelFeedback>}
      {isLoadingList ? <LoadingDots /> : (
        <div style={{ display: "flex", gap: 20 }}>

          {/* Sidebar chapter */}
          <div style={{ width: 168, flexShrink: 0, borderRight: "1px solid var(--border)", paddingRight: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={ps.sectionLabel}>Daftar Bab</div>
            {chapters.map(ch => (
              <button key={ch.id} onClick={() => loadChapter(ch)} style={{
                textAlign: "left", padding: "7px 10px", borderRadius: 7, fontSize: 12, cursor: "pointer", transition: "all .15s",
                background: activeChapter?.id === ch.id ? "var(--accent-light)" : "transparent",
                border: activeChapter?.id === ch.id ? "1px solid var(--border-med)" : "1px solid transparent",
                color: activeChapter?.id === ch.id ? "var(--accent)" : "var(--text-muted)",
                fontWeight: activeChapter?.id === ch.id ? 600 : 400,
              }}>
                <span style={{ color: "var(--text-muted)", marginRight: 6, fontSize: 11 }}>{ch.chapterNumber}.</span>{ch.title}
                {ch.pdfUrl && <span style={{ marginLeft: 5, fontSize: 9, background: "rgba(90,138,106,.18)", color: "var(--accent)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PDF</span>}
              </button>
            ))}
            {chapters.length === 0 && <p style={{ ...ps.bookMeta, fontStyle: "italic" }}>Belum ada bab.</p>}
          </div>

          {/* Konten bab */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoadingChapter ? <LoadingDots /> : activeChapter ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={ps.sectionLabel}>Bab {activeChapter.chapterNumber}</div>
                  <div style={{ ...ps.bookTitle, fontSize: 16 }}>{activeChapter.title}</div>
                </div>

                {/* Konten: PDF atau rich-text */}
                {activeChapter.pdfUrl ? (
                  <PdfViewer url={activeChapter.pdfUrl} />
                ) : (
                  <div ref={contentRef} style={{ maxHeight: 390, overflowY: "auto", paddingRight: 6, paddingBottom: 4 }}>
                    <RichContent content={activeChapter.content} />
                  </div>
                )}

                {/* Hint format */}
                {/* <div style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  💡 Tip penulisan: <code style={{ background: "rgba(0,0,0,.15)", padding: "1px 5px", borderRadius: 4 }}>![keterangan](url)</code> untuk gambar &nbsp;·&nbsp;
                  <code style={{ background: "rgba(0,0,0,.15)", padding: "1px 5px", borderRadius: 4 }}># Judul</code> untuk heading &nbsp;·&nbsp;
                  <code style={{ background: "rgba(0,0,0,.15)", padding: "1px 5px", borderRadius: 4 }}>**bold**</code>
                </div> */}

                {/* Navigasi */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <button disabled={currentIndex <= 0} onClick={() => loadChapter(chapters[currentIndex - 1])}
                    style={{ ...ps.actionBtn, opacity: currentIndex <= 0 ? 0.35 : 1, cursor: currentIndex <= 0 ? "default" : "pointer" }}>
                    ← Sebelumnya
                  </button>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{currentIndex + 1} / {chapters.length}</span>
                  <button disabled={currentIndex >= chapters.length - 1} onClick={() => loadChapter(chapters[currentIndex + 1])}
                    style={{ ...ps.actionBtn, opacity: currentIndex >= chapters.length - 1 ? 0.35 : 1, cursor: currentIndex >= chapters.length - 1 ? "default" : "pointer" }}>
                    Selanjutnya →
                  </button>
                </div>
              </div>
            ) : (
              <p style={ps.empty}>Pilih bab untuk mulai membaca.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
