import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as bookService from './book.service';
import { authenticate, authorizeLibrarian, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ─── memoryStorage untuk POST (bookId belum ada saat upload) ─────────────────
const memoryUpload = multer({ storage: multer.memoryStorage() });

// ─── diskStorage untuk PUT (bookId sudah ada di req.params.id) ───────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bookId = req.params.id;
    const dir = path.join(__dirname, '..', '..', 'uploads', 'books', bookId, 'cover');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover${ext}`);
  },
});
const diskUpload = multer({ storage: diskStorage });

// GET /books
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const books = await bookService.getAllBooks();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /books/search?title=xxx
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const title = req.query.title as string;
    if (!title) {
      res.status(400).json({ error: 'Title query is required' });
      return;
    }
    const books = await bookService.searchBooks(title);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /books/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const book = await bookService.getBookById(Number(req.params.id));
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /books — pakai memoryStorage, tulis ke disk setelah book ID ada
router.post('/', authenticate, authorizeLibrarian, memoryUpload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, description, genre } = req.body;
    if (!title || !author) {
      res.status(400).json({ error: 'Title and author are required' });
      return;
    }

    // Buat book dulu → dapat ID
    const book = await bookService.createBook({ title, author, description, genre });

    // Kalau ada cover, tulis buffer ke disk dengan path yang benar
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const finalDir = path.join(__dirname, '..', '..', 'uploads', 'books', String(book.id), 'cover');
      fs.mkdirSync(finalDir, { recursive: true });
      fs.writeFileSync(path.join(finalDir, `cover${ext}`), req.file.buffer);

      const coverUrl = `/uploads/books/${book.id}/cover/cover${ext}`;
      await bookService.updateBook(book.id, { coverUrl });

      return res.status(201).json({ ...book, coverUrl });
    }

    res.status(201).json(book);
  } catch (err) {
    console.error('POST /books error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /books/:id — pakai diskStorage, bookId sudah ada
router.put('/:id', authenticate, authorizeLibrarian, diskUpload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, author, description, genre } = req.body;

    let coverUrl: string | undefined;
    if (req.file) {
      coverUrl = `/uploads/books/${id}/cover/${req.file.filename}`;
    }

    const book = await bookService.updateBook(id, { title, author, description, genre, coverUrl });
    res.json(book);
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /books/:id/read/start — mulai baca langsung
router.patch('/:id/read/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const book = await bookService.startDirectRead(Number(req.params.id), req.user!.user_id);
    res.json(book);
  } catch (err: any) {
    if (err.message === 'Book not found') { res.status(404).json({ error: err.message }); return; }
    if (err.message === 'Book is currently being read') { res.status(409).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /books/:id/read/stop — selesai/keluar baca langsung
router.patch('/:id/read/stop', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const book = await bookService.stopDirectRead(Number(req.params.id), req.user!.user_id);
    res.json(book);
  } catch (err: any) {
    if (err.message === 'Book not found') { res.status(404).json({ error: err.message }); return; }
    if (err.message === 'Forbidden') { res.status(403).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /books/:id
router.delete('/:id', authenticate, authorizeLibrarian, async (req: AuthRequest, res: Response) => {
  try {
    await bookService.deleteBook(Number(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
