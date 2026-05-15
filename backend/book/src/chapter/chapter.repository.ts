import prisma from '../prisma/prisma.service';

export const findChaptersByBookId = (bookId: number) => {
  return prisma.chapter.findMany({
    where: { bookId },
    orderBy: { chapterNumber: 'asc' },
  });
};

export const findChapterById = (id: number) => {
  return prisma.chapter.findUnique({
    where: { id },
  });
};

export const createChapter = (data: {
  bookId: number;
  title: string;
  chapterNumber: number;
  content: string;
  pdfUrl?: string | null;
}) => {
  return prisma.chapter.create({ data });
};

export const updateChapter = (id: number, data: {
  title?: string;
  chapterNumber?: number;
  content?: string;
  pdfUrl?: string | null;
}) => {
  return prisma.chapter.update({ where: { id }, data });
};

export const deleteChapter = (id: number) => {
  return prisma.chapter.delete({ where: { id } });
};