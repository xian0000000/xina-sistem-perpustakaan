// src/lib/api/book.ts

import { authHeader } from "@/lib/auth";
import type {
  Book,
  Chapter,
  Booking,
  BookScheduleEntry,
  CreateBookRequest,
  CreateBookingRequest,
  CreateChapterRequest,
} from "@/lib/types";

const BOOK_URL = "http://localhost:8082";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BOOK_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request gagal: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── books ────────────────────────────────────────────────────────────────────
export function getAllBooks(): Promise<Book[]> {
  return request("/books");
}

export function searchBooks(title: string): Promise<Book[]> {
  return request(`/books/search?title=${encodeURIComponent(title)}`);
}

export function getBookById(id: number): Promise<Book> {
  return request(`/books/${id}`);
}

export function createBook(data: CreateBookRequest): Promise<Book> {
  const form = new FormData();
  form.append("title", data.title);
  form.append("author", data.author);
  if (data.description) form.append("description", data.description);
  if (data.genre) form.append("genre", data.genre);
  if (data.cover) form.append("cover", data.cover);

  // FormData — jangan set Content-Type, browser auto set boundary
  return fetch(`${BOOK_URL}/books`, {
    method: "POST",
    headers: { ...authHeader() },
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal membuat buku");
    }
    return res.json();
  });
}

export function updateBook(id: number, data: Partial<CreateBookRequest>): Promise<Book> {
  const form = new FormData();
  if (data.title) form.append("title", data.title);
  if (data.author) form.append("author", data.author);
  if (data.description) form.append("description", data.description);
  if (data.genre) form.append("genre", data.genre);
  if (data.cover) form.append("cover", data.cover);

  return fetch(`${BOOK_URL}/books/${id}`, {
    method: "PUT",
    headers: { ...authHeader() },
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal update buku");
    }
    return res.json();
  });
}

export function deleteBook(id: number): Promise<void> {
  return request(`/books/${id}`, { method: "DELETE" });
}

// ─── chapters ─────────────────────────────────────────────────────────────────
export function getChaptersByBook(bookId: number): Promise<Chapter[]> {
  return request(`/books/${bookId}/chapters`);
}

export function getChapterById(bookId: number, chapterId: number): Promise<Chapter> {
  return request(`/books/${bookId}/chapters/${chapterId}`);
}

export function createChapter(bookId: number, data: CreateChapterRequest): Promise<Chapter> {
  return request(`/books/${bookId}/chapters`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateChapter(bookId: number, chapterId: number, data: Partial<CreateChapterRequest>): Promise<Chapter> {
  return request(`/books/${bookId}/chapters/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadChapterPdf(bookId: number, file: File): Promise<string> {
  const form = new FormData();
  form.append("pdf", file);
  const { getAccessToken } = await import("@/lib/auth");
  const token = getAccessToken() ?? "";
  const res = await fetch(`${BOOK_URL}/books/${bookId}/chapters/upload-pdf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload PDF gagal");
  }
  const { url } = await res.json();
  return `${BOOK_URL}${url}`;
}

export function deleteChapter(bookId: number, chapterId: number): Promise<void> {
  return request(`/books/${bookId}/chapters/${chapterId}`, { method: "DELETE" });
}

// ─── bookings ─────────────────────────────────────────────────────────────────
export function getMyBookings(): Promise<Booking[]> {
  return request("/books/bookings/me");
}

export function getBookingsByBook(bookId: number): Promise<Booking[]> {
  return request(`/books/${bookId}/bookings`);
}

export function createBooking(bookId: number, data: CreateBookingRequest): Promise<Booking> {
  return request(`/books/${bookId}/bookings`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function startReading(bookingId: number): Promise<Booking> {
  return request(`/books/bookings/${bookingId}/start`, { method: "PATCH" });
}

export function finishReading(bookingId: number): Promise<Booking> {
  return request(`/books/bookings/${bookingId}/finish`, { method: "PATCH" });
}

export function cancelBooking(bookingId: number): Promise<void> {
  return request(`/books/bookings/${bookingId}`, { method: "DELETE" });
}
// ─── direct read ──────────────────────────────────────────────────────────────
export function startDirectRead(bookId: number): Promise<Book> {
  return request(`/books/${bookId}/read/start`, { method: "PATCH" });
}

export function stopDirectRead(bookId: number): Promise<Book> {
  return request(`/books/${bookId}/read/stop`, { method: "PATCH" });
}

// ─── jadwal booking publik ────────────────────────────────────────────────────
export async function getBookSchedule(bookId: number): Promise<BookScheduleEntry[]> {
  const res = await fetch(`${BOOK_URL}/books/${bookId}/bookings/schedule`);
  if (!res.ok) return [];
  return res.json();
}
