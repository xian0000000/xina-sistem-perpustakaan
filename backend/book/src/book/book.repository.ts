import prisma from '../prisma/prisma.service';

export const findAllBooks = () => {
  return prisma.book.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      coverUrl: true,
      genre: true,
      status: true,
      readBy: true,
      readSince: true,
      createdAt: true,
    },
  });
};

export const findBookById = (id: number) => {
  return prisma.book.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { chapterNumber: 'asc' },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
        },
      },
    },
  });
};

export const searchBooksByTitle = (title: string) => {
  return prisma.book.findMany({
    where: {
      title: {
        contains: title,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      coverUrl: true,
      genre: true,
      status: true,
      createdAt: true,
    },
  });
};

export const createBook = (data: {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
}) => {
  return prisma.book.create({ data });
};

export const updateBook = (id: number, data: {
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
  status?: string;
  readBy?: number | null;
  readSince?: Date | null;
}) => {
  return prisma.book.update({ where: { id }, data });
};

export const deleteBook = (id: number) => {
  return prisma.book.delete({ where: { id } });
};