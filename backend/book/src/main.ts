import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bookRouter from './book/book.controller';
import chapterRouter from './chapter/chapter.controller';
import bookingRouter from './booking/booking.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8082;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/books', bookRouter);
app.use('/books', chapterRouter);
app.use('/books', bookingRouter);

app.listen(PORT, () => {
  console.log(`Book service running on port ${PORT}`);
});