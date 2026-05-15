// src/lib/types.ts

export type Role = "member" | "admin" | "librarian" | null;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
}

export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string | null;
  genre: string | null;
  coverUrl: string | null;
  status: "ready" | "dibaca";
  readBy: number | null;
  readSince: string | null;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: number;
  bookId: number;
  chapterNumber: number;
  title: string;
  content: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "waiting" | "active" | "done" | "cancelled";

export interface Booking {
  id: number;
  bookId: number;
  userId: number;
  bookedFrom: string;
  bookedUntil: string;
  status: BookingStatus;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  book?: Book;
}

export interface BookScheduleEntry {
  id: number;
  bookId: number;
  userId: number;
  bookedFrom: string;
  bookedUntil: string;
  status: "waiting" | "active";
  user: { id: number; name: string };
}

export interface CreateBookingRequest {
  bookedFrom: string;
  bookedUntil: string;
  userName?: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  description?: string;
  genre?: string;
  cover?: File;
}

export interface CreateChapterRequest {
  title: string;
  chapterNumber: number;
  content?: string;
  pdfUrl?: string | null;
}

export type PanelId =
  | "auth"
  | "bookshelf"
  | "book-detail"
  | "reading"
  | "booking"
  | "admin";

export interface Hotspot {
  id: PanelId;
  label: string;
  icon: string;
  iconImg?: string;
  svgIcon?: string;
  x: number;
  y: number;
  color: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
}
