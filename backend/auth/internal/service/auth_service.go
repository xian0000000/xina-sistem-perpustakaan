// internal/service/auth_service.go
package service

import (
	"auth/internal/model"
	"auth/internal/repository"
	"auth/pkg/jwt"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo *repository.UserRepository
}

func NewAuthService(repo *repository.UserRepository) *AuthService {
	return &AuthService{repo: repo}
}

// internal/service/auth_service.go

func (s *AuthService) Register(req model.RegisterRequest) (*model.AuthResponse, error) {
	existing, _ := s.repo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashed),
		Role:     "member",
	}

	if err := s.repo.Create(user); err != nil {
		return nil, err
	}
	if err := syncToUserService(user); err != nil {
		s.repo.Delete(user.ID)
		return nil, fmt.Errorf("gagal menghubungi user service, coba lagi nanti")
	}

	return s.generateTokenPair(user) // helper bersama
}

func (s *AuthService) Login(req model.LoginRequest) (*model.AuthResponse, error) {
	user, err := s.repo.FindByEmail(req.Email)

	if err != nil || user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return s.generateTokenPair(user)
}

// ✅ Fungsi baru — tukar refresh token dengan access token baru
func (s *AuthService) RefreshToken(refreshTokenStr string) (*model.AuthResponse, error) {
	// Cek token ada & belum expired di DB
	rt, err := s.repo.FindRefreshToken(refreshTokenStr)
	if err != nil || rt == nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	// Ambil data user
	user, err := s.repo.FindByID(rt.UserID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	// Hapus refresh token lama (rotate — tiap refresh dapat token baru)
	s.repo.DeleteRefreshToken(refreshTokenStr)

	// Buat token pair baru
	return s.generateTokenPair(user)
}

// ✅ Fungsi baru — logout
func (s *AuthService) Logout(refreshTokenStr string) error {
	return s.repo.DeleteRefreshToken(refreshTokenStr)
}

// Helper — buat access token + refresh token sekaligus
func (s *AuthService) generateTokenPair(user *model.User) (*model.AuthResponse, error) {
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := jwt.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	// Simpan refresh token ke DB, berlaku 7 hari
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	if err := s.repo.SaveRefreshToken(user.ID, refreshToken, expiresAt); err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}
func syncToUserService(user *model.User) error {
	userServiceURL := os.Getenv("USER_SERVICE_URL")
	if userServiceURL == "" {
		userServiceURL = "http://localhost:8081"
	}

	payload := map[string]interface{}{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	resp, err := http.Post(
		userServiceURL+"/users/internal/create",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("http call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("user-service returned status %d", resp.StatusCode)
	}
	return nil
}
func (s *AuthService) DeleteUser(userID int) error {
	if err := s.repo.DeleteAllRefreshTokens(userID); err != nil {
		return err
	}
	return s.repo.Delete(userID)
}
func (s *AuthService) UpdateUser(userID int, req model.UpdateUserRequest) error {
	return s.repo.UpdateEmailAndRole(userID, req.Email, req.Role)
}
