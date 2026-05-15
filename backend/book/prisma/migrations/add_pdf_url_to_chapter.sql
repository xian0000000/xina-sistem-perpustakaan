-- Migration: tambah kolom pdfUrl ke tabel Chapter
-- Jalankan ini di database PostgreSQL sebelum deploy backend baru
-- atau gunakan: npx prisma migrate dev --name add_pdf_url

ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "Chapter" ALTER COLUMN "content" SET DEFAULT '';
