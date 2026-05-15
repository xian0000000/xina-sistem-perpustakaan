import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as chapterService from './chapter.service';
import { authenticate, authorizeLibrarian, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ─── Upload PDF untuk chapter ────────────────────────────────────────────────
// POST /books/:bookId/chapters/upload-pdf
// Menyimpan PDF ke: uploads/books/:bookId/pdf/<timestamp>.pdf
// Mengembalikan: { url: "/uploads/books/:bookId/pdf/..." }
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bookId = req.params.bookId;
    const dir = path.join(__dirname, '..', '..', 'uploads', 'books', bookId, 'pdf');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.pdf`);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // max 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Hanya file PDF yang diizinkan'));
    }
    cb(null, true);
  },
});

router.post(
  '/:bookId/chapters/upload-pdf',
  authenticate,
  authorizeLibrarian,
  pdfUpload.single('pdf'),
  (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'Tidak ada file yang dikirim' });
      return;
    }
    const bookId = req.params.bookId;
    const filename = req.file.filename;
    res.json({ url: `/uploads/books/${bookId}/pdf/${filename}` });
  }
);

// ─── Upload gambar untuk konten chapter ──────────────────────────────────────
// POST /books/:bookId/chapters/upload-image
// Menyimpan gambar ke: uploads/books/:bookId/images/<timestamp>-<filename>
// Mengembalikan: { url: "/uploads/books/:bookId/images/..." }
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bookId = req.params.bookId;
    const dir = path.join(__dirname, '..', '..', 'uploads', 'books', bookId, 'images');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Hanya file gambar yang diizinkan'));
    }
    cb(null, true);
  },
});

router.post(
  '/:bookId/chapters/upload-image',
  authenticate,
  authorizeLibrarian,
  imageUpload.single('image'),
  (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'Tidak ada file yang dikirim' });
      return;
    }
    const bookId = req.params.bookId;
    const filename = req.file.filename;
    // Return path lengkap agar bisa di-fetch via static server
    res.json({ url: `/uploads/books/${bookId}/images/${filename}` });
  }
);

// GET /books/:bookId/chapters
router.get('/:bookId/chapters', async (req: AuthRequest, res: Response) => {
  try {
    const chapters = await chapterService.getChaptersByBookId(Number(req.params.bookId));
    res.json(chapters);
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /books/:bookId/chapters/:chapterId
router.get('/:bookId/chapters/:chapterId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const chapter = await chapterService.getChapterById(
      Number(req.params.bookId),
      Number(req.params.chapterId)
    );
    res.json(chapter);
  } catch (err: any) {
    if (err.message === 'Book not found' || err.message === 'Chapter not found') {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /books/:bookId/chapters
router.post('/:bookId/chapters', authenticate, authorizeLibrarian, async (req: AuthRequest, res: Response) => {
  try {
    const { title, chapterNumber, content, pdfUrl } = req.body;
    if (!title || !chapterNumber) {
      res.status(400).json({ error: 'Title and chapterNumber are required' });
      return;
    }
    if (!content && !pdfUrl) {
      res.status(400).json({ error: 'Either content or pdfUrl is required' });
      return;
    }

    const chapter = await chapterService.createChapter({
      bookId: Number(req.params.bookId),
      title,
      chapterNumber: Number(chapterNumber),
      content: content ?? '',
      pdfUrl: pdfUrl ?? null,
    });
    res.status(201).json(chapter);
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /books/:bookId/chapters/:chapterId
router.put('/:bookId/chapters/:chapterId', authenticate, authorizeLibrarian, async (req: AuthRequest, res: Response) => {
  try {
    const { title, chapterNumber, content, pdfUrl } = req.body;
    const chapter = await chapterService.updateChapter(
      Number(req.params.bookId),
      Number(req.params.chapterId),
      { title, chapterNumber: chapterNumber ? Number(chapterNumber) : undefined, content, pdfUrl }
    );
    res.json(chapter);
  } catch (err: any) {
    if (err.message === 'Chapter not found') {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /books/:bookId/chapters/:chapterId
router.delete('/:bookId/chapters/:chapterId', authenticate, authorizeLibrarian, async (req: AuthRequest, res: Response) => {
  try {
    await chapterService.deleteChapter(
      Number(req.params.bookId),
      Number(req.params.chapterId)
    );
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'Chapter not found') {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;