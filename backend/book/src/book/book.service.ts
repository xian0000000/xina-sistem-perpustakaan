import * as bookRepo from './book.repository';
import * as bookingRepo from '../booking/booking.repository';
import fs from 'fs';
import path from 'path';

export const getAllBooks = () => {
  return bookRepo.findAllBooks();
};

export const getBookById = (id: number) => {
  return bookRepo.findBookById(id);
};

export const searchBooks = (title: string) => {
  return bookRepo.searchBooksByTitle(title);
};

export const createBook = (data: {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
}) => {
  return bookRepo.createBook(data);
};

export const updateBook = async (id: number, data: {
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
}) => {
  const book = await bookRepo.findBookById(id);
  if (!book) throw new Error('Book not found');
  return bookRepo.updateBook(id, data);
};

export const startDirectRead = async (bookId: number, userId: number) => {
  const book = await bookRepo.findBookById(bookId);
  if (!book) throw new Error('Book not found');

  // Kalau buku sedang dibaca oleh user yang sama, izinkan masuk lagi
  if (book.status === 'dibaca' && book.readBy === userId) return book;

  // Kalau sedang dibaca orang lain, tolak
  if (book.status === 'dibaca' && book.readBy !== userId) {
    throw new Error('Book is currently being read');
  }

  return bookRepo.updateBook(bookId, {
    status: 'dibaca',
    readBy: userId,
    readSince: new Date(),
  });
};

export const stopDirectRead = async (bookId: number, userId: number) => {
  const book = await bookRepo.findBookById(bookId);
  if (!book) throw new Error('Book not found');
  if (book.readBy !== userId) throw new Error('Forbidden');

  // Jangan lepas buku kalau user masih punya booking aktif yang belum habis.
  // Buku baru boleh dilepas via finishReading (booking selesai) atau
  // saat waktu booking sudah expire.
  const activeBooking = await bookingRepo.findActiveBookingByUserAndBook(userId, bookId);
  if (activeBooking) {
    // Booking masih berlaku — buku tetap terkunci ke user ini, tidak dilepas
    return book;
  }

  return bookRepo.updateBook(bookId, {
    status: 'ready',
    readBy: null,
    readSince: null,
  });
};

export const deleteBook = async (id: number) => {
  const book = await bookRepo.findBookById(id);
  if (!book) throw new Error('Book not found');

  // hapus folder uploads buku sekalian
  const bookFolder = path.join(__dirname, '..', '..', 'uploads', 'books', String(id));
  if (fs.existsSync(bookFolder)) {
    fs.rmSync(bookFolder, { recursive: true, force: true });
  }

  return bookRepo.deleteBook(id);
};