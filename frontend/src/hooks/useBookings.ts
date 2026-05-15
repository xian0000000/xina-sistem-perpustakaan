// src/hooks/useBookings.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMyBookings,
  createBooking,
  startReading,
  finishReading,
  cancelBooking,
} from "@/lib/api/book";
import type { Booking, CreateBookingRequest } from "@/lib/types";

export function useBookings() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const book = useCallback(async (bookId: number, data: CreateBookingRequest) => {
    setActionError(null);
    try {
      const booking = await createBooking(bookId, data);
      setBookings((prev) => [booking, ...prev]);
      return booking;
    } catch (e: any) {
      setActionError(e.message);
      throw e;
    }
  }, []);

  const start = useCallback(async (bookingId: number) => {
    setActionError(null);
    try {
      const updated = await startReading(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch (e: any) {
      const msg = e.message === "Booking time has not started yet"
        ? "Belum waktunya — booking kamu belum dimulai."
        : e.message === "Book is currently being read"
        ? "Buku sedang dibaca orang lain. Tunggu sebentar."
        : e.message === "Booking time has expired"
        ? "Waktu booking sudah habis."
        : e.message;
      setActionError(msg);
    }
  }, []);

  const finish = useCallback(async (bookingId: number) => {
    setActionError(null);
    try {
      const updated = await finishReading(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch (e: any) {
      setActionError(e.message);
    }
  }, []);

  const cancel = useCallback(async (bookingId: number) => {
    setActionError(null);
    try {
      await cancelBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (e: any) {
      setActionError(e.message);
    }
  }, []);

  return { bookings, isLoading, error, actionError, refetch: fetchBookings, book, start, finish, cancel };
}
