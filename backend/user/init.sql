CREATE TABLE IF NOT EXISTS users (
    id         BIGINT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    role       VARCHAR(20) DEFAULT 'member',
    phone      VARCHAR(20),
    address    TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);