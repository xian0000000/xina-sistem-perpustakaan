import prisma from '../prisma/prisma.service';

// Jadwal booking publik — waiting/active yang belum expired
export const findUpcomingBookingsByBookId = (bookId: number) => {
  const now = new Date();
  return prisma.booking.findMany({
    where: {
      bookId,
      status: { in: ['waiting', 'active'] },
      bookedUntil: { gt: now },
    },
    orderBy: { bookedFrom: 'asc' },
  });
};

export const findBookingsByBookId = (bookId: number) => {
  return prisma.booking.findMany({
    where: { bookId },
    orderBy: { bookedFrom: 'asc' },
  });
};

export const findBookingsByUserId = (userId: number) => {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { bookedFrom: 'asc' },
  });
};

export const findBookingById = (id: number) => {
  return prisma.booking.findUnique({
    where: { id },
  });
};

export const findOverlappingBooking = (bookId: number, bookedFrom: Date, bookedUntil: Date, excludeId?: number) => {
  return prisma.booking.findFirst({
    where: {
      bookId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ['waiting', 'active'] },
      AND: [
        { bookedFrom: { lt: bookedUntil } },
        { bookedUntil: { gt: bookedFrom } },
      ],
    },
  });
};

export const createBooking = (data: {
  bookId: number;
  userId: number;
  userName: string;
  bookedFrom: Date;
  bookedUntil: Date;
}) => {
  return prisma.booking.create({ data });
};

export const updateBookingStatus = (id: number, status: string) => {
  return prisma.booking.update({
    where: { id },
    data: { status },
  });
};

export const deleteBooking = (id: number) => {
  return prisma.booking.delete({ where: { id } });
};

/**
 * Cek apakah user masih punya booking yang valid (waiting/active)
 * untuk buku tertentu, dan waktu booking belum habis.
 * Dipakai oleh stopDirectRead agar buku tidak dilepas prematur.
 */
export const findActiveBookingByUserAndBook = (userId: number, bookId: number) => {
  const now = new Date();
  return prisma.booking.findFirst({
    where: {
      userId,
      bookId,
      status: { in: ['waiting', 'active'] },
      bookedUntil: { gt: now },   // waktu belum habis
    },
  });
};
