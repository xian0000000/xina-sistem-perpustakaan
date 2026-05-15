import * as chapterRepo from './chapter.repository';
import * as bookRepo from '../book/book.repository';

export const getChaptersByBookId = async (bookId: number) => {
  const book = await bookRepo.findBookById(bookId);
  if (!book) throw new Error('Book not found');
  return chapterRepo.findChaptersByBookId(bookId);
};

export const getChapterById = async (bookId: number, chapterId: number) => {
  const book = await bookRepo.findBookById(bookId);
  if (!book) throw new Error('Book not found');

  const chapter = await chapterRepo.findChapterById(chapterId);
  if (!chapter || chapter.bookId !== bookId) throw new Error('Chapter not found');

  return chapter;
};

export const createChapter = async (data: {
  bookId: number;
  title: string;
  chapterNumber: number;
  content: string;
  pdfUrl?: string | null;
}) => {
  const book = await bookRepo.findBookById(data.bookId);
  if (!book) throw new Error('Book not found');
  return chapterRepo.createChapter(data);
};

export const updateChapter = async (bookId: number, chapterId: number, data: {
  title?: string;
  chapterNumber?: number;
  content?: string;
  pdfUrl?: string | null;
}) => {
  const chapter = await chapterRepo.findChapterById(chapterId);
  if (!chapter || chapter.bookId !== bookId) throw new Error('Chapter not found');
  return chapterRepo.updateChapter(chapterId, data);
};

export const deleteChapter = async (bookId: number, chapterId: number) => {
  const chapter = await chapterRepo.findChapterById(chapterId);
  if (!chapter || chapter.bookId !== bookId) throw new Error('Chapter not found');
  return chapterRepo.deleteChapter(chapterId);
};