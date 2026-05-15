// src/hooks/useBooks.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllBooks, searchBooks, getBookById } from "@/lib/api/book";
import type { Book } from "@/lib/types";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllBooks();
      setBooks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const search = useCallback(async (title: string) => {
    if (!title.trim()) return fetchBooks();
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchBooks(title);
      setBooks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBooks]);

  return { books, isLoading, error, refetch: fetchBooks, search };
}

export function useBook(id: number | null) {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getBookById(id)
      .then(setBook)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { book, isLoading, error };
}