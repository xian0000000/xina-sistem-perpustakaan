import * as bookingRepo from './booking.repository';
import * as bookRepo from '../book/book.repository';

// Jadwal booking publik — untuk ditampilkan di detail buku
export const getBookSchedule = async (bookId: number) => {
  const book = await bookRepo.findBookById(bookId);
  if (!book) throw new Error('Book not found');
  const bookings = await bookingRepo.findUpcomingBookingsByBookId(bookId);
  // Map ke format BookScheduleEntry yang diharapkan frontend
  return bookings.map(b => ({
    id: b.id,
    bookId: b.bookId,
    userId: b.userId,
    bookedFrom: b.bookedFrom,
    bookedUntil: b.bookedUntil,
    status: b.status,
    user: { id: b.userId, name: b.userName || `User #${b.userId}` },
  }));
};

export const getBookingsByBookId = async (bookId: number) => {
  const book = await bookRepo.findBookById(bookId);
  if (!book) throw new Error('Book not found');
  return bookingRepo.findBookingsByBookId(bookId);
};

export const getMyBookings = (userId: number) => {
  return bookingRepo.findBookingsByUserId(userId);
};

export const createBooking = async (data: {
  bookId: number;
  userId: number;
  userName: string;
  bookedFrom: Date;
  bookedUntil: Date;
}) => {
  const book = await bookRepo.findBookById(data.bookId);
  if (!book) throw new Error('Book not found');

  if (data.bookedFrom >= data.bookedUntil) {
    throw new Error('bookedFrom must be before bookedUntil');
  }

  const overlap = await bookingRepo.findOverlappingBooking(
    data.bookId,
    data.bookedFrom,
    data.bookedUntil
  );
  if (overlap) throw new Error('Book is already booked on that time');

  return bookingRepo.createBooking(data);
};

export const cancelBooking = async (bookingId: number, userId: number, role: string) => {
  const booking = await bookingRepo.findBookingById(bookingId);
  if (!booking) throw new Error('Booking not found');

  if (booking.userId !== userId && role !== 'admin' && role !== 'librarian') {
    throw new Error('Forbidden');
  }

  if (booking.status === 'done') {
    throw new Error('Cannot cancel a finished booking');
  }

  if (booking.status === 'active') {
    await bookRepo.updateBook(booking.bookId, {
      status: 'ready',
      readBy: null,
      readSince: null,
    });
  }

  return bookingRepo.updateBookingStatus(bookingId, 'cancelled');
};

export const startReading = async (bookingId: number, userId: number) => {
  const booking = await bookingRepo.findBookingById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (booking.status !== 'waiting') throw new Error('Booking is not in waiting status');

  const now = new Date();
  if (now < booking.bookedFrom) throw new Error('Booking time has not started yet');
  if (now > booking.bookedUntil) throw new Error('Booking time has expired');

  const book = await bookRepo.findBookById(booking.bookId);
  if (!book) throw new Error('Book not found');

  // Kalau buku sedang dibaca orang LAIN — kick, pemegang booking prioritas
  if (book.status === 'dibaca' && book.readBy !== userId) {
    await bookRepo.updateBook(booking.bookId, {
      status: 'dibaca',
      readBy: userId,
      readSince: now,
    });
    return bookingRepo.updateBookingStatus(bookingId, 'active');
  }

  // Kalau sudah user ini yang baca, cukup update status booking
  if (book.status === 'dibaca' && book.readBy === userId) {
    return bookingRepo.updateBookingStatus(bookingId, 'active');
  }

  // Buku kosong
  await bookRepo.updateBook(booking.bookId, {
    status: 'dibaca',
    readBy: userId,
    readSince: now,
  });

  return bookingRepo.updateBookingStatus(bookingId, 'active');
};

export const finishReading = async (bookingId: number, userId: number) => {
  const booking = await bookingRepo.findBookingById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Forbidden');
  if (booking.status !== 'active') throw new Error('Booking is not active');

  await bookRepo.updateBook(booking.bookId, {
    status: 'ready',
    readBy: null,
    readSince: null,
  });

  return bookingRepo.updateBookingStatus(bookingId, 'done');
};
