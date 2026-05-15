// cmd/main.go
package main

import (
	"auth/internal/handler"
	"auth/internal/repository"
	"auth/internal/service"
	"auth/pkg/middleware"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, reading from environment")
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL tidak boleh kosong!")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}
	defer db.Close()

	// Ping DB — pastikan koneksi beneran berhasil
	if err := db.Ping(); err != nil {
		log.Fatal("DB tidak bisa diping:", err)
	}

	// ... sisa kode tetap sama

	// Dependency injection
	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true, // []string{"*"} ganti sesuai URL frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // wajib true biar cookie bisa dikirim
		MaxAge:           12 * time.Hour,
	}))

	// Public routes
	// cmd/main.go — tambah routes baru
	auth := r.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh) // ✅ baru
		auth.POST("/logout", authHandler.Logout)   // ✅ baru
	}

	// Protected routes — butuh token
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/me", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"user_id": c.GetInt("user_id"),
				"role":    c.GetString("user_role"),
			})
		})

		// Hanya librarian & admin
		api.GET("/books/manage", middleware.RequireRole("librarian", "admin"), func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "welcome, librarian!"})
		})
	}
	// Internal routes — dipanggil antar service, tanpa JWT
	internal := r.Group("/internal")
	{
		internal.DELETE("/users/:id", authHandler.DeleteUser)
		internal.PUT("/users/:id", authHandler.UpdateUser)
	}

	r.Run(":8080")
}
