import { Router, Response } from 'express';
import * as bookingService from './booking.service';
import { authenticate, authorizeLibrarian, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /books/:bookId/bookings/schedule — PUBLIC, jadwal booking aktif/akan datang
router.get('/:bookId/bookings/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const schedule = await bookingService.getBookSchedule(Number(req.params.bookId));
    res.json(schedule);
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /books/:bookId/bookings — admin/librarian only
router.get('/:bookId/bookings', authenticate, authorizeLibrarian, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await bookingService.getBookingsByBookId(Number(req.params.bookId));
    res.json(bookings);
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /books/bookings/me — booking milik user yang login
router.get('/bookings/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user!.user_id);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /books/:bookId/bookings
router.post('/:bookId/bookings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookedFrom, bookedUntil, userName } = req.body;
    if (!bookedFrom || !bookedUntil) {
      res.status(400).json({ error: 'bookedFrom and bookedUntil are required' });
      return;
    }

    const booking = await bookingService.createBooking({
      bookId: Number(req.params.bookId),
      userId: req.user!.user_id,
      userName: userName || `User #${req.user!.user_id}`,
      bookedFrom: new Date(bookedFrom),
      bookedUntil: new Date(bookedUntil),
    });
    res.status(201).json(booking);
  } catch (err: any) {
    if (err.message === 'Book not found') {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    if (err.message === 'Book is already booked on that time') {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err.message === 'bookedFrom must be before bookedUntil') {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /books/bookings/:bookingId/start
router.patch('/bookings/:bookingId/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await bookingService.startReading(
      Number(req.params.bookingId),
      req.user!.user_id
    );
    res.json(booking);
  } catch (err: any) {
    if (err.message === 'Booking not found') {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message === 'Forbidden') {
      res.status(403).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message });
  }
});

// PATCH /books/bookings/:bookingId/finish
router.patch('/bookings/:bookingId/finish', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await bookingService.finishReading(
      Number(req.params.bookingId),
      req.user!.user_id
    );
    res.json(booking);
  } catch (err: any) {
    if (err.message === 'Booking not found') {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message === 'Forbidden') {
      res.status(403).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /books/bookings/:bookingId
router.delete('/bookings/:bookingId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await bookingService.cancelBooking(
      Number(req.params.bookingId),
      req.user!.user_id,
      req.user!.role
    );
    res.status(204).send();
  } catch (err: any) {
    if (err.message === 'Booking not found') {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message === 'Forbidden') {
      res.status(403).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: err.message });
  }
});

export default router;
