# Perpustakaan Xina

Sistem manajemen perpustakaan digital dengan arsitektur microservices.

## Stack

| Service | Teknologi | Port |
|---------|-----------|------|
| Auth    | Go (Gin)  | 8080 |
| User    | Spring Boot (Java) | 8081 |
| Book    | NestJS (TypeScript) | 8082 |
| Frontend | Next.js  | 3000 |
| DB Auth | PostgreSQL | 5435 |
| DB User | PostgreSQL | 5433 |
| DB Book | PostgreSQL | 5434 |

## Prasyarat

- Docker & Docker Compose
- Git

## Cara Clone & Run

### 1. Clone repo

```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
```

### 2. Setup environment variables

```bash
# Copy file contoh, lalu isi nilainya
cp .env.example .env
```

Edit `.env`:

```env
JWT_SECRET=ganti-dengan-secret-panjang-minimal-32-karakter
POSTGRES_PASSWORD=ganti-dengan-password-database
```

### 3. Jalankan semua service

```bash
docker compose up --build
```

Tunggu sampai semua service healthy, biasanya 1-2 menit pertama kali.

### 4. Akses aplikasi

- **Frontend**: http://localhost:3000
- **Auth API**: http://localhost:8080
- **User API**: http://localhost:8081
- **Book API**: http://localhost:8082

## Stop aplikasi

```bash
docker compose down
```

Untuk hapus data database juga:

```bash
docker compose down -v
```

## Development (tanpa Docker)

Setiap service bisa dijalankan sendiri. Lihat README masing-masing di:
- `backend/auth/` — Go
- `backend/user/` — Spring Boot (butuh Java 17+)
- `backend/book/` — NestJS (butuh Node.js 18+)
- `frontend/` — Next.js

## Struktur Proyek

```
perpustakaan/
├── .env.example          # Template environment variables
├── docker-compose.yml    # Orchestrasi semua service
├── backend/
│   ├── auth/             # Auth service (Go)
│   ├── user/             # User service (Spring Boot)
│   └── book/             # Book service (NestJS)
└── frontend/             # Next.js frontend
```