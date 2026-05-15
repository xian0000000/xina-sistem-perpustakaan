"use client";

import React, { useState, useEffect, useRef } from "react";
import { getAllUsers, deleteUser, adminUpdateUser } from "@/lib/api/user";
import {
  getAllBooks, createBook, deleteBook,
  getChaptersByBook, createChapter, updateChapter, deleteChapter,
  uploadChapterPdf,
} from "@/lib/api/book";
import { getAccessToken } from "@/lib/auth";
import type { UserProfile, Book, Chapter } from "@/lib/types";
import { PanelHeader, PanelFeedback, LoadingDots, ps } from "@/components/shared/ui";

type Tab = "users" | "books" | "chapters";
interface AdminPanelProps { onClose: () => void; }

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>("users");

  const tabs: { key: Tab; label: string }[] = [
    { key: "users",    label: "Kelola User" },
    { key: "books",    label: "Kelola Buku" },
    { key: "chapters", label: "Isi Buku (Chapter)" },
  ];

  return (
    <div style={ps.wrap}>
      <PanelHeader icon="⚙️" title="Panel Admin" sub="Akses terbatas" color="#c07840" onClose={onClose} />
      <div style={ps.toggleRow}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              ...ps.toggleBtn,
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              borderBottomColor: active ? "var(--accent)" : "transparent",
              fontWeight: active ? 600 : 400,
            }}>
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === "users"    && <UsersTab />}
      {tab === "books"    && <BooksTab />}
      {tab === "chapters" && <ChaptersTab />}
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]         = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    getAllUsers().then(setUsers).catch(e => setError(e.message)).finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Hapus user ini?")) return;
    try { await deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
    catch (e: any) { alert(e.message); }
  }

  async function handleRoleChange(id: number, role: string) {
    try { const updated = await adminUpdateUser(id, { role }); setUsers(prev => prev.map(u => u.id === id ? updated : u)); }
    catch (e: any) { alert(e.message); }
  }

  if (isLoading) return <LoadingDots />;
  if (error) return <PanelFeedback type="error">{error}</PanelFeedback>;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={ps.sectionLabel}>{users.length} user terdaftar</div>
      {users.map(u => (
        <div key={u.id} style={{ ...ps.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            <div style={ps.bookTitle}>{u.name}</div>
            <div style={ps.bookMeta}>{u.email}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, padding: "5px 10px", cursor: "pointer" }}>
              {["member", "librarian", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={() => handleDelete(u.id)} style={ps.dangerBtn}>Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Books Tab ──────────────────────────────────────────────────────────────
function BooksTab() {
  const [books, setBooks]               = useState<Book[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [title, setTitle]               = useState("");
  const [author, setAuthor]             = useState("");
  const [description, setDescription]   = useState("");
  const [genre, setGenre]               = useState("");
  const [cover, setCover]               = useState<File | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState("");

  useEffect(() => {
    getAllBooks().then(setBooks).catch(e => setError(e.message)).finally(() => setIsLoading(false));
  }, []);

  async function handleCreate() {
    if (!title || !author) { setFormError("Judul dan penulis wajib diisi."); return; }
    setSubmitting(true); setFormError("");
    try {
      const book = await createBook({ title, author, description, genre, cover: cover ?? undefined });
      setBooks(prev => [book, ...prev]);
      setShowForm(false); setTitle(""); setAuthor(""); setDescription(""); setGenre(""); setCover(null);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus buku ini?")) return;
    try { await deleteBook(id); setBooks(prev => prev.filter(b => b.id !== id)); }
    catch (e: any) { alert(e.message); }
  }

  if (isLoading) return <LoadingDots />;
  if (error) return <PanelFeedback type="error">{error}</PanelFeedback>;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={ps.sectionLabel}>{books.length} buku</div>
        <button onClick={() => setShowForm(v => !v)} style={ps.actionBtn}>{showForm ? "Batal" : "+ Tambah Buku"}</button>
      </div>

      {showForm && (
        <div style={{ ...ps.card, marginBottom: 18 }}>
          {formError && <PanelFeedback type="error">{formError}</PanelFeedback>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {([["Judul", title, setTitle, "Judul buku"], ["Penulis", author, setAuthor, "Nama penulis"], ["Genre", genre, setGenre, "Fiksi, Sains, dll"]] as const).map(([label, val, setter, ph]) => (
              <div key={label} style={ps.fieldWrap}>
                <label style={ps.fieldLabel}>{label}</label>
                <input value={val} onChange={e => (setter as any)(e.target.value)} placeholder={ph} style={ps.input} />
              </div>
            ))}
            <div style={ps.fieldWrap}>
              <label style={ps.fieldLabel}>Cover</label>
              <input type="file" accept="image/*" onChange={e => setCover(e.target.files?.[0] ?? null)}
                style={{ ...ps.input, fontSize: 12, color: "var(--text-muted)", padding: "7px 12px" }} />
            </div>
          </div>
          <div style={{ ...ps.fieldWrap, marginBottom: 14 }}>
            <label style={ps.fieldLabel}>Deskripsi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi singkat buku…" rows={3}
              style={{ ...ps.input, resize: "none", lineHeight: 1.6 } as any} />
          </div>
          <button onClick={handleCreate} disabled={submitting} style={{ ...ps.submitBtn, opacity: submitting ? 0.65 : 1 }}>
            {submitting ? "···" : "Simpan Buku"}
          </button>
        </div>
      )}

      {books.map(b => (
        <div key={b.id} style={{ ...ps.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <div style={ps.bookTitle}>{b.title}</div>
            <div style={ps.bookMeta}>{b.author}</div>
            {b.genre && <div style={{ ...ps.stockBadge, color: "var(--accent)", borderColor: "var(--border)", background: "var(--accent-light)" }}>{b.genre}</div>}
          </div>
          <button onClick={() => handleDelete(b.id)} style={ps.dangerBtn}>Hapus</button>
        </div>
      ))}
    </div>
  );
}

// ─── Chapters Tab ────────────────────────────────────────────────────────────
// Fitur: pilih buku → lihat daftar bab → tambah / edit / hapus bab
// Field content mendukung markdown-lite: ![alt](url), # heading, **bold**, *italic*
// Atau upload PDF langsung sebagai konten bab
type ChapterMode = "list" | "add" | "edit";
type ContentMode = "manual" | "pdf";

function ChaptersTab() {
  const [books, setBooks]               = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters]         = useState<Chapter[]>([]);
  const [mode, setMode]                 = useState<ChapterMode>("list");
  const [editTarget, setEditTarget]     = useState<Chapter | null>(null);
  const [contentMode, setContentMode]   = useState<ContentMode>("manual");

  // Form fields
  const [chTitle, setChTitle]           = useState("");
  const [chNumber, setChNumber]         = useState("");
  const [chContent, setChContent]       = useState("");
  const [pdfFile, setPdfFile]           = useState<File | null>(null);
  const [pdfUrl, setPdfUrl]             = useState<string | null>(null);

  const [isLoadingBooks, setIsLoadingBooks]       = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [submitting, setSubmitting]               = useState(false);
  const [uploadingPdf, setUploadingPdf]           = useState(false);
  const [error, setError]                         = useState("");
  const [success, setSuccess]                     = useState("");
  const [uploading, setUploading]                 = useState(false);
  const [uploadError, setUploadError]             = useState("");
  const textareaRef                               = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getAllBooks().then(setBooks).catch(e => setError(e.message)).finally(() => setIsLoadingBooks(false));
  }, []);

  // Upload gambar ke backend, insert sintaks markdown ke cursor textarea
  async function handleImageUpload(file: File) {
    if (!selectedBook) return;
    setUploading(true); setUploadError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const token = getAccessToken() ?? "";
      const res = await fetch(
        `http://localhost:8082/books/${selectedBook.id}/chapters/upload-image`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
      );
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Upload gagal"); }
      const { url } = await res.json();
      const alt = file.name.replace(/\.[^.]+$/, "");
      const fullUrl = `http://localhost:8082${url}`;
      const markdown = `\n![${alt}](${fullUrl})\n`;
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart ?? chContent.length;
        const end   = ta.selectionEnd   ?? chContent.length;
        const next  = chContent.slice(0, start) + markdown + chContent.slice(end);
        setChContent(next);
        setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + markdown.length; }, 0);
      } else {
        setChContent(prev => prev + markdown);
      }
    } catch (e: any) { setUploadError(e.message); }
    finally { setUploading(false); }
  }

  async function selectBook(book: Book) {
    setSelectedBook(book);
    setMode("list");
    setError(""); setSuccess("");
    setIsLoadingChapters(true);
    try { setChapters(await getChaptersByBook(book.id)); }
    catch (e: any) { setError(e.message); }
    finally { setIsLoadingChapters(false); }
  }

  function openAdd() {
    setChTitle(""); setChContent(""); setError(""); setSuccess("");
    setPdfFile(null); setPdfUrl(null); setContentMode("manual");
    const maxNum = chapters.reduce((m, c) => Math.max(m, c.chapterNumber), 0);
    setChNumber(String(maxNum + 1));
    setEditTarget(null);
    setMode("add");
  }

  function openEdit(ch: Chapter) {
    setChTitle(ch.title); setChContent(ch.content); setChNumber(String(ch.chapterNumber));
    setPdfFile(null); setPdfUrl(ch.pdfUrl ?? null);
    setContentMode(ch.pdfUrl ? "pdf" : "manual");
    setEditTarget(ch); setError(""); setSuccess(""); setMode("edit");
  }

  async function handleSave() {
    if (!selectedBook) return;
    if (!chTitle.trim()) { setError("Judul bab wajib diisi."); return; }

    setSubmitting(true); setError(""); setSuccess("");
    try {
      let resolvedPdfUrl = pdfUrl;

      // Upload PDF dulu kalau ada file baru
      if (contentMode === "pdf" && pdfFile) {
        setUploadingPdf(true);
        try {
          resolvedPdfUrl = await uploadChapterPdf(selectedBook.id, pdfFile);
        } finally {
          setUploadingPdf(false);
        }
      }

      if (contentMode === "pdf" && !resolvedPdfUrl) {
        setError("Upload PDF terlebih dahulu."); setSubmitting(false); return;
      }
      if (contentMode === "manual" && !chContent.trim()) {
        setError("Isi bab tidak boleh kosong."); setSubmitting(false); return;
      }

      const payload = {
        title: chTitle.trim(),
        chapterNumber: parseInt(chNumber) || 1,
        content: contentMode === "manual" ? chContent : "",
        pdfUrl: contentMode === "pdf" ? resolvedPdfUrl : null,
      };

      if (mode === "add") {
        const created = await createChapter(selectedBook.id, payload);
        setChapters(prev => [...prev, created].sort((a, b) => a.chapterNumber - b.chapterNumber));
        setSuccess(`Bab "${created.title}" berhasil ditambahkan.`);
      } else if (mode === "edit" && editTarget) {
        const updated = await updateChapter(selectedBook.id, editTarget.id, payload);
        setChapters(prev => prev.map(c => c.id === editTarget.id ? updated : c).sort((a, b) => a.chapterNumber - b.chapterNumber));
        setSuccess(`Bab "${updated.title}" berhasil diperbarui.`);
      }
      setMode("list");
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleDeleteChapter(ch: Chapter) {
    if (!selectedBook || !confirm(`Hapus bab "${ch.title}"?`)) return;
    try {
      await deleteChapter(selectedBook.id, ch.id);
      setChapters(prev => prev.filter(c => c.id !== ch.id));
      setSuccess(`Bab "${ch.title}" dihapus.`);
    } catch (e: any) { setError(e.message); }
  }

  if (isLoadingBooks) return <LoadingDots />;

  // — Pilih buku dulu —
  if (!selectedBook) return (
    <div style={{ marginTop: 16 }}>
      {error && <PanelFeedback type="error">{error}</PanelFeedback>}
      <div style={ps.sectionLabel}>Pilih buku yang ingin dikelola isinya</div>
      {books.length === 0 && <p style={ps.empty}>Belum ada buku. Tambah dulu di tab Kelola Buku.</p>}
      {books.map(b => (
        <button key={b.id} onClick={() => selectBook(b)} style={{
          ...ps.card, display: "flex", flexDirection: "column", gap: 4, cursor: "pointer",
          width: "100%", textAlign: "left", transition: "border-color .2s",
          border: "1px solid var(--border)",
        }}>
          <div style={ps.bookTitle}>{b.title}</div>
          <div style={ps.bookMeta}>✍ {b.author}{b.genre ? ` · ${b.genre}` : ""}</div>
        </button>
      ))}
    </div>
  );

  // — Daftar bab & form —
  return (
    <div style={{ marginTop: 16 }}>
      {/* Header buku yang dipilih */}
      <div style={{ ...ps.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, background: "var(--accent-light)", borderColor: "var(--border-med)" }}>
        <div>
          <div style={{ ...ps.bookTitle, color: "var(--accent)" }}>📚 {selectedBook.title}</div>
          <div style={ps.bookMeta}>✍ {selectedBook.author}</div>
        </div>
        <button onClick={() => { setSelectedBook(null); setChapters([]); setMode("list"); setError(""); setSuccess(""); }} style={ps.actionBtn}>
          Ganti Buku
        </button>
      </div>

      {error   && <PanelFeedback type="error">{error}</PanelFeedback>}
      {success && <PanelFeedback type="success">{success}</PanelFeedback>}

      {/* Mode: list */}
      {mode === "list" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={ps.sectionLabel}>{chapters.length} bab</div>
            <button onClick={openAdd} style={ps.actionBtn}>+ Tambah Bab</button>
          </div>
          {isLoadingChapters ? <LoadingDots /> : chapters.length === 0 ? (
            <p style={ps.empty}>Buku ini belum punya bab. Klik "+ Tambah Bab" untuk mulai.</p>
          ) : (
            chapters.map(ch => (
              <div key={ch.id} style={{ ...ps.card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "monospace", background: "var(--border)", padding: "2px 7px", borderRadius: 5 }}>
                      Bab {ch.chapterNumber}
                    </span>
                    <div style={ps.bookTitle}>{ch.title}</div>
                  </div>
                  <div style={{ ...ps.bookMeta, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>
                    {ch.content.replace(/!\[.*?\]\(.*?\)/g, "[gambar]").replace(/#{1,6} /g, "").slice(0, 100)}…
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(ch)} style={ps.actionBtn}>Edit</button>
                  <button onClick={() => handleDeleteChapter(ch)} style={ps.dangerBtn}>Hapus</button>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Mode: add / edit */}
      {(mode === "add" || mode === "edit") && (
        <div style={{ ...ps.card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ ...ps.sectionLabel, marginBottom: 0 }}>
              {mode === "add" ? "✏️ Tambah Bab Baru" : `✏️ Edit: Bab ${editTarget?.chapterNumber}`}
            </div>
            <button onClick={() => { setMode("list"); setError(""); setSuccess(""); }} style={ps.actionBtn}>← Kembali</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={ps.fieldWrap}>
              <label style={ps.fieldLabel}>Judul Bab</label>
              <input value={chTitle} onChange={e => setChTitle(e.target.value)} placeholder="Contoh: Awal Mula Petualangan" style={ps.input} />
            </div>
            <div style={ps.fieldWrap}>
              <label style={ps.fieldLabel}>Nomor Bab</label>
              <input type="number" min={1} value={chNumber} onChange={e => setChNumber(e.target.value)} style={ps.input} />
            </div>
          </div>

          {/* Toggle: Manual vs PDF */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-med)" }}>
            {(["manual", "pdf"] as ContentMode[]).map((m) => (
              <button key={m} onClick={() => { setContentMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "background .2s, color .2s",
                  background: contentMode === m ? "var(--accent)" : "var(--bg-muted)",
                  color: contentMode === m ? "#fff" : "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                }}>
                {m === "manual" ? "✍️ Tulis Manual" : "📄 Upload PDF"}
              </button>
            ))}
          </div>

          {/* Manual mode */}
          {contentMode === "manual" && (
            <div style={ps.fieldWrap}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={ps.fieldLabel}>Isi Bab</label>
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 6, cursor: uploading ? "default" : "pointer",
                  fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 7,
                  border: "1px solid var(--border-med)", background: "var(--accent-light)",
                  color: "var(--accent)", opacity: uploading ? 0.6 : 1, transition: "opacity .15s",
                }}>
                  {uploading ? "⏳ Mengunggah…" : "📎 Upload Gambar"}
                  <input
                    type="file" accept="image/*"
                    style={{ display: "none" }}
                    disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) { handleImageUpload(f); e.target.value = ""; } }}
                  />
                </label>
              </div>
              {uploadError && (
                <div style={{ fontSize: 11, color: "#c04a4a", marginBottom: 6, padding: "5px 10px", background: "rgba(192,74,74,.08)", borderRadius: 6 }}>
                  ⚠ {uploadError}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, lineHeight: 1.6 }}>
                Format: <code style={{ background: "rgba(0,0,0,.12)", padding: "1px 5px", borderRadius: 3 }}>![keterangan](url)</code> gambar &nbsp;·&nbsp;
                <code style={{ background: "rgba(0,0,0,.12)", padding: "1px 5px", borderRadius: 3 }}># Judul</code> &nbsp;·&nbsp;
                <code style={{ background: "rgba(0,0,0,.12)", padding: "1px 5px", borderRadius: 3 }}>**bold**</code> &nbsp;·&nbsp;
                <code style={{ background: "rgba(0,0,0,.12)", padding: "1px 5px", borderRadius: 3 }}>*italic*</code> &nbsp;·&nbsp;
                <code style={{ background: "rgba(0,0,0,.12)", padding: "1px 5px", borderRadius: 3 }}>---</code>
              </div>
              <textarea
                ref={textareaRef}
                value={chContent}
                onChange={e => setChContent(e.target.value)}
                placeholder={"Tulis isi bab di sini...\n\nUpload gambar pakai tombol di atas, atau ketik manual:\n![Keterangan gambar](https://contoh.com/gambar.jpg)\n\nTeks berlanjut setelah gambar."}
                rows={14}
                style={{ ...ps.input, resize: "vertical", lineHeight: 1.7, fontFamily: "monospace", fontSize: 13 } as any}
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {chContent.length.toLocaleString()} karakter
              </div>

              {/* Preview mini */}
              {chContent.trim() && (
                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--accent)", fontWeight: 500, marginBottom: 8 }}>
                    👁 Preview konten
                  </summary>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", background: "var(--bg-muted)" }}>
                    <ChapterPreview content={chContent} />
                  </div>
                </details>
              )}
            </div>
          )}

          {/* PDF mode */}
          {contentMode === "pdf" && (
            <div style={ps.fieldWrap}>
              <label style={ps.fieldLabel}>File PDF</label>
              <div style={{
                border: "2px dashed var(--border-med)", borderRadius: 10, padding: "28px 20px",
                textAlign: "center", background: "var(--bg-muted)", cursor: "pointer", position: "relative",
              }}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-med)"; }}
                onDrop={e => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-med)";
                  const file = e.dataTransfer.files?.[0];
                  if (file?.type === "application/pdf") { setPdfFile(file); setPdfUrl(null); }
                  else { setError("Hanya file PDF yang diizinkan."); }
                }}
              >
                <input
                  type="file" accept="application/pdf"
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setPdfFile(file); setPdfUrl(null); }
                    e.target.value = "";
                  }}
                />
                {pdfFile ? (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{pdfFile.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · Klik untuk ganti
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>PDF sudah di-upload</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Klik untuk ganti dengan file baru</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Drag & drop PDF di sini</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>atau klik untuk pilih file · Maks 50 MB</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={submitting || uploadingPdf}
            style={{ ...ps.submitBtn, marginTop: 16, opacity: (submitting || uploadingPdf) ? 0.65 : 1 }}>
            {uploadingPdf ? "⏳ Mengunggah PDF…" : submitting ? "···" : mode === "add" ? "Simpan Bab" : "Perbarui Bab"}
          </button>
        </div>
      )}
    </div>
  );
}

// Preview ringan untuk konten chapter di admin panel
function ChapterPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];
  let paraLines: string[] = [];
  let key = 0;

  function flushPara() {
    if (paraLines.length) {
      elements.push(<p key={key++} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 10px 0", fontFamily: "Georgia, serif" }}>{paraLines.join(" ")}</p>);
      paraLines = [];
    }
  }

  for (const line of lines) {
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushPara();
      elements.push(
        <div key={key++} style={{ textAlign: "center", margin: "12px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, border: "1px solid var(--border)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          {imgMatch[1] && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>{imgMatch[1]}</div>}
        </div>
      );
      continue;
    }
    if (line.startsWith("# "))  { flushPara(); elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", margin: "12px 0 4px" }}>{line.slice(2)}</div>); continue; }
    if (line.startsWith("## ")) { flushPara(); elements.push(<div key={key++} style={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)", margin: "10px 0 3px" }}>{line.slice(3)}</div>); continue; }
    if (/^---+$/.test(line.trim())) { flushPara(); elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />); continue; }
    if (line.trim() === "") { flushPara(); continue; }
    paraLines.push(line);
  }
  flushPara();
  return <>{elements}</>;
}
