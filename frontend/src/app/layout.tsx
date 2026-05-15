// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perpustakaan",
  description: "Sistem manajemen perpustakaan digital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-stone-300 antialiased">
        {children}
      </body>
    </html>
  );
}