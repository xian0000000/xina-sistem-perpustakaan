// internal/repository/user_repository.go
package repository

import (
	"auth/internal/model"
	"database/sql"
	"time"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	query := `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at`
	return r.db.QueryRow(query, user.Name, user.Email, user.Password, user.Role).
		Scan(&user.ID, &user.CreatedAt)
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, name, email, password, role, created_at FROM users WHERE email = $1`
	err := r.db.QueryRow(query, email).
		Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // user tidak ditemukan
	}
	return user, err
}

// internal/repository/user_repository.go — tambah setelah FindByEmail

func (r *UserRepository) FindByID(id int) (*model.User, error) {
	user := &model.User{}
	query := `SELECT id, name, email, password, role, created_at FROM users WHERE id = $1`
	err := r.db.QueryRow(query, id).
		Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

// internal/repository/user_repository.go

// Simpan refresh token baru ke DB
func (r *UserRepository) SaveRefreshToken(userID int, token string, expiresAt time.Time) error {
	query := `
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)`
	_, err := r.db.Exec(query, userID, token, expiresAt)
	return err
}

// Cari refresh token — sekaligus cek apakah masih valid
func (r *UserRepository) FindRefreshToken(token string) (*model.RefreshToken, error) {
	rt := &model.RefreshToken{}
	query := `
        SELECT id, user_id, token, expires_at
        FROM refresh_tokens
        WHERE token = $1 AND expires_at > NOW()`
	err := r.db.QueryRow(query, token).
		Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return rt, err
}

// Hapus refresh token (logout)
func (r *UserRepository) DeleteRefreshToken(token string) error {
	_, err := r.db.Exec(`DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

// Hapus semua refresh token milik user (logout semua device)
func (r *UserRepository) DeleteAllRefreshTokens(userID int) error {
	_, err := r.db.Exec(`DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}
func (r *UserRepository) Delete(id int) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}
func (r *UserRepository) UpdateEmailAndRole(userID int, email, role string) error {
	_, err := r.db.Exec(
		`UPDATE users SET email = $1, role = $2 WHERE id = $3`,
		email, role, userID,
	)
	return err
}
